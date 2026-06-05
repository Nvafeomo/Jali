package com.jali.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.jali.neo4j.Person;
import com.jali.repository.PersonRepository;

@Service
public class PersonGraphService {

	private final PersonRepository personRepository;

	public PersonGraphService(PersonRepository personRepository) {
		this.personRepository = personRepository;
	}

	public Person requireInTree(String uuid, Long familyTreeId) {
		return personRepository.findByUuidAndFamilyTreeId(uuid, familyTreeId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Person not found in this family tree"));
	}

	public Person requireInTreeWithRelationships(String uuid, Long familyTreeId) {
		Person person = requireInTree(uuid, familyTreeId);
		return personRepository.findById(person.getId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Person not found in this family tree"));
	}

	public Person saveInTree(Person person, Long familyTreeId) {
		if (!familyTreeId.equals(person.getFamilyTreeId())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Person familyTreeId does not match authenticated tree");
		}
		return personRepository.save(person);
	}
}
