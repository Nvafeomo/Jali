package com.jali.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.jali.repository.neo4j.PersonRepository;

@Service
public class RelationshipValidationService {

	private final PersonRepository personRepository;

	public RelationshipValidationService(PersonRepository personRepository) {
		this.personRepository = personRepository;
	}

	public void validateCreate(
			String fromUuid,
			String toUuid,
			String relationshipType,
			Long familyTreeId) {
		if (fromUuid.equals(toUuid)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot relate a person to themselves");
		}

		switch (relationshipType.toUpperCase()) {
			case "PARENT_OF" -> validateParentOf(fromUuid, toUuid, familyTreeId);
			case "MARRIED_TO" -> validateMarriedTo(fromUuid, toUuid, familyTreeId);
			case "SIBLING_OF" -> validateSiblingOf(fromUuid, toUuid, familyTreeId);
			default -> throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Unknown relationship type. Use PARENT_OF, MARRIED_TO, or SIBLING_OF");
		}
	}

	private void validateParentOf(String fromUuid, String toUuid, Long familyTreeId) {
		if (personRepository.hasDirectParentOf(fromUuid, toUuid, familyTreeId)) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					"This parent-child relationship already exists");
		}
		if (personRepository.wouldCreateParentCycle(fromUuid, toUuid, familyTreeId)) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Cannot add parent-child: would create a cycle (someone cannot be both an ancestor and descendant of the same person)");
		}
		if (personRepository.hasSiblingBetween(fromUuid, toUuid, familyTreeId)) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Cannot add parent-child: these people are already recorded as siblings");
		}
		if (personRepository.hasMarriageBetween(fromUuid, toUuid, familyTreeId)) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Cannot add parent-child: these people are already recorded as spouses");
		}
	}

	private void validateSiblingOf(String fromUuid, String toUuid, Long familyTreeId) {
		if (personRepository.hasSiblingBetween(fromUuid, toUuid, familyTreeId)) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					"This sibling relationship already exists");
		}
		if (personRepository.hasParentChildBetween(fromUuid, toUuid, familyTreeId)) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Cannot add sibling: these people are already in a parent-child relationship");
		}
	}

	private void validateMarriedTo(String fromUuid, String toUuid, Long familyTreeId) {
		if (personRepository.hasMarriageBetween(fromUuid, toUuid, familyTreeId)) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					"This marriage relationship already exists");
		}
		if (personRepository.hasParentChildBetween(fromUuid, toUuid, familyTreeId)) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Cannot add marriage: these people are already in a parent-child relationship");
		}
	}
}
