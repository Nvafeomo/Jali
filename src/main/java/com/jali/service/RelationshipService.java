package com.jali.service;

import org.springframework.stereotype.Service;

import com.jali.neo4j.MarriedToRelationship;
import com.jali.neo4j.ParentOfRelationship;
import com.jali.neo4j.Person;
import com.jali.neo4j.SiblingOfRelationship;
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

	public void create(
			String fromUuid,
			String toUuid,
			String relationshipType,
			Long familyTreeId) {
		relationshipValidationService.validateCreate(fromUuid, toUuid, relationshipType, familyTreeId);

		Person from = personGraphService.requireInTreeWithRelationships(fromUuid, familyTreeId);
		Person to = personGraphService.requireInTree(toUuid, familyTreeId);

		switch (relationshipType.toUpperCase()) {
			case "PARENT_OF" -> from.getChildren().add(new ParentOfRelationship(to));
			case "MARRIED_TO" -> from.getSpouses().add(new MarriedToRelationship(to));
			case "SIBLING_OF" -> from.getSiblings().add(new SiblingOfRelationship(to));
			default -> throw new IllegalStateException("Unexpected relationship type: " + relationshipType);
		}

		personRepository.save(from);
	}
}
