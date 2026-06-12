package com.jali.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.jali.dto.CreatePersonRequest;
import com.jali.dto.PersonResponse;
import com.jali.repository.neo4j.PersonRepository;
import com.jali.security.UserPrincipal;
import com.jali.service.PersonGraphService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/people")
public class PersonController {

	private final PersonRepository personRepository;
	private final PersonGraphService personGraphService;

	public PersonController(PersonRepository personRepository, PersonGraphService personGraphService) {
		this.personRepository = personRepository;
		this.personGraphService = personGraphService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public PersonResponse createPerson(
			@Valid @RequestBody CreatePersonRequest request,
			@AuthenticationPrincipal UserPrincipal principal) {
		return PersonResponse.from(personGraphService.createPerson(request, principal.familyTreeId()));
	}

	@GetMapping("/{uuid}")
	public PersonResponse getPerson(
			@PathVariable String uuid,
			@AuthenticationPrincipal UserPrincipal principal) {
		return PersonResponse.from(personGraphService.requireInTree(uuid, principal.familyTreeId()));
	}

	@GetMapping
	public List<PersonResponse> listPeople(@AuthenticationPrincipal UserPrincipal principal) {
		return personRepository.findAllByFamilyTreeId(principal.familyTreeId())
				.stream()
				.map(PersonResponse::from)
				.toList();
	}

	@GetMapping("/{uuid}/ancestors")
	public List<PersonResponse> getAncestors(
			@PathVariable String uuid,
			@RequestParam(defaultValue = "4") int depth,
			@AuthenticationPrincipal UserPrincipal principal) {
		return personGraphService.findAncestors(uuid, principal.familyTreeId(), depth)
				.stream()
				.map(PersonResponse::from)
				.toList();
	}

	@GetMapping("/{uuid}/descendants")
	public List<PersonResponse> getDescendants(
			@PathVariable String uuid,
			@RequestParam(defaultValue = "4") int depth,
			@AuthenticationPrincipal UserPrincipal principal) {
		return personGraphService.findDescendants(uuid, principal.familyTreeId(), depth)
				.stream()
				.map(PersonResponse::from)
				.toList();
	}
}
