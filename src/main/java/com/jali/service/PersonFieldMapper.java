package com.jali.service;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.jali.neo4j.Person;

@Service
public class PersonFieldMapper {

	public void applyCreateFields(Person person, Map<String, Object> input) {
		if (input.get("birthDate") != null) {
			person.setBirthDate((String) input.get("birthDate"));
		}
		if (input.get("deathDate") != null) {
			person.setDeathDate((String) input.get("deathDate"));
		}
		if (input.get("birthplace") != null) {
			person.setBirthplace((String) input.get("birthplace"));
		}
		if (input.get("ethnicGroup") != null) {
			person.setEthnicGroup((String) input.get("ethnicGroup"));
		}
		if (input.get("bio") != null) {
			person.setBio((String) input.get("bio"));
		}
		if (input.get("biologicalSex") != null) {
			person.setBiologicalSex((String) input.get("biologicalSex"));
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
			person.setBirthDate((String) input.get("birthDate"));
		}
		if (input.containsKey("deathDate")) {
			person.setDeathDate((String) input.get("deathDate"));
		}
		if (input.containsKey("birthplace")) {
			person.setBirthplace((String) input.get("birthplace"));
		}
		if (input.containsKey("ethnicGroup")) {
			person.setEthnicGroup((String) input.get("ethnicGroup"));
		}
		if (input.containsKey("bio")) {
			person.setBio((String) input.get("bio"));
		}
		if (input.containsKey("biologicalSex")) {
			person.setBiologicalSex((String) input.get("biologicalSex"));
		}
	}
}
