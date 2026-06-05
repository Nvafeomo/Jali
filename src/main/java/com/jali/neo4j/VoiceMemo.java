package com.jali.neo4j;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Node("VoiceMemo")
@Getter
@Setter
@NoArgsConstructor
public class VoiceMemo {

    @Id
    @GeneratedValue
    private Long id;

    private String uuid;
    private Long familyTreeId;
    private String anchorPersonUuid;
    private String audioFilePath;
    private String transcript;
    private String editedTranscript;
    private String status; // PENDING_TRANSCRIPTION, PENDING_REVIEW, APPLIED, UNDONE, FAILED
    private String errorMessage;
    private Instant createdAt;
    private Instant appliedAt;
    private String appliedChangesJson; // stores what was changed for undo

    @Relationship(type = "MENTIONED_IN", direction = Relationship.Direction.INCOMING)
    private List<Person> mentionedPeople = new ArrayList<>();

    public VoiceMemo(Long familyTreeId, String anchorPersonUuid, String audioFilePath) {
        this.uuid = java.util.UUID.randomUUID().toString();
        this.familyTreeId = familyTreeId;
        this.anchorPersonUuid = anchorPersonUuid;
        this.audioFilePath = audioFilePath;
        this.status = "PENDING_TRANSCRIPTION";
        this.createdAt = Instant.now();
    }
}
