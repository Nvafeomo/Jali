package com.jali.repository.neo4j;

/**
 * Parent–child link as stored on a {@code PARENT_OF} edge (Cypher projection).
 */
public record ParentLinkRow(String parentUuid, String parentRole) {
}
