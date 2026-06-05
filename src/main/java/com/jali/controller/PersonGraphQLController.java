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
import com.jali.neo4j.MarriedToRelationship;
import com.jali.neo4j.ParentOfRelationship;
import com.jali.neo4j.Person;
import com.jali.neo4j.SiblingOfRelationship;
import com.jali.repository.neo4j.PersonRepository;
import com.jali.security.UserPrincipal;
import com.jali.service.ConfidenceScoreService;
import com.jali.service.PersonGraphService;

@Controller
public class PersonGraphQLController {

	private final PersonRepository personRepository;
	private final PersonGraphService personGraphService;
	private final ConfidenceScoreService confidenceScoreService;

	public PersonGraphQLController(
			PersonRepository personRepository,
			PersonGraphService personGraphService,
			ConfidenceScoreService confidenceScoreService) {
		this.personRepository = personRepository;
		this.personGraphService = personGraphService;
		this.confidenceScoreService = confidenceScoreService;
	}

	@QueryMapping
	public Person person(@Argument String uuid, @AuthenticationPrincipal UserPrincipal principal) {
		return personGraphService.requireInTreeWithRelationships(uuid, principal.familyTreeId());
	}

	@QueryMapping
	public List<Person> myTree(@AuthenticationPrincipal UserPrincipal principal) {
		return personRepository.findAllByFamilyTreeId(principal.familyTreeId());
	}

	@QueryMapping
	public List<Person> ancestors(
			@Argument String uuid,
			@Argument int depth,
			@AuthenticationPrincipal UserPrincipal principal) {
		personGraphService.requireInTree(uuid, principal.familyTreeId());
		return personRepository.findAncestors(uuid, principal.familyTreeId(), depth);
	}

	@QueryMapping
	public List<Person> descendants(
			@Argument String uuid,
			@Argument int depth,
			@AuthenticationPrincipal UserPrincipal principal) {
		personGraphService.requireInTree(uuid, principal.familyTreeId());
		return personRepository.findDescendants(uuid, principal.familyTreeId(), depth);
	}

	@MutationMapping
	public Person createPerson(@Argument Map<String, Object> input, @AuthenticationPrincipal UserPrincipal principal) {
		Person person = new Person((String) input.get("fullName"), principal.familyTreeId());
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
		if (input.get("biologicalSex") != null) {
			person.setBiologicalSex((String) input.get("biologicalSex"));
		}
		if (input.get("isUnknownPlaceholder") != null) {
			person.setIsUnknownPlaceholder((Boolean) input.get("isUnknownPlaceholder"));
		}
		return personGraphService.saveInTree(person, principal.familyTreeId());
	}

	@MutationMapping
	public Boolean createRelationship(
			@Argument String fromUuid,
			@Argument String toUuid,
			@Argument String relationshipType,
			@AuthenticationPrincipal UserPrincipal principal) {
		Person from = personGraphService.requireInTreeWithRelationships(fromUuid, principal.familyTreeId());
		Person to = personGraphService.requireInTree(toUuid, principal.familyTreeId());

		switch (relationshipType.toUpperCase()) {
			case "PARENT_OF" -> from.getChildren().add(new ParentOfRelationship(to));
			case "MARRIED_TO" -> from.getSpouses().add(new MarriedToRelationship(to));
			case "SIBLING_OF" -> from.getSiblings().add(new SiblingOfRelationship(to));
			default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown relationship type");
		}
		personRepository.save(from);
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

	@SchemaMapping(typeName = "Person", field = "children")
	public List<Map<String, Object>> children(Person person) {
		return person.getChildren().stream().map(r -> {
			Map<String, Object> edge = new HashMap<>();
			edge.put("person", r.getChild());
			edge.put("confidenceScore", r.getConfidenceScore());
			edge.put("disputed", Boolean.TRUE.equals(r.getDisputed()));
			return edge;
		}).toList();
	}

	@SchemaMapping(typeName = "Person", field = "spouses")
	public List<Map<String, Object>> spouses(Person person) {
		return person.getSpouses().stream().map(r -> {
			Map<String, Object> edge = new HashMap<>();
			edge.put("person", r.getSpouse());
			edge.put("confidenceScore", r.getConfidenceScore());
			edge.put("disputed", false);
			return edge;
		}).toList();
	}

	@SchemaMapping(typeName = "Person", field = "siblings")
	public List<Map<String, Object>> siblings(Person person) {
		return person.getSiblings().stream().map(r -> {
			Map<String, Object> edge = new HashMap<>();
			edge.put("person", r.getSibling());
			edge.put("confidenceScore", r.getConfidenceScore());
			edge.put("disputed", false);
			return edge;
		}).toList();
	}
}
