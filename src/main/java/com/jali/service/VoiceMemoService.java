package com.jali.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jali.neo4j.Person;
import com.jali.neo4j.VoiceMemo;
import com.jali.repository.neo4j.PersonRepository;
import com.jali.repository.neo4j.VoiceMemoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class VoiceMemoService {

    private final WhisperService whisperService;
    private final ClaudeService claudeService;
    private final PersonRepository personRepository;
    private final VoiceMemoRepository voiceMemoRepository;
    private final ConfidenceScoreService confidenceScoreService;
    private final ObjectMapper objectMapper;

    public VoiceMemoService(
            WhisperService whisperService,
            ClaudeService claudeService,
            PersonRepository personRepository,
            VoiceMemoRepository voiceMemoRepository,
            ConfidenceScoreService confidenceScoreService,
            ObjectMapper objectMapper) {
        this.whisperService = whisperService;
        this.claudeService = claudeService;
        this.personRepository = personRepository;
        this.voiceMemoRepository = voiceMemoRepository;
        this.confidenceScoreService = confidenceScoreService;
        this.objectMapper = objectMapper;
    }

    public VoiceMemo upload(File audioFile, String anchorPersonUuid, Long familyTreeId) {
        VoiceMemo memo = new VoiceMemo(familyTreeId, anchorPersonUuid, audioFile.getAbsolutePath());
        memo = voiceMemoRepository.save(memo);

        try {
            String transcript = whisperService.transcribe(audioFile);
            memo.setTranscript(transcript);
            memo.setEditedTranscript(transcript);
            memo.setStatus("PENDING_REVIEW");
        } catch (IOException e) {
            memo.setStatus("FAILED");
            memo.setErrorMessage(e.getMessage());
        }

        return voiceMemoRepository.save(memo);
    }

    public VoiceMemo updateTranscript(String memoUuid, String editedTranscript, Long familyTreeId) {
        VoiceMemo memo = requireMemo(memoUuid, familyTreeId);
        if (!memo.getStatus().equals("PENDING_REVIEW")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Transcript can only be edited while status is PENDING_REVIEW");
        }
        memo.setEditedTranscript(editedTranscript);
        return voiceMemoRepository.save(memo);
    }

    public VoiceMemo confirm(String memoUuid, Long familyTreeId) {
        VoiceMemo memo = requireMemo(memoUuid, familyTreeId);
        if (!memo.getStatus().equals("PENDING_REVIEW")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only PENDING_REVIEW memos can be confirmed");
        }

        try {
            // get anchor person name for context
            String anchorName = null;
            if (memo.getAnchorPersonUuid() != null) {
                anchorName = personRepository
                        .findByUuidAndFamilyTreeId(memo.getAnchorPersonUuid(), familyTreeId)
                        .map(Person::getFullName)
                        .orElse(null);
            }

            // get all people in tree for context
            List<String> existingPeople = personRepository
                    .findAllByFamilyTreeId(familyTreeId)
                    .stream()
                    .map(Person::getFullName)
                    .toList();

            // call Claude
            JsonNode entities = claudeService.extractEntities(
                    memo.getEditedTranscript(), anchorName, existingPeople);

            // track changes for undo
            List<Map<String, String>> appliedChanges = new ArrayList<>();

            // create MENTIONED_IN edges for matched people
            JsonNode peopleMentioned = entities.get("people_mentioned");
            if (peopleMentioned != null) {
                for (JsonNode nameNode : peopleMentioned) {
                    String name = nameNode.asText();
                    personRepository.findAllByFamilyTreeId(familyTreeId).stream()
                            .filter(p -> p.getFullName().equalsIgnoreCase(name))
                            .findFirst()
                            .ifPresent(person -> {
                                memo.getMentionedPeople().add(person);
                                appliedChanges.add(Map.of(
                                        "type", "MENTIONED_IN",
                                        "personUuid", person.getUuid()));
                            });
                }
            }

            // add ORAL_HISTORY evidence to confirmed relationships
            JsonNode relationships = entities.get("relationships");
            if (relationships != null) {
                for (JsonNode rel : relationships) {
                    String fromName = rel.get("from").asText();
                    String toName = rel.get("to").asText();
                    String relType = rel.get("type").asText();

                    Person from = personRepository.findAllByFamilyTreeId(familyTreeId).stream()
                            .filter(p -> p.getFullName().equalsIgnoreCase(fromName))
                            .findFirst().orElse(null);
                    Person to = personRepository.findAllByFamilyTreeId(familyTreeId).stream()
                            .filter(p -> p.getFullName().equalsIgnoreCase(toName))
                            .findFirst().orElse(null);

                    if (from != null && to != null) {
                        try {
                            confidenceScoreService.addEvidenceToRelationship(
                                    from.getUuid(), to.getUuid(), relType,
                                    com.jali.neo4j.EvidenceType.ORAL_HISTORY,
                                    "voice-memo:" + memo.getUuid(),
                                    familyTreeId);
                            appliedChanges.add(Map.of(
                                    "type", "ORAL_HISTORY_EVIDENCE",
                                    "fromUuid", from.getUuid(),
                                    "toUuid", to.getUuid(),
                                    "relType", relType));
                        } catch (Exception ignored) {
                        }
                    }
                }
            }

            memo.setAppliedChangesJson(objectMapper.writeValueAsString(appliedChanges));
            memo.setAppliedAt(Instant.now());
            memo.setStatus("APPLIED");

        } catch (IOException e) {
            memo.setStatus("FAILED");
            memo.setErrorMessage(e.getMessage());
        }

        return voiceMemoRepository.save(memo);
    }

    public VoiceMemo undo(String memoUuid, Long familyTreeId) {
        VoiceMemo memo = requireMemo(memoUuid, familyTreeId);
        if (!memo.getStatus().equals("APPLIED")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only APPLIED memos can be undone");
        }

        // check 24-hour window
        if (memo.getAppliedAt() != null &&
                Instant.now().isAfter(memo.getAppliedAt().plusSeconds(86400))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Undo window has expired (24 hours)");
        }

        // clear MENTIONED_IN edges
        memo.getMentionedPeople().clear();
        memo.setStatus("UNDONE");
        return voiceMemoRepository.save(memo);
    }

    public VoiceMemo getByUuid(String memoUuid, Long familyTreeId) {
        return requireMemo(memoUuid, familyTreeId);
    }

    private VoiceMemo requireMemo(String uuid, Long familyTreeId) {
        return voiceMemoRepository.findByUuidAndFamilyTreeId(uuid, familyTreeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Voice memo not found"));
    }
}
