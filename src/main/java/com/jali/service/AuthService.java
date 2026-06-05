package com.jali.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.jali.dto.AuthResponse;
import com.jali.dto.LoginRequest;
import com.jali.dto.RegisterRequest;
import com.jali.entity.FamilyTree;
import com.jali.entity.Role;
import com.jali.entity.User;
import com.jali.repository.jpa.FamilyTreeRepository;
import com.jali.repository.jpa.UserRepository;
import com.jali.security.JwtService;

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
		if (userRepository.existsByEmail(request.email())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
		}

		User user = new User(
				request.email(),
				passwordEncoder.encode(request.password()),
				Role.USER);
		user = userRepository.save(user);

		FamilyTree familyTree = familyTreeRepository.save(
				new FamilyTree(user, defaultTreeName(user.getEmail())));

		String token = jwtService.generateToken(
				user.getId(), user.getEmail(), user.getRole(), familyTree.getId());

		return AuthResponse.bearer(
				token, user.getId(), user.getEmail(), user.getRole().name(), familyTree.getId());
	}

	public AuthResponse login(LoginRequest request) {
		User user = userRepository.findByEmail(request.email())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
		}

		FamilyTree familyTree = familyTreeRepository.findByOwnerId(user.getId())
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.INTERNAL_SERVER_ERROR, "Family tree not found for user"));

		String token = jwtService.generateToken(
				user.getId(), user.getEmail(), user.getRole(), familyTree.getId());

		return AuthResponse.bearer(
				token, user.getId(), user.getEmail(), user.getRole().name(), familyTree.getId());
	}

	private static String defaultTreeName(String email) {
		int at = email.indexOf('@');
		String localPart = at > 0 ? email.substring(0, at) : email;
		return localPart + "'s family tree";
	}
}
