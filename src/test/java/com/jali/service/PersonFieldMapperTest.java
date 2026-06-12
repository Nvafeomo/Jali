package com.jali.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.jali.neo4j.Person;

class PersonFieldMapperTest {

	private final PersonFieldMapper mapper = new PersonFieldMapper();

	@Test
	void create_leavesBirthAndDeathUnsetWhenBlank() {
		Person person = new Person("Ada Konneh", 1L);

		mapper.applyCreateFields(person, Map.of(
				"birthDate", "  ",
				"deathDate", ""));

		assertThat(person.getBirthDate()).isNull();
		assertThat(person.getDeathDate()).isNull();
	}

	@Test
	void update_clearsBirthAndDeathWhenBlank() {
		Person person = new Person("Ada Konneh", 1L);
		person.setBirthDate("1952");
		person.setDeathDate("2018");

		mapper.applyUpdateFields(person, Map.of(
				"birthDate", "",
				"deathDate", "  "));

		assertThat(person.getBirthDate()).isNull();
		assertThat(person.getDeathDate()).isNull();
	}
}
