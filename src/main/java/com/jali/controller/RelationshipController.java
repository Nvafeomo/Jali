package com.jali.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;

import com.jali.dto.AddEvidenceRequest;
import com.jali.dto.CreateRelationshipRequest;
import com.jali.dto.PersonResponse;
import com.jali.neo4j.EvidenceType;
import com.jali.security.UserPrincipal;
import com.jali.service.ConfidenceScoreService;
import com.jali.service.RelationshipService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/relationships")
public class RelationshipController {

	private final RelationshipService relationshipService;
	private final ConfidenceScoreService confidenceScoreService;

	public RelationshipController(
			RelationshipService relationshipService,
			ConfidenceScoreService confidenceScoreService) {
		this.relationshipService = relationshipService;
		this.confidenceScoreService = confidenceScoreService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public void createRelationship(
			@Valid @RequestBody CreateRelationshipRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {

		relationshipService.create(
				request.fromUuid(),
				request.toUuid(),
				request.relationshipType(),
				principal.familyTreeId());
	}

	@PostMapping("/evidence")
	@ResponseStatus(HttpStatus.OK)
	public PersonResponse addEvidence(
			@Valid @RequestBody AddEvidenceRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {

		EvidenceType evidenceType;
		try {
			evidenceType = EvidenceType.valueOf(request.evidenceType().toUpperCase());
		}
		catch (IllegalArgumentException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Unknown evidence type. Valid types: " + Arrays.toString(EvidenceType.values()));
		}

		var updated = confidenceScoreService.addEvidenceToRelationship(
				request.fromUuid(),
				request.toUuid(),
				request.relationshipType(),
				evidenceType,
				request.source(),
				principal.familyTreeId());

		return PersonResponse.from(updated);
	}
}
