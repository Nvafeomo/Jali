package com.jali.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.jali.dto.CreatePersonRequest;
import com.jali.entity.FamilyTree;
import com.jali.neo4j.MarriedToRelationship;
import com.jali.neo4j.ParentOfRelationship;
import com.jali.neo4j.Person;
import com.jali.neo4j.SiblingOfRelationship;
import com.jali.repository.jpa.FamilyTreeRepository;
import com.jali.repository.neo4j.PersonRepository;

@Service
public class PersonGraphService {

	private static final Logger log = LoggerFactory.getLogger(PersonGraphService.class);

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
		try {
			neo4jClient.query("""
					MATCH (p:Person {familyTreeId: $familyTreeId})
					WHERE p.createdAt IS NULL OR p.createdAt < $treeCreatedAt
					DETACH DELETE p
					""")
					.bind(familyTreeId).to("familyTreeId")
					.bind(treeCreatedAt).to("treeCreatedAt")
					.run();
		}
		catch (Exception ex) {
			log.warn("Could not purge stale Neo4j nodes for familyTreeId={}: {}", familyTreeId, ex.getMessage());
		}
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

		Map<String, Person> byUuid = new LinkedHashMap<>();
		for (Person person : personRepository.findAllByFamilyTreeId(familyTreeId)) {
			if (!familyTreeId.equals(person.getFamilyTreeId()) || !belongsToTree(person, treeCreatedAt)) {
				continue;
			}
			person.setChildren(new ArrayList<>());
			person.setSpouses(new ArrayList<>());
			person.setSiblings(new ArrayList<>());
			byUuid.put(person.getUuid(), person);
		}

		wireTreeRelationships(familyTreeId, treeCreatedAt, byUuid);
		return new ArrayList<>(byUuid.values());
	}

	public long countPeopleInTree(Long familyTreeId) {
		Instant treeCreatedAt = requireTreeCreatedAt(familyTreeId);
		return neo4jClient.query("""
				MATCH (p:Person {familyTreeId: $familyTreeId})
				WHERE p.createdAt IS NOT NULL AND p.createdAt >= $treeCreatedAt
				RETURN count(p) AS c
				""")
				.bind(familyTreeId).to("familyTreeId")
				.bind(treeCreatedAt).to("treeCreatedAt")
				.fetchAs(Long.class)
				.one()
				.orElse(0L);
	}

	public List<Person> findAllPeopleInTree(Long familyTreeId) {
		Instant treeCreatedAt = requireTreeCreatedAt(familyTreeId);
		return personRepository.findAllByFamilyTreeId(familyTreeId).stream()
				.filter(person -> familyTreeId.equals(person.getFamilyTreeId()))
				.filter(person -> belongsToTree(person, treeCreatedAt))
				.toList();
	}

	private void wireTreeRelationships(
			Long familyTreeId,
			Instant treeCreatedAt,
			Map<String, Person> byUuid) {
		neo4jClient.query("""
				MATCH (p:Person {familyTreeId: $familyTreeId})-[r:PARENT_OF]->(c:Person {familyTreeId: $familyTreeId})
				WHERE p.createdAt >= $treeCreatedAt AND c.createdAt >= $treeCreatedAt
				RETURN p.uuid AS fromUuid, c.uuid AS toUuid,
				       coalesce(r.confidenceScore, 1.0) AS confidenceScore,
				       coalesce(r.disputed, false) AS disputed,
				       r.parentRole AS parentRole
				""")
				.bind(familyTreeId).to("familyTreeId")
				.bind(treeCreatedAt).to("treeCreatedAt")
				.fetch().all().forEach(row -> {
			Person parent = byUuid.get((String) row.get("fromUuid"));
			Person child = byUuid.get((String) row.get("toUuid"));
			if (parent == null || child == null) {
				return;
			}
			ParentOfRelationship rel = new ParentOfRelationship(relationshipStub(child));
			rel.setConfidenceScore(((Number) row.get("confidenceScore")).doubleValue());
			rel.setDisputed(Boolean.TRUE.equals(row.get("disputed")));
			rel.setParentRole((String) row.get("parentRole"));
			parent.getChildren().add(rel);
		});

		neo4jClient.query("""
				MATCH (p:Person {familyTreeId: $familyTreeId})-[r:MARRIED_TO]->(s:Person {familyTreeId: $familyTreeId})
				WHERE p.createdAt >= $treeCreatedAt AND s.createdAt >= $treeCreatedAt
				RETURN p.uuid AS fromUuid, s.uuid AS toUuid,
				       coalesce(r.confidenceScore, 1.0) AS confidenceScore
				""")
				.bind(familyTreeId).to("familyTreeId")
				.bind(treeCreatedAt).to("treeCreatedAt")
				.fetch().all().forEach(row -> {
					Person person = byUuid.get((String) row.get("fromUuid"));
					Person spouse = byUuid.get((String) row.get("toUuid"));
					if (person == null || spouse == null) {
						return;
					}
					MarriedToRelationship rel = new MarriedToRelationship(relationshipStub(spouse));
					rel.setConfidenceScore(((Number) row.get("confidenceScore")).doubleValue());
					person.getSpouses().add(rel);
				});

		neo4jClient.query("""
				MATCH (p:Person {familyTreeId: $familyTreeId})-[r:SIBLING_OF]->(s:Person {familyTreeId: $familyTreeId})
				WHERE p.createdAt >= $treeCreatedAt AND s.createdAt >= $treeCreatedAt
				RETURN p.uuid AS fromUuid, s.uuid AS toUuid,
				       coalesce(r.confidenceScore, 1.0) AS confidenceScore,
				       coalesce(r.halfSibling, false) AS halfSibling
				""")
				.bind(familyTreeId).to("familyTreeId")
				.bind(treeCreatedAt).to("treeCreatedAt")
				.fetch().all().forEach(row -> {
					Person person = byUuid.get((String) row.get("fromUuid"));
					Person sibling = byUuid.get((String) row.get("toUuid"));
					if (person == null || sibling == null) {
						return;
					}
					SiblingOfRelationship rel = new SiblingOfRelationship(relationshipStub(sibling));
					rel.setConfidenceScore(((Number) row.get("confidenceScore")).doubleValue());
					rel.setHalfSibling(Boolean.TRUE.equals(row.get("halfSibling")));
					person.getSiblings().add(rel);
				});
	}

	private static Person relationshipStub(Person target) {
		Person stub = new Person();
		stub.setUuid(target.getUuid());
		stub.setFullName(target.getFullName());
		stub.setConfidenceScore(target.getConfidenceScore());
		stub.setIsUnknownPlaceholder(target.getIsUnknownPlaceholder());
		stub.setFamilyTreeId(target.getFamilyTreeId());
		return stub;
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
