package com.jali.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.jali.repository.neo4j.PersonRepository;

@Service
public class RelationshipService {

	private final PersonGraphService personGraphService;
	private final PersonRepository personRepository;
	private final RelationshipValidationService relationshipValidationService;
	private final PersonGracePeriodService personGracePeriodService;

	public RelationshipService(
			PersonGraphService personGraphService,
			PersonRepository personRepository,
			RelationshipValidationService relationshipValidationService,
			PersonGracePeriodService personGracePeriodService) {
		this.personGraphService = personGraphService;
		this.personRepository = personRepository;
		this.relationshipValidationService = relationshipValidationService;
		this.personGracePeriodService = personGracePeriodService;
	}

	@Transactional("neo4jTransactionManager")
	public void create(
			String fromUuid,
			String toUuid,
			String relationshipType,
			Long familyTreeId) {
		relationshipValidationService.validateCreate(fromUuid, toUuid, relationshipType, familyTreeId);

		// Ensure both endpoints exist before creating the edge.
		personGraphService.requireInTree(fromUuid, familyTreeId);
		personGraphService.requireInTree(toUuid, familyTreeId);

		switch (relationshipType.toUpperCase()) {
			case "PARENT_OF" -> personRepository.createParentOfEdge(fromUuid, toUuid, familyTreeId);
			case "MARRIED_TO" -> personRepository.createMarriedToEdge(fromUuid, toUuid, familyTreeId);
			case "SIBLING_OF" -> personRepository.createSiblingOfEdge(fromUuid, toUuid, familyTreeId);
			default -> throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Unknown relationship type. Use PARENT_OF, MARRIED_TO, or SIBLING_OF");
		}
	}

	/**
	 * Sets or clears the parentRole ("MOTHER", "FATHER", or null to unset) on an
	 * existing PARENT_OF edge. The edge must already exist.
	 */
	@Transactional("neo4jTransactionManager")
	public void updateParentRole(
			String fromUuid,
			String toUuid,
			String parentRole,
			Long familyTreeId) {
		personGraphService.requireInTree(fromUuid, familyTreeId);
		personGraphService.requireInTree(toUuid, familyTreeId);

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
			String anchorUuid,
			String fromUuid,
			String toUuid,
			String relationshipType,
			Long familyTreeId) {
		var anchor = personGraphService.requireInTree(anchorUuid, familyTreeId);
		personGracePeriodService.requireWithinGracePeriodToRemoveLinks(anchor);

		personGraphService.requireInTree(fromUuid, familyTreeId);
		personGraphService.requireInTree(toUuid, familyTreeId);

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
