package com.jali.neo4j;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.neo4j.core.schema.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Node("Person")
@Getter
@Setter
@NoArgsConstructor
public class Person {

    @Id
    @GeneratedValue
    private Long id;

    private String uuid;
    private String fullName;
    private String bio;
    private String birthDate;
    private String deathDate;
    private String birthplace;
    private String ethnicGroup;
    private String biologicalSex;
    private Double confidenceScore = 1.0;
    private Long familyTreeId;
    private Boolean isUnknownPlaceholder = false;
    private Instant createdAt;

    @Relationship(type = "PARENT_OF", direction = Relationship.Direction.OUTGOING)
    private List<ParentOfRelationship> children = new ArrayList<>();

    @Relationship(type = "MARRIED_TO", direction = Relationship.Direction.OUTGOING)
    private List<MarriedToRelationship> spouses = new ArrayList<>();

    @Relationship(type = "SIBLING_OF", direction = Relationship.Direction.OUTGOING)
    private List<SiblingOfRelationship> siblings = new ArrayList<>();

    public Person(String fullName, Long familyTreeId) {
        this.uuid = java.util.UUID.randomUUID().toString();
        this.fullName = fullName;
        this.familyTreeId = familyTreeId;
        this.confidenceScore = 1.0;
        this.createdAt = Instant.now();
    }
}