package com.jali.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.jali.dto.CreateRelationshipRequest;
import com.jali.neo4j.MarriedToRelationship;
import com.jali.neo4j.ParentOfRelationship;
import com.jali.neo4j.Person;
import com.jali.neo4j.SiblingOfRelationship;
import com.jali.repository.neo4j.PersonRepository;
import com.jali.security.UserPrincipal;
import com.jali.service.PersonGraphService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/relationships")
public class RelationshipController {

	private final PersonGraphService personGraphService;
	private final PersonRepository personRepository;

	public RelationshipController(PersonGraphService personGraphService, PersonRepository personRepository) {
		this.personGraphService = personGraphService;
		this.personRepository = personRepository;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public void createRelationship(
			@Valid @RequestBody CreateRelationshipRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {

		Person from = personGraphService.requireInTreeWithRelationships(
				request.fromUuid(), principal.familyTreeId());
		Person to = personGraphService.requireInTree(
				request.toUuid(), principal.familyTreeId());

		if (request.fromUuid().equals(request.toUuid())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot relate a person to themselves");
		}

		switch (request.relationshipType().toUpperCase()) {
			case "PARENT_OF" -> {
				if (personRepository.wouldCreateParentCycle(
						request.fromUuid(), request.toUuid(), principal.familyTreeId())) {
					throw new ResponseStatusException(
							HttpStatus.BAD_REQUEST, "PARENT_OF would create a cycle in the family tree");
				}
				from.getChildren().add(new ParentOfRelationship(to));
			}
			case "MARRIED_TO" -> from.getSpouses().add(new MarriedToRelationship(to));
			case "SIBLING_OF" -> from.getSiblings().add(new SiblingOfRelationship(to));
			default -> throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Unknown relationship type. Use PARENT_OF, MARRIED_TO, or SIBLING_OF");
		}

		personRepository.save(from);
	}
}
