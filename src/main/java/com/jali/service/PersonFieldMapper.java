package com.jali.service;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.jali.neo4j.Person;

@Service
public class PersonFieldMapper {

	private static String optionalString(Object value) {
		if (value == null) {
			return null;
		}
		String trimmed = ((String) value).trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	/** Life/death markers and years — blank = not set; "living" / "unknown" normalized. */
	private static String vitalYearString(Object value) {
		String trimmed = optionalString(value);
		if (trimmed == null) {
			return null;
		}
		if ("living".equalsIgnoreCase(trimmed)) {
			return "living";
		}
		if ("unknown".equalsIgnoreCase(trimmed)) {
			return "unknown";
		}
		return trimmed;
	}

	public void applyCreateFields(Person person, Map<String, Object> input) {
		String birthDate = vitalYearString(input.get("birthDate"));
		if (birthDate != null) {
			person.setBirthDate(birthDate);
		}
		String deathDate = vitalYearString(input.get("deathDate"));
		if (deathDate != null) {
			person.setDeathDate(deathDate);
		}
		String birthplace = optionalString(input.get("birthplace"));
		if (birthplace != null) {
			person.setBirthplace(birthplace);
		}
		String ethnicGroup = optionalString(input.get("ethnicGroup"));
		if (ethnicGroup != null) {
			person.setEthnicGroup(ethnicGroup);
		}
		String bio = optionalString(input.get("bio"));
		if (bio != null) {
			person.setBio(bio);
		}
		String biologicalSex = optionalString(input.get("biologicalSex"));
		if (biologicalSex != null) {
			person.setBiologicalSex(biologicalSex);
		}
		if (input.get("isUnknownPlaceholder") != null) {
			person.setIsUnknownPlaceholder((Boolean) input.get("isUnknownPlaceholder"));
		}
	}

	public void applyUpdateFields(Person person, Map<String, Object> input) {
		if (input.containsKey("fullName") && input.get("fullName") != null) {
			String fullName = ((String) input.get("fullName")).trim();
			if (fullName.isEmpty()) {
				throw new IllegalArgumentException("Full name cannot be empty");
			}
			person.setFullName(fullName);
		}
		if (input.containsKey("birthDate")) {
			person.setBirthDate(vitalYearString(input.get("birthDate")));
		}
		if (input.containsKey("deathDate")) {
			person.setDeathDate(vitalYearString(input.get("deathDate")));
		}
		if (input.containsKey("birthplace")) {
			person.setBirthplace(optionalString(input.get("birthplace")));
		}
		if (input.containsKey("ethnicGroup")) {
			person.setEthnicGroup(optionalString(input.get("ethnicGroup")));
		}
		if (input.containsKey("bio")) {
			person.setBio(optionalString(input.get("bio")));
		}
		if (input.containsKey("biologicalSex")) {
			person.setBiologicalSex(optionalString(input.get("biologicalSex")));
		}
	}
}
