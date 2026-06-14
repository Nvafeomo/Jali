package com.jali.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.jali.dto.CreatePersonRequest;
import com.jali.entity.FamilyTree;
import com.jali.neo4j.Person;
import com.jali.repository.jpa.FamilyTreeRepository;
import com.jali.repository.neo4j.PersonRepository;

@Service
public class PersonGraphService {

	private static final int MIN_TRAVERSAL_DEPTH = 1;
	private static final int MAX_TRAVERSAL_DEPTH = 20;

	private final PersonRepository personRepository;
	private final FamilyTreeRepository familyTreeRepository;
	private final Neo4jClient neo4jClient;
	private final PersonFieldMapper personFieldMapper;
	private final PersonGracePeriodService personGracePeriodService;

	public PersonGraphService(
			PersonRepository personRepository,
			FamilyTreeRepository familyTreeRepository,
			Neo4jClient neo4jClient,
			PersonFieldMapper personFieldMapper,
			PersonGracePeriodService personGracePeriodService) {
		this.personRepository = personRepository;
		this.familyTreeRepository = familyTreeRepository;
		this.neo4jClient = neo4jClient;
		this.personFieldMapper = personFieldMapper;
		this.personGracePeriodService = personGracePeriodService;
	}

	/**
	 * Removes Neo4j nodes left over from a previous owner when PostgreSQL reuses a
	 * {@code familyTreeId}. Only people created at or after this tree row was
	 * inserted belong to the current account.
	 */
	public void purgeStaleNodes(Long familyTreeId, Instant treeCreatedAt) {
		neo4jClient.query("""
				MATCH (p:Person {familyTreeId: $familyTreeId})
				WHERE p.createdAt IS NULL OR p.createdAt < $treeCreatedAt
				DETACH DELETE p
				""")
				.bind(familyTreeId).to("familyTreeId")
				.bind(treeCreatedAt).to("treeCreatedAt")
				.run();
	}

	public Person requireInTree(String uuid, Long familyTreeId) {
		Instant treeCreatedAt = requireTreeCreatedAt(familyTreeId);
		Person person = personRepository.findByUuidAndFamilyTreeId(uuid, familyTreeId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.NOT_FOUND, "Person not found in this family tree"));
		if (!belongsToTree(person, treeCreatedAt)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Person not found in this family tree");
		}
		return person;
	}

	public Person requireInTreeWithRelationships(String uuid, Long familyTreeId) {
		Person person = requireInTree(uuid, familyTreeId);
		return sanitizeRelationships(
				personRepository.findById(person.getId())
						.orElseThrow(() -> new ResponseStatusException(
								HttpStatus.NOT_FOUND, "Person not found in this family tree")),
				familyTreeId,
				requireTreeCreatedAt(familyTreeId));
	}

	public Person saveInTree(Person person, Long familyTreeId) {
		if (!familyTreeId.equals(person.getFamilyTreeId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Person familyTreeId does not match authenticated tree");
		}
		return personRepository.save(person);
	}

	public Person createPerson(String fullName, Long familyTreeId, Map<String, Object> input) {
		Person person = new Person(fullName, familyTreeId);
		personFieldMapper.applyCreateFields(person, input);
		return saveInTree(person, familyTreeId);
	}

	public Person updatePersonDetails(String uuid, Long familyTreeId, Map<String, Object> input) {
		Person person = requireInTreeWithRelationships(uuid, familyTreeId);
		personFieldMapper.applyUpdateFields(person, input);
		return saveInTree(person, familyTreeId);
	}

	public Person createPerson(CreatePersonRequest request, Long familyTreeId) {
		Map<String, Object> fields = new HashMap<>();
		fields.put("birthDate", request.birthDate());
		fields.put("deathDate", request.deathDate());
		fields.put("birthplace", request.birthplace());
		fields.put("ethnicGroup", request.ethnicGroup());
		fields.put("bio", request.bio());
		fields.put("biologicalSex", request.biologicalSex());
		fields.put("isUnknownPlaceholder", request.isUnknownPlaceholder());
		return createPerson(request.fullName(), familyTreeId, fields);
	}

	public void deletePerson(String uuid, Long familyTreeId) {
		Person person = requireInTree(uuid, familyTreeId);
		personGracePeriodService.requireWithinGracePeriodToDelete(person);
		personRepository.deleteByUuidAndFamilyTreeId(uuid, familyTreeId);
	}

	public List<Person> findAllInTreeWithRelationships(Long familyTreeId) {
		Instant treeCreatedAt = requireTreeCreatedAt(familyTreeId);
		return personRepository.findAllByFamilyTreeId(familyTreeId).stream()
				.filter(person -> familyTreeId.equals(person.getFamilyTreeId()))
				.filter(person -> belongsToTree(person, treeCreatedAt))
				.map(person -> personRepository.findById(person.getId())
						.orElseThrow(() -> new ResponseStatusException(
								HttpStatus.NOT_FOUND, "Person not found in this family tree")))
				.filter(person -> belongsToTree(person, treeCreatedAt))
				.map(person -> sanitizeRelationships(person, familyTreeId, treeCreatedAt))
				.toList();
	}

	private Instant requireTreeCreatedAt(Long familyTreeId) {
		FamilyTree tree = familyTreeRepository.findById(familyTreeId)
				.orElseThrow(() -> new ResponseStatusException(
						HttpStatus.FORBIDDEN, "Family tree not found"));
		if (tree.getCreatedAt() == null) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Family tree is missing createdAt");
		}
		return tree.getCreatedAt();
	}

	private static boolean belongsToTree(Person person, Instant treeCreatedAt) {
		if (person.getCreatedAt() == null) {
			return false;
		}
		return !person.getCreatedAt().isBefore(treeCreatedAt);
	}

	private Person sanitizeRelationships(Person person, Long familyTreeId, Instant treeCreatedAt) {
		if (person.getChildren() != null) {
			person.setChildren(person.getChildren().stream()
					.filter(r -> r.getChild() != null
							&& familyTreeId.equals(r.getChild().getFamilyTreeId())
							&& belongsToTree(r.getChild(), treeCreatedAt))
					.toList());
		}
		if (person.getSpouses() != null) {
			person.setSpouses(person.getSpouses().stream()
					.filter(r -> r.getSpouse() != null
							&& familyTreeId.equals(r.getSpouse().getFamilyTreeId())
							&& belongsToTree(r.getSpouse(), treeCreatedAt))
					.toList());
		}
		if (person.getSiblings() != null) {
			person.setSiblings(person.getSiblings().stream()
					.filter(r -> r.getSibling() != null
							&& familyTreeId.equals(r.getSibling().getFamilyTreeId())
							&& belongsToTree(r.getSibling(), treeCreatedAt))
					.toList());
		}
		return person;
	}

	public List<Person> findAncestors(String uuid, Long familyTreeId, int depth) {
		requireInTree(uuid, familyTreeId);
		int clampedDepth = clampDepth(depth);
		String cypher = """
				MATCH (start:Person {uuid: $uuid, familyTreeId: $familyTreeId})
				MATCH (ancestor:Person)-[:PARENT_OF*1..%d]->(start)
				WHERE ancestor.familyTreeId = $familyTreeId
				RETURN DISTINCT ancestor
				""".formatted(clampedDepth);
		Instant treeCreatedAt = requireTreeCreatedAt(familyTreeId);
		return new ArrayList<>(neo4jClient.query(cypher)
				.bind(uuid).to("uuid")
				.bind(familyTreeId).to("familyTreeId")
				.fetchAs(Person.class)
				.all()).stream()
				.filter(p -> belongsToTree(p, treeCreatedAt))
				.toList();
	}

	public List<Person> findDescendants(String uuid, Long familyTreeId, int depth) {
		requireInTree(uuid, familyTreeId);
		int clampedDepth = clampDepth(depth);
		String cypher = """
				MATCH (start:Person {uuid: $uuid, familyTreeId: $familyTreeId})
				MATCH (start)-[:PARENT_OF*1..%d]->(descendant:Person)
				WHERE descendant.familyTreeId = $familyTreeId
				RETURN DISTINCT descendant
				""".formatted(clampedDepth);
		Instant treeCreatedAt = requireTreeCreatedAt(familyTreeId);
		return new ArrayList<>(neo4jClient.query(cypher)
				.bind(uuid).to("uuid")
				.bind(familyTreeId).to("familyTreeId")
				.fetchAs(Person.class)
				.all()).stream()
				.filter(p -> belongsToTree(p, treeCreatedAt))
				.toList();
	}

	private static int clampDepth(int depth) {
		return Math.min(MAX_TRAVERSAL_DEPTH, Math.max(MIN_TRAVERSAL_DEPTH, depth));
	}
}
