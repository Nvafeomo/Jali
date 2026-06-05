package com.jali.dto;

public record AuthResponse(
		String token,
		String tokenType,
		Long userId,
		String email,
		String role,
		Long familyTreeId) {

	public static AuthResponse bearer(String token, Long userId, String email, String role, Long familyTreeId) {
		return new AuthResponse(token, "Bearer", userId, email, role, familyTreeId);
	}
}
