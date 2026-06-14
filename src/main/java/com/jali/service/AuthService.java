package com.jali.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.jali.dto.AuthResponse;
import com.jali.dto.LoginRequest;
import com.jali.dto.RegisterRequest;
import com.jali.dto.UserResponse;
import com.jali.entity.EmailVerificationToken;
import com.jali.entity.FamilyTree;
import com.jali.entity.PasswordResetToken;
import com.jali.entity.Role;
import com.jali.entity.User;
import com.jali.repository.jpa.EmailVerificationTokenRepository;
import com.jali.repository.jpa.FamilyTreeRepository;
import com.jali.repository.jpa.PasswordResetTokenRepository;
import com.jali.repository.jpa.UserRepository;
import com.jali.security.JwtService;
import com.jali.security.UserPrincipal;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final FamilyTreeRepository familyTreeRepository;
	private final EmailVerificationTokenRepository emailVerificationTokenRepository;
	private final PasswordResetTokenRepository passwordResetTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final EmailService emailService;

	public AuthService(
			UserRepository userRepository,
			FamilyTreeRepository familyTreeRepository,
			EmailVerificationTokenRepository emailVerificationTokenRepository,
			PasswordResetTokenRepository passwordResetTokenRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService,
			EmailService emailService) {
		this.userRepository = userRepository;
		this.familyTreeRepository = familyTreeRepository;
		this.emailVerificationTokenRepository = emailVerificationTokenRepository;
		this.passwordResetTokenRepository = passwordResetTokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.emailService = emailService;
	}

	// ── Registration ─────────────────────────────────────────────────────────

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		if (!request.termsAccepted()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You must accept the Terms of Service to register.");
		}

		String email = normalizeEmail(request.email());
		if (userRepository.existsByEmail(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
		}

		User user = new User(
				email,
				passwordEncoder.encode(request.password()),
				Role.USER);
		user.setTermsAcceptedAt(Instant.now());
		user = userRepository.save(user);

		FamilyTree familyTree = familyTreeRepository.save(
				new FamilyTree(user, defaultTreeName(user.getEmail())));

		// Send verification email (failure is logged, not thrown)
		sendVerificationEmail(user);

		String token = jwtService.generateToken(
				user.getId(), user.getEmail(), user.getRole(), familyTree.getId());

		return AuthResponse.bearer(
				token, user.getId(), user.getEmail(), user.getRole().name(), familyTree.getId());
	}

	// ── Login ─────────────────────────────────────────────────────────────────

	@Transactional
	public AuthResponse login(LoginRequest request) {
		String email = normalizeEmail(request.email());
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
		}

		FamilyTree familyTree = familyTreeRepository.findByOwnerId(user.getId())
				.orElseGet(() -> familyTreeRepository.save(
						new FamilyTree(user, defaultTreeName(user.getEmail()))));

		String token = jwtService.generateToken(
				user.getId(), user.getEmail(), user.getRole(), familyTree.getId());

		return AuthResponse.bearer(
				token, user.getId(), user.getEmail(), user.getRole().name(), familyTree.getId());
	}

	// ── Email verification ────────────────────────────────────────────────────

	/**
	 * Marks the user's email as verified. Returns a simple success message.
	 * The token is invalidated after use.
	 */
	@Transactional
	public String verifyEmail(String rawToken) {
		EmailVerificationToken record = emailVerificationTokenRepository
				.findByToken(rawToken)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired link."));

		if (record.isUsed()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This link has already been used.");
		}
		if (record.isExpired()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This link has expired. Request a new verification email.");
		}

		User user = userRepository.findById(record.getUserId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found."));

		if (user.getEmailVerifiedAt() != null) {
			// Already verified — idempotent, just return success
			return "Email already verified.";
		}

		user.setEmailVerifiedAt(Instant.now());
		userRepository.save(user);

		record.setUsedAt(Instant.now());
		emailVerificationTokenRepository.save(record);

		return "Email verified successfully.";
	}

	/**
	 * Re-sends a verification email for an authenticated user whose email
	 * is not yet verified. Replaces any existing pending token.
	 */
	@Transactional
	public void resendVerification(UserPrincipal principal) {
		User user = userRepository.findById(principal.userId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found."));

		if (user.getEmailVerifiedAt() != null) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already verified.");
		}

		sendVerificationEmail(user);
	}

	// ── Password reset ────────────────────────────────────────────────────────

	/**
	 * Sends a password-reset email if the address is registered.
	 * Always returns 200 to avoid leaking whether the email exists.
	 */
	@Transactional
	public void forgotPassword(String rawEmail) {
		String email = normalizeEmail(rawEmail);
		userRepository.findByEmail(email).ifPresent(user -> {
			// Invalidate any existing reset tokens for this user
			passwordResetTokenRepository.deleteByUserId(user.getId());

			String rawToken = UUID.randomUUID().toString().replace("-", "");
			PasswordResetToken record = new PasswordResetToken(
					user.getId(),
					rawToken,
					Instant.now().plus(1, ChronoUnit.HOURS));
			passwordResetTokenRepository.save(record);

			emailService.sendPasswordResetEmail(email, rawToken);
		});
	}

	/**
	 * Validates the reset token and sets the new password.
	 */
	@Transactional
	public void resetPassword(String rawToken, String newPassword) {
		PasswordResetToken record = passwordResetTokenRepository
				.findByToken(rawToken)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired link."));

		if (record.isUsed()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This link has already been used.");
		}
		if (record.isExpired()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This link has expired. Request a new password reset.");
		}

		User user = userRepository.findById(record.getUserId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found."));

		user.setPasswordHash(passwordEncoder.encode(newPassword));
		userRepository.save(user);

		record.setUsedAt(Instant.now());
		passwordResetTokenRepository.save(record);
	}

	// ── Existing helpers ──────────────────────────────────────────────────────

	public UserResponse getCurrentUser(UserPrincipal principal) {
		FamilyTree familyTree = requireFamilyTreeForUser(principal.userId());
		return toUserResponse(principal, familyTree);
	}

	@Transactional
	public UserResponse updateFamilyTreeName(UserPrincipal principal, String name) {
		if (name == null || name.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tree name is required");
		}

		FamilyTree familyTree = requireFamilyTreeForUser(principal.userId());
		if (!familyTree.getId().equals(principal.familyTreeId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Family tree access denied");
		}

		familyTree.setName(name.trim());
		familyTreeRepository.save(familyTree);
		return toUserResponse(principal, familyTree);
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	private void sendVerificationEmail(User user) {
		// Replace any pending tokens before issuing a new one
		emailVerificationTokenRepository.deleteByUserId(user.getId());

		String rawToken = UUID.randomUUID().toString().replace("-", "");
		EmailVerificationToken record = new EmailVerificationToken(
				user.getId(),
				rawToken,
				Instant.now().plus(24, ChronoUnit.HOURS));
		emailVerificationTokenRepository.save(record);

		emailService.sendVerificationEmail(user.getEmail(), rawToken);
	}

	private FamilyTree requireFamilyTreeForUser(Long userId) {
		return familyTreeRepository.findByOwnerId(userId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.INTERNAL_SERVER_ERROR, "Family tree not found for user"));
	}

	private static UserResponse toUserResponse(UserPrincipal principal, FamilyTree familyTree) {
		return new UserResponse(
				principal.userId(),
				principal.email(),
				principal.role().name(),
				principal.familyTreeId(),
				familyTree.getName());
	}

	private static String defaultTreeName(String email) {
		int at = email.indexOf('@');
		String localPart = at > 0 ? email.substring(0, at) : email;
		return localPart + "'s family tree";
	}

	private static String normalizeEmail(String email) {
		return email.trim().toLowerCase();
	}
}
