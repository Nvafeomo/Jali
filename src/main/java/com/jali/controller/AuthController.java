package com.jali.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.jali.dto.AuthResponse;
import com.jali.dto.ForgotPasswordRequest;
import com.jali.dto.LoginRequest;
import com.jali.dto.RegisterRequest;
import com.jali.dto.ResetPasswordRequest;
import com.jali.dto.UpdateFamilyTreeNameRequest;
import com.jali.dto.UserResponse;
import com.jali.security.UserPrincipal;
import com.jali.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	// ── Existing ──────────────────────────────────────────────────────────────

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@GetMapping("/me")
	public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
		if (principal == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
		}
		return authService.getCurrentUser(principal);
	}

	@PatchMapping("/family-tree")
	public UserResponse updateFamilyTreeName(
			@Valid @RequestBody UpdateFamilyTreeNameRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {
		return authService.updateFamilyTreeName(principal, request.name());
	}

	// ── Email verification ────────────────────────────────────────────────────

	/** GET /auth/verify-email?token=... — public, called from email link */
	@GetMapping("/verify-email")
	public void verifyEmail(@RequestParam String token) {
		authService.verifyEmail(token);
	}

	/** POST /auth/resend-verification — authenticated; resends if not yet verified */
	@PostMapping("/resend-verification")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void resendVerification(@AuthenticationPrincipal UserPrincipal principal) {
		if (principal == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
		}
		authService.resendVerification(principal);
	}

	// ── Password reset ────────────────────────────────────────────────────────

	/** POST /auth/forgot-password — public; always returns 200 to avoid leaking whether email exists */
	@PostMapping("/forgot-password")
	public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
		authService.forgotPassword(request.email());
	}

	/** POST /auth/reset-password — public; validates token and sets new password */
	@PostMapping("/reset-password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
		authService.resetPassword(request.token(), request.newPassword());
	}
}
