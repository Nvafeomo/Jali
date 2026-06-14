package com.jali.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RelationshipService {

	private final PersonGraphService personGraphService;
	private final RelationshipValidationService relationshipValidationService;
	private final PersonGracePeriodService personGracePeriodService;
	private final RelationshipPersistenceService relationshipPersistenceService;

	public RelationshipService(
			PersonGraphService personGraphService,
			RelationshipValidationService relationshipValidationService,
			PersonGracePeriodService personGracePeriodService,
			RelationshipPersistenceService relationshipPersistenceService) {
		this.personGraphService = personGraphService;
		this.relationshipValidationService = relationshipValidationService;
		this.personGracePeriodService = personGracePeriodService;
		this.relationshipPersistenceService = relationshipPersistenceService;
	}

	public void create(
			String fromUuid,
			String toUuid,
			String relationshipType,
			Long familyTreeId,
			String parentRole) {
		relationshipValidationService.validateCreate(fromUuid, toUuid, relationshipType, familyTreeId);

		personGraphService.requireInTree(fromUuid, familyTreeId);
		personGraphService.requireInTree(toUuid, familyTreeId);

		relationshipPersistenceService.create(fromUuid, toUuid, relationshipType, familyTreeId, parentRole);
	}

	/**
	 * Sets or clears the parentRole ("MOTHER", "FATHER", or null to unset) on an
	 * existing PARENT_OF edge. The edge must already exist.
	 */
	public void updateParentRole(
			String fromUuid,
			String toUuid,
			String parentRole,
			Long familyTreeId) {
		personGraphService.requireInTree(fromUuid, familyTreeId);
		personGraphService.requireInTree(toUuid, familyTreeId);

		relationshipPersistenceService.updateParentRole(fromUuid, toUuid, parentRole, familyTreeId);
	}

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

		relationshipPersistenceService.delete(fromUuid, toUuid, relationshipType, familyTreeId);
	}
}
