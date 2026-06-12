package com.jali.dto;

import jakarta.validation.constraints.NotBlank;

public record CreatePersonRequest(
		@NotBlank String fullName,
		String bio,
		String birthDate,
		String deathDate,
		String birthplace,
		String ethnicGroup,
		String biologicalSex,
		Boolean isUnknownPlaceholder) {
}
