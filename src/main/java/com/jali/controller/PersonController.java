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
import com.jali.neo4j.Person;
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

		Person person = new Person(request.fullName(), principal.familyTreeId());
		if (request.birthDate() != null) {
			person.setBirthDate(request.birthDate());
		}
		if (request.deathDate() != null) {
			person.setDeathDate(request.deathDate());
		}
		if (request.birthplace() != null) {
			person.setBirthplace(request.birthplace());
		}
		if (request.ethnicGroup() != null) {
			person.setEthnicGroup(request.ethnicGroup());
		}
		if (request.bio() != null) {
			person.setBio(request.bio());
		}
		if (request.biologicalSex() != null) {
			person.setBiologicalSex(request.biologicalSex());
		}
		if (request.isUnknownPlaceholder() != null) {
			person.setIsUnknownPlaceholder(request.isUnknownPlaceholder());
		}

		return PersonResponse.from(personGraphService.saveInTree(person, principal.familyTreeId()));
	}

	@GetMapping("/{uuid}")
	public PersonResponse getPerson(
			@PathVariable String uuid,
			@AuthenticationPrincipal UserPrincipal principal) {

		return PersonResponse.from(
				personGraphService.requireInTree(uuid, principal.familyTreeId()));
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
