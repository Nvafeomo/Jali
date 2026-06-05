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
public class ParentOfRelationship {

	@RelationshipId
	private Long id;

	@TargetNode
	private Person child;

	private Double confidenceScore = 1.0;
	private Boolean disputed = false;
	private List<String> evidenceList = new ArrayList<>();

	public ParentOfRelationship(Person child) {
		this.child = child;
		this.confidenceScore = 0.10;
	}
}
