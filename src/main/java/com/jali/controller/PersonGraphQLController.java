package com.jali.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ResponseStatusException;

import com.jali.neo4j.EvidenceType;
import com.jali.neo4j.Person;
import com.jali.security.UserPrincipal;
import com.jali.service.ConfidenceScoreService;
import com.jali.service.PersonFieldMapper;
import com.jali.service.PersonGracePeriodService;
import com.jali.service.PersonGraphService;
import com.jali.service.RelationshipService;

@Controller
public class PersonGraphQLController {

	private final PersonGraphService personGraphService;
	private final ConfidenceScoreService confidenceScoreService;
	private final RelationshipService relationshipService;
	private final PersonGracePeriodService personGracePeriodService;
	private final PersonFieldMapper personFieldMapper;

	public PersonGraphQLController(
			PersonGraphService personGraphService,
			ConfidenceScoreService confidenceScoreService,
			RelationshipService relationshipService,
			PersonGracePeriodService personGracePeriodService,
			PersonFieldMapper personFieldMapper) {
		this.personGraphService = personGraphService;
		this.confidenceScoreService = confidenceScoreService;
		this.relationshipService = relationshipService;
		this.personGracePeriodService = personGracePeriodService;
		this.personFieldMapper = personFieldMapper;
	}

	@QueryMapping
	public Person person(@Argument String uuid, @AuthenticationPrincipal UserPrincipal principal) {
		return personGraphService.requireInTreeWithRelationships(uuid, principal.familyTreeId());
	}

	@QueryMapping
	public List<Person> myTree(@AuthenticationPrincipal UserPrincipal principal) {
		return personGraphService.findAllInTreeWithRelationships(principal.familyTreeId());
	}

	@QueryMapping
	public List<Person> ancestors(
			@Argument String uuid,
			@Argument Integer depth,
			@AuthenticationPrincipal UserPrincipal principal) {
		int resolvedDepth = depth != null ? depth : 4;
		return personGraphService.findAncestors(uuid, principal.familyTreeId(), resolvedDepth);
	}

	@QueryMapping
	public List<Person> descendants(
			@Argument String uuid,
			@Argument Integer depth,
			@AuthenticationPrincipal UserPrincipal principal) {
		int resolvedDepth = depth != null ? depth : 4;
		return personGraphService.findDescendants(uuid, principal.familyTreeId(), resolvedDepth);
	}

	@MutationMapping
	public Person createPerson(@Argument Map<String, Object> input, @AuthenticationPrincipal UserPrincipal principal) {
		return personGraphService.createPerson(
				(String) input.get("fullName"),
				principal.familyTreeId(),
				input);
	}

	@MutationMapping
	public Person updatePerson(
			@Argument String uuid,
			@Argument Map<String, Object> input,
			@AuthenticationPrincipal UserPrincipal principal) {
		Person person = personGraphService.requireInTree(uuid, principal.familyTreeId());
		personGracePeriodService.requireWithinGracePeriod(person);
		try {
			personFieldMapper.applyUpdateFields(person, input);
		}
		catch (IllegalArgumentException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
		}
		return personGraphService.saveInTree(person, principal.familyTreeId());
	}

	@MutationMapping
	public Boolean createRelationship(
			@Argument String fromUuid,
			@Argument String toUuid,
			@Argument String relationshipType,
			@AuthenticationPrincipal UserPrincipal principal) {
		relationshipService.create(fromUuid, toUuid, relationshipType, principal.familyTreeId());
		return true;
	}

	@MutationMapping
	public Boolean deleteRelationship(
			@Argument String anchorUuid,
			@Argument String fromUuid,
			@Argument String toUuid,
			@Argument String relationshipType,
			@AuthenticationPrincipal UserPrincipal principal) {
		relationshipService.delete(
				anchorUuid, fromUuid, toUuid, relationshipType, principal.familyTreeId());
		return true;
	}

	@MutationMapping
	public Person addEvidence(
			@Argument String fromUuid,
			@Argument String toUuid,
			@Argument String relationshipType,
			@Argument String evidenceType,
			@Argument String source,
			@AuthenticationPrincipal UserPrincipal principal) {
		EvidenceType type;
		try {
			type = EvidenceType.valueOf(evidenceType.toUpperCase());
		}
		catch (IllegalArgumentException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown evidence type");
		}
		return confidenceScoreService.addEvidenceToRelationship(
				fromUuid, toUuid, relationshipType, type, source, principal.familyTreeId());
	}

	@SchemaMapping(typeName = "Person", field = "canEditDetails")
	public boolean canEditDetails(Person person) {
		return personGracePeriodService.isWithinGracePeriod(person);
	}

	@SchemaMapping(typeName = "Person", field = "createdAt")
	public String createdAt(Person person) {
		return person.getCreatedAt() != null ? person.getCreatedAt().toString() : null;
	}

	@SchemaMapping(typeName = "Person", field = "children")
	public List<Map<String, Object>> children(Person person) {
		if (person.getChildren() == null) {
			return List.of();
		}
		return person.getChildren().stream()
				.filter(r -> r.getChild() != null)
				.map(r -> {
			Map<String, Object> edge = new HashMap<>();
			edge.put("person", r.getChild());
			edge.put("confidenceScore", r.getConfidenceScore() != null ? r.getConfidenceScore() : 1.0);
			edge.put("disputed", Boolean.TRUE.equals(r.getDisputed()));
			return edge;
		}).toList();
	}

	@SchemaMapping(typeName = "Person", field = "spouses")
	public List<Map<String, Object>> spouses(Person person) {
		if (person.getSpouses() == null) {
			return List.of();
		}
		return person.getSpouses().stream()
				.filter(r -> r.getSpouse() != null)
				.map(r -> {
			Map<String, Object> edge = new HashMap<>();
			edge.put("person", r.getSpouse());
			edge.put("confidenceScore", r.getConfidenceScore() != null ? r.getConfidenceScore() : 1.0);
			edge.put("disputed", false);
			return edge;
		}).toList();
	}

	@SchemaMapping(typeName = "Person", field = "siblings")
	public List<Map<String, Object>> siblings(Person person) {
		if (person.getSiblings() == null) {
			return List.of();
		}
		return person.getSiblings().stream()
				.filter(r -> r.getSibling() != null)
				.map(r -> {
			Map<String, Object> edge = new HashMap<>();
			edge.put("person", r.getSibling());
			edge.put("confidenceScore", r.getConfidenceScore() != null ? r.getConfidenceScore() : 1.0);
			edge.put("disputed", false);
			return edge;
		}).toList();
	}
}
