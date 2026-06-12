package com.jali.service;

import java.util.List;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Service;

@Service
public class RelationshipDedupeService {

	private static final List<String> RELATIONSHIP_TYPES = List.of("PARENT_OF", "MARRIED_TO", "SIBLING_OF");

	private static final String COUNT_DUPES_CYPHER = """
			MATCH (a:Person)-[r:PARENT_OF]->(b:Person)
			WITH 'PARENT_OF' AS type, a.uuid AS fromUuid, b.uuid AS toUuid, count(r) AS cnt
			WHERE cnt > 1
			RETURN type, fromUuid, toUuid, cnt
			UNION ALL
			MATCH (a:Person)-[r:MARRIED_TO]->(b:Person)
			WITH 'MARRIED_TO' AS type, a.uuid AS fromUuid, b.uuid AS toUuid, count(r) AS cnt
			WHERE cnt > 1
			RETURN type, fromUuid, toUuid, cnt
			UNION ALL
			MATCH (a:Person)-[r:SIBLING_OF]->(b:Person)
			WITH 'SIBLING_OF' AS type, a.uuid AS fromUuid, b.uuid AS toUuid, count(r) AS cnt
			WHERE cnt > 1
			RETURN type, fromUuid, toUuid, cnt
			""";

	private final Neo4jClient neo4jClient;

	public RelationshipDedupeService(Neo4jClient neo4jClient) {
		this.neo4jClient = neo4jClient;
	}

	public record DuplicateRelationship(String type, String fromUuid, String toUuid, long count) {
	}

	public record DedupeResult(int duplicateGroupsRemoved, List<DuplicateRelationship> remaining) {
	}

	public List<DuplicateRelationship> findDuplicates() {
		return neo4jClient.query(COUNT_DUPES_CYPHER)
				.fetchAs(DuplicateRelationship.class)
				.mappedBy((typeSystem, record) -> new DuplicateRelationship(
						record.get("type").asString(),
						record.get("fromUuid").asString(),
						record.get("toUuid").asString(),
						record.get("cnt").asLong()))
				.all()
				.stream()
				.toList();
	}

	public DedupeResult dedupeAll() {
		int groupsRemoved = 0;
		for (String type : RELATIONSHIP_TYPES) {
			groupsRemoved += dedupeRelationshipType(type);
		}
		List<DuplicateRelationship> remaining = findDuplicates();
		return new DedupeResult(groupsRemoved, remaining);
	}

	private int dedupeRelationshipType(String type) {
		String cypher = """
				MATCH (a:Person)-[r:%s]->(b:Person)
				WITH a, b, collect(r) AS rels
				WHERE size(rels) > 1
				FOREACH (dup IN tail(rels) | DELETE dup)
				RETURN count(*) AS groupsCleaned
				""".formatted(type);

		return neo4jClient.query(cypher)
				.fetchAs(Long.class)
				.one()
				.map(Long::intValue)
				.orElse(0);
	}
}
