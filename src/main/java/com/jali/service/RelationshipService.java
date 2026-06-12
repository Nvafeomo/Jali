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

	public RelationshipService(
			PersonGraphService personGraphService,
			PersonRepository personRepository,
			RelationshipValidationService relationshipValidationService) {
		this.personGraphService = personGraphService;
		this.personRepository = personRepository;
		this.relationshipValidationService = relationshipValidationService;
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
}
