package com.jali.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;

import com.jali.neo4j.Person;

public interface PersonRepository extends Neo4jRepository<Person, Long> {

	Optional<Person> findByUuidAndFamilyTreeId(String uuid, Long familyTreeId);

	List<Person> findAllByFamilyTreeId(Long familyTreeId);

	boolean existsByUuidAndFamilyTreeId(String uuid, Long familyTreeId);

	long countByFamilyTreeId(Long familyTreeId);

	@Query("""
			MATCH (p:Person)
			WHERE id(p) = $id AND p.familyTreeId = $familyTreeId
			RETURN p
			""")
	Optional<Person> findByInternalIdAndFamilyTreeId(@Param("id") Long id, @Param("familyTreeId") Long familyTreeId);
}
