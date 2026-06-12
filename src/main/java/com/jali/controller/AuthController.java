package com.jali.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.jali.dto.AuthResponse;
import com.jali.dto.LoginRequest;
import com.jali.dto.RegisterRequest;
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
		return authService.getCurrentUser(principal);
	}

	@PatchMapping("/family-tree")
	public UserResponse updateFamilyTreeName(
			@Valid @RequestBody UpdateFamilyTreeNameRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {
		return authService.updateFamilyTreeName(principal, request.name());
	}
}
