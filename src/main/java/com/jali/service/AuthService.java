package com.jali.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.jali.dto.AuthResponse;
import com.jali.dto.LoginRequest;
import com.jali.dto.RegisterRequest;
import com.jali.dto.UserResponse;
import com.jali.entity.FamilyTree;
import com.jali.entity.Role;
import com.jali.entity.User;
import com.jali.repository.jpa.FamilyTreeRepository;
import com.jali.repository.jpa.UserRepository;
import com.jali.security.JwtService;
import com.jali.security.UserPrincipal;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final FamilyTreeRepository familyTreeRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	public AuthService(
			UserRepository userRepository,
			FamilyTreeRepository familyTreeRepository,
			PasswordEncoder passwordEncoder,
			JwtService jwtService) {
		this.userRepository = userRepository;
		this.familyTreeRepository = familyTreeRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
	}

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

		String token = jwtService.generateToken(
				user.getId(), user.getEmail(), user.getRole(), familyTree.getId());

		return AuthResponse.bearer(
				token, user.getId(), user.getEmail(), user.getRole().name(), familyTree.getId());
	}

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
