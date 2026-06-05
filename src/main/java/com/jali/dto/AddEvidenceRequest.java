package com.jali.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AddEvidenceRequest(
		@NotBlank String fromUuid,
		@NotBlank String toUuid,
		@NotBlank String relationshipType,
		@NotNull String evidenceType,
		String source) {
}
