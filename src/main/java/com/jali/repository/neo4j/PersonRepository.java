package com.jali.repository.neo4j;

import java.util.List;
import java.util.Optional;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

import com.jali.neo4j.Person;

public interface PersonRepository extends Neo4jRepository<Person, Long> {

	@Query("""
			MATCH (p:Person {uuid: $uuid, familyTreeId: $familyTreeId})
			RETURN p
			""")
	Optional<Person> findByUuidAndFamilyTreeId(
			@Param("uuid") String uuid,
			@Param("familyTreeId") Long familyTreeId);

	@Query("""
			MATCH (p:Person)
			WHERE p.familyTreeId = $familyTreeId
			RETURN p
			""")
	List<Person> findAllByFamilyTreeId(@Param("familyTreeId") Long familyTreeId);

	@Query("""
			RETURN EXISTS {
				MATCH (p:Person {uuid: $uuid, familyTreeId: $familyTreeId})
			}
			""")
	boolean existsByUuidAndFamilyTreeId(
			@Param("uuid") String uuid,
			@Param("familyTreeId") Long familyTreeId);

	@Query("""
			MATCH (from:Person {uuid: $fromUuid, familyTreeId: $familyTreeId})
			MATCH (to:Person {uuid: $toUuid, familyTreeId: $familyTreeId})
			RETURN EXISTS { (to)-[:PARENT_OF*]->(from) }
			""")
	boolean wouldCreateParentCycle(
			@Param("fromUuid") String fromUuid,
			@Param("toUuid") String toUuid,
			@Param("familyTreeId") Long familyTreeId);

	@Query("""
			MATCH (from:Person {uuid: $fromUuid, familyTreeId: $familyTreeId})
			MATCH (to:Person {uuid: $toUuid, familyTreeId: $familyTreeId})
			RETURN EXISTS { (from)-[:PARENT_OF]->(to) }
			""")
	boolean hasDirectParentOf(
			@Param("fromUuid") String fromUuid,
			@Param("toUuid") String toUuid,
			@Param("familyTreeId") Long familyTreeId);

	@Query("""
			MATCH (a:Person {uuid: $aUuid, familyTreeId: $familyTreeId})
			MATCH (b:Person {uuid: $bUuid, familyTreeId: $familyTreeId})
			RETURN EXISTS { (a)-[:PARENT_OF]->(b) OR (b)-[:PARENT_OF]->(a) }
			""")
	boolean hasParentChildBetween(
			@Param("aUuid") String aUuid,
			@Param("bUuid") String bUuid,
			@Param("familyTreeId") Long familyTreeId);

	@Query("""
			MATCH (a:Person {uuid: $aUuid, familyTreeId: $familyTreeId})
			MATCH (b:Person {uuid: $bUuid, familyTreeId: $familyTreeId})
			RETURN EXISTS { (a)-[:SIBLING_OF]->(b) OR (b)-[:SIBLING_OF]->(a) }
			""")
	boolean hasSiblingBetween(
			@Param("aUuid") String aUuid,
			@Param("bUuid") String bUuid,
			@Param("familyTreeId") Long familyTreeId);

	@Query("""
			MATCH (a:Person {uuid: $aUuid, familyTreeId: $familyTreeId})
			MATCH (b:Person {uuid: $bUuid, familyTreeId: $familyTreeId})
			RETURN EXISTS { (a)-[:MARRIED_TO]->(b) OR (b)-[:MARRIED_TO]->(a) }
			""")
	boolean hasMarriageBetween(
			@Param("aUuid") String aUuid,
			@Param("bUuid") String bUuid,
			@Param("familyTreeId") Long familyTreeId);
}
