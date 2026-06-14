package com.jali.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.jali.repository.neo4j.PersonRepository;

@Service
public class RelationshipPersistenceService {

	private final PersonRepository personRepository;
	private final RelationshipInferenceService relationshipInferenceService;

	public RelationshipPersistenceService(
			PersonRepository personRepository,
			RelationshipInferenceService relationshipInferenceService) {
		this.personRepository = personRepository;
		this.relationshipInferenceService = relationshipInferenceService;
	}

	@Transactional("neo4jTransactionManager")
	public void create(
			String fromUuid,
			String toUuid,
			String relationshipType,
			Long familyTreeId,
			String parentRole) {
		switch (relationshipType.toUpperCase()) {
			case "PARENT_OF" -> {
				personRepository.createParentOfEdge(fromUuid, toUuid, familyTreeId);
				if (parentRole != null) {
					String normalised = parentRole.toUpperCase();
					if (!normalised.equals("MOTHER") && !normalised.equals("FATHER")) {
						throw new ResponseStatusException(
								HttpStatus.BAD_REQUEST,
								"parentRole must be MOTHER, FATHER, or null");
					}
					personRepository.setParentRole(fromUuid, toUuid, familyTreeId, normalised);
				}
				relationshipInferenceService.afterParentLinked(fromUuid, toUuid, familyTreeId);
			}
			case "MARRIED_TO" -> {
				personRepository.createMarriedToEdge(fromUuid, toUuid, familyTreeId);
				relationshipInferenceService.afterSpouseLinked(fromUuid, toUuid, familyTreeId);
			}
			case "SIBLING_OF" -> {
				personRepository.createSiblingOfEdge(fromUuid, toUuid, familyTreeId);
				relationshipInferenceService.afterSiblingLinked(fromUuid, toUuid, familyTreeId);
			}
			default -> throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Unknown relationship type. Use PARENT_OF, MARRIED_TO, or SIBLING_OF");
		}
	}

	@Transactional("neo4jTransactionManager")
	public void updateParentRole(
			String fromUuid,
			String toUuid,
			String parentRole,
			Long familyTreeId) {
		if (!personRepository.hasDirectParentOf(fromUuid, toUuid, familyTreeId)) {
			throw new ResponseStatusException(
					HttpStatus.NOT_FOUND,
					"No PARENT_OF relationship exists from " + fromUuid + " to " + toUuid);
		}

		String normalised = parentRole == null ? null : parentRole.toUpperCase();
		if (normalised != null && !normalised.equals("MOTHER") && !normalised.equals("FATHER")) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"parentRole must be MOTHER, FATHER, or null");
		}

		personRepository.setParentRole(fromUuid, toUuid, familyTreeId, normalised);
	}

	@Transactional("neo4jTransactionManager")
	public void delete(
			String fromUuid,
			String toUuid,
			String relationshipType,
			Long familyTreeId) {
		switch (relationshipType.toUpperCase()) {
			case "PARENT_OF" -> personRepository.deleteParentOfEdge(fromUuid, toUuid, familyTreeId);
			case "MARRIED_TO" -> personRepository.deleteMarriedToEdge(fromUuid, toUuid, familyTreeId);
			case "SIBLING_OF" -> personRepository.deleteSiblingOfEdge(fromUuid, toUuid, familyTreeId);
			default -> throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Unknown relationship type. Use PARENT_OF, MARRIED_TO, or SIBLING_OF");
		}
	}
}
