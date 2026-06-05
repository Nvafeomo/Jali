package com.jali.neo4j;

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
public class MarriedToRelationship {

	@RelationshipId
	private Long id;

	@TargetNode
	private Person spouse;

	private Double confidenceScore = 1.0;
	private String marriageDate;

	public MarriedToRelationship(Person spouse) {
		this.spouse = spouse;
		this.confidenceScore = 1.0;
	}
}
