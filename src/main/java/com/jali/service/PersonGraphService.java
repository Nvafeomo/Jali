package com.jali.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.jali.neo4j.Person;
import com.jali.repository.neo4j.PersonRepository;

@Service
public class PersonGraphService {

	private static final int MIN_TRAVERSAL_DEPTH = 1;
	private static final int MAX_TRAVERSAL_DEPTH = 20;

	private final PersonRepository personRepository;
	private final Neo4jClient neo4jClient;

	public PersonGraphService(PersonRepository personRepository, Neo4jClient neo4jClient) {
		this.personRepository = personRepository;
		this.neo4jClient = neo4jClient;
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
