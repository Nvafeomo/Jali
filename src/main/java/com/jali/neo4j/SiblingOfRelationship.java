package com.jali.neo4j;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.neo4j.core.schema.RelationshipId;
import org.springframework.data.neo4j.core.schema.RelationshipProperties;
import org.springframework.data.neo4j.core.schema.TargetNode;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@RelationshipProperties
@Getter
@Setter
@NoArgsConstructor
public class SiblingOfRelationship {

	@RelationshipId
	private Long id;

	@TargetNode
	private Person sibling;

	private Double confidenceScore = 1.0;
	private List<String> evidenceList = new ArrayList<>();

	public SiblingOfRelationship(Person sibling) {
		this.sibling = sibling;
		this.confidenceScore = 1.0;
	}
}
