package com.jali.dto;

import com.jali.neo4j.Person;

public record PersonResponse(
		String uuid,
		String fullName,
		String bio,
		String birthDate,
		String deathDate,
		String birthplace,
		String ethnicGroup,
		String biologicalSex,
		Double confidenceScore,
		Boolean isUnknownPlaceholder) {

	public static PersonResponse from(Person p) {
		return new PersonResponse(
				p.getUuid(),
				p.getFullName(),
				p.getBio(),
				p.getBirthDate(),
				p.getDeathDate(),
				p.getBirthplace(),
				p.getEthnicGroup(),
				p.getBiologicalSex(),
				p.getConfidenceScore(),
				p.getIsUnknownPlaceholder());
	}
}
