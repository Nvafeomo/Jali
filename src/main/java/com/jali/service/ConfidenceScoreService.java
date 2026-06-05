package com.jali.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jali.neo4j.EvidenceType;
import com.jali.neo4j.MarriedToRelationship;
import com.jali.neo4j.ParentOfRelationship;
import com.jali.neo4j.Person;
import com.jali.neo4j.SiblingOfRelationship;
import com.jali.repository.neo4j.PersonRepository;

@Service
public class ConfidenceScoreService {

	private static final double BASE_SCORE = 0.10;
	private static final double MAX_SCORE = 1.0;
	private static final double MIN_SCORE = 0.0;

	private final PersonRepository personRepository;
	private final PersonGraphService personGraphService;
	private final ObjectMapper objectMapper;

	public ConfidenceScoreService(
			PersonRepository personRepository,
			PersonGraphService personGraphService,
			ObjectMapper objectMapper) {
		this.personRepository = personRepository;
		this.personGraphService = personGraphService;
		this.objectMapper = objectMapper;
	}

	public Person addEvidenceToRelationship(
			String fromUuid,
			String toUuid,
			String relationshipType,
			EvidenceType evidenceType,
			String source,
			Long familyTreeId) {

		Person from = personGraphService.requireInTreeWithRelationships(fromUuid, familyTreeId);
		personGraphService.requireInTree(toUuid, familyTreeId);

		String evidenceEntry = buildEvidenceEntry(evidenceType, source);

		switch (relationshipType.toUpperCase()) {
			case "PARENT_OF" -> {
				ParentOfRelationship rel = from.getChildren().stream()
						.filter(r -> r.getChild().getUuid().equals(toUuid))
						.findFirst()
						.orElseThrow(() -> new ResponseStatusException(
								HttpStatus.NOT_FOUND, "Relationship not found"));
				List<String> evidence = new ArrayList<>(rel.getEvidenceList());
				evidence.add(evidenceEntry);
				rel.setEvidenceList(evidence);
				rel.setConfidenceScore(recalculate(evidence));
				if (evidenceType == EvidenceType.DISPUTE) {
					rel.setDisputed(true);
				}
			}
			case "MARRIED_TO" -> {
				MarriedToRelationship rel = from.getSpouses().stream()
						.filter(r -> r.getSpouse().getUuid().equals(toUuid))
						.findFirst()
						.orElseThrow(() -> new ResponseStatusException(
								HttpStatus.NOT_FOUND, "Relationship not found"));
				rel.setConfidenceScore(
						Math.min(MAX_SCORE, Math.max(MIN_SCORE,
								rel.getConfidenceScore() + evidenceType.weight)));
			}
			case "SIBLING_OF" -> {
				SiblingOfRelationship rel = from.getSiblings().stream()
						.filter(r -> r.getSibling().getUuid().equals(toUuid))
						.findFirst()
						.orElseThrow(() -> new ResponseStatusException(
								HttpStatus.NOT_FOUND, "Relationship not found"));
				List<String> evidence = new ArrayList<>(rel.getEvidenceList());
				evidence.add(evidenceEntry);
				rel.setEvidenceList(evidence);
				rel.setConfidenceScore(recalculate(evidence));
			}
			default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown relationship type");
		}

		return personRepository.save(from);
	}

	private double recalculate(List<String> evidenceList) {
		double score = BASE_SCORE;
		for (String entry : evidenceList) {
			try {
				Map<String, Object> map = objectMapper.readValue(entry, new TypeReference<>() {});
				String typeName = (String) map.get("type");
				EvidenceType type = EvidenceType.valueOf(typeName);
				score += type.weight;
			}
			catch (JsonProcessingException | IllegalArgumentException ignored) {
			}
		}
		return Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));
	}

	private String buildEvidenceEntry(EvidenceType evidenceType, String source) {
		try {
			return objectMapper.writeValueAsString(Map.of(
					"type", evidenceType.name(),
					"weight", evidenceType.weight,
					"source", source != null ? source : "manual",
					"submittedAt", Instant.now().toString()));
		}
		catch (JsonProcessingException e) {
			throw new RuntimeException("Failed to serialize evidence", e);
		}
	}
}
