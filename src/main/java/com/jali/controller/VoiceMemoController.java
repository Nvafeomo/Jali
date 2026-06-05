package com.jali.controller;

import com.jali.neo4j.VoiceMemo;
import com.jali.security.UserPrincipal;
import com.jali.service.VoiceMemoService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/voice-memos")
public class VoiceMemoController {

    private final VoiceMemoService voiceMemoService;

    public VoiceMemoController(VoiceMemoService voiceMemoService) {
        this.voiceMemoService = voiceMemoService;
    }

    @PostMapping(consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public VoiceMemo upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "anchorPersonUuid", required = false) String anchorPersonUuid,
            @AuthenticationPrincipal UserPrincipal principal) throws IOException {

        // save uploaded file to a temp location
        Path tempDir = Files.createTempDirectory("jali-audio-");
        File audioFile = tempDir.resolve(file.getOriginalFilename()).toFile();
        file.transferTo(audioFile);

        return voiceMemoService.upload(audioFile, anchorPersonUuid, principal.familyTreeId());
    }

    @GetMapping("/{uuid}")
    public VoiceMemo get(
            @PathVariable String uuid,
            @AuthenticationPrincipal UserPrincipal principal) {
        return voiceMemoService.getByUuid(uuid, principal.familyTreeId());
    }

    @PatchMapping("/{uuid}/transcript")
    public VoiceMemo editTranscript(
            @PathVariable String uuid,
            @RequestBody String editedTranscript,
            @AuthenticationPrincipal UserPrincipal principal) {
        return voiceMemoService.updateTranscript(uuid, editedTranscript, principal.familyTreeId());
    }

    @PostMapping("/{uuid}/confirm")
    public VoiceMemo confirm(
            @PathVariable String uuid,
            @AuthenticationPrincipal UserPrincipal principal) {
        return voiceMemoService.confirm(uuid, principal.familyTreeId());
    }

    @PostMapping("/{uuid}/undo")
    public VoiceMemo undo(
            @PathVariable String uuid,
            @AuthenticationPrincipal UserPrincipal principal) {
        return voiceMemoService.undo(uuid, principal.familyTreeId());
    }
}
