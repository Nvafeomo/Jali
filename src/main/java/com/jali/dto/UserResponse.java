package com.jali.dto;

public record UserResponse(
		Long userId,
		String email,
		String role,
		Long familyTreeId,
		String familyTreeName) {
}
