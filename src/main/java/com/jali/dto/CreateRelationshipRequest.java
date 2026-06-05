package com.jali.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateRelationshipRequest(
		@NotBlank String fromUuid,
		@NotBlank String toUuid,
		@NotNull String relationshipType) {
}
