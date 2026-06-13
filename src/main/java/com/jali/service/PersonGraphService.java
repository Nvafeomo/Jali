package com.jali.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.jali.dto.CreatePersonRequest;
import com.jali.neo4j.Person;
import com.jali.repository.neo4j.PersonRepository;

@Service
public class PersonGraphService {

	private static final int MIN_TRAVERSAL_DEPTH = 1;
	private static final int MAX_TRAVERSAL_DEPTH = 20;

	private final PersonRepository personRepository;
	private final Neo4jClient neo4jClient;
	private final PersonFieldMapper personFieldMapper;

	public PersonGraphService(
			PersonRepository personRepository,
			Neo4jClient neo4jClient,
			PersonFieldMapper personFieldMapper) {
		this.personRepository = personRepository;
		this.neo4jClient = neo4jClient;
		this.personFieldMapper = personFieldMapper;
	}

	public Person requireInTree(String uuid, Long familyTreeId) {
		return personRepository.findByUuidAndFamilyTreeId(uuid, familyTreeId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Person not found in this family tree"));
	}

	public Person requireInTreeWithRelationships(String uuid, Long familyTreeId) {
		Person person = requireInTree(uuid, familyTreeId);
		return personRepository.findById(person.getId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Person not found in this family tree"));
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

	public List<Person> findAllInTreeWithRelationships(Long familyTreeId) {
		return personRepository.findAllByFamilyTreeId(familyTreeId).stream()
				.map(person -> personRepository.findById(person.getId())
						.orElseThrow(() -> new ResponseStatusException(
								HttpStatus.NOT_FOUND, "Person not found in this family tree")))
				.toList();
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
		return new ArrayList<>(neo4jClient.query(cypher)
				.bind(uuid).to("uuid")
				.bind(familyTreeId).to("familyTreeId")
				.fetchAs(Person.class)
				.all());
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
		return new ArrayList<>(neo4jClient.query(cypher)
				.bind(uuid).to("uuid")
				.bind(familyTreeId).to("familyTreeId")
				.fetchAs(Person.class)
				.all());
	}

	private static int clampDepth(int depth) {
		return Math.min(MAX_TRAVERSAL_DEPTH, Math.max(MIN_TRAVERSAL_DEPTH, depth));
	}
}
