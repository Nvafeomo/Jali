package com.jali.repository.neo4j;

import com.jali.neo4j.VoiceMemo;
import org.springframework.data.neo4j.repository.Neo4jRepository;

import java.util.Optional;

public interface VoiceMemoRepository extends Neo4jRepository<VoiceMemo, Long> {
    Optional<VoiceMemo> findByUuidAndFamilyTreeId(String uuid, Long familyTreeId);
}
