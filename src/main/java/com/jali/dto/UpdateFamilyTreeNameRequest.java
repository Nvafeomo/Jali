package com.jali.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateFamilyTreeNameRequest(@NotBlank String name) {
}
