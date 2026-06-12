package com.jali.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jali.service.RelationshipDedupeService;

@RestController
@RequestMapping("/graph/maintenance")
public class GraphMaintenanceController {

	private final RelationshipDedupeService relationshipDedupeService;

	public GraphMaintenanceController(RelationshipDedupeService relationshipDedupeService) {
		this.relationshipDedupeService = relationshipDedupeService;
	}

	@GetMapping("/duplicate-relationships")
	public List<RelationshipDedupeService.DuplicateRelationship> scanDuplicates() {
		return relationshipDedupeService.findDuplicates();
	}

	@PostMapping("/dedupe-relationships")
	public RelationshipDedupeService.DedupeResult dedupeRelationships() {
		return relationshipDedupeService.dedupeAll();
	}
}
