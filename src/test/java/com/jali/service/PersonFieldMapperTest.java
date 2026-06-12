package com.jali.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.jali.neo4j.Person;

class PersonFieldMapperTest {

	private final PersonFieldMapper mapper = new PersonFieldMapper();

	@Test
	void create_leavesBlankLifeStatusUnset() {
		Person person = new Person("Ada Konneh", 1L);

		mapper.applyCreateFields(person, Map.of(
				"birthDate", "  ",
				"deathDate", ""));

		assertThat(person.getBirthDate()).isNull();
		assertThat(person.getDeathDate()).isNull();
	}

	@Test
	void create_normalizesLivingAndUnknownMarkers() {
		Person alive = new Person("Ada Konneh", 1L);
		mapper.applyCreateFields(alive, Map.of("deathDate", " Living "));
		assertThat(alive.getDeathDate()).isEqualTo("living");

		Person deceased = new Person("Bob", 1L);
		mapper.applyCreateFields(deceased, Map.of("deathDate", " Unknown "));
		assertThat(deceased.getDeathDate()).isEqualTo("unknown");
	}

	@Test
	void update_clearsLifeStatusWhenBlank() {
		Person person = new Person("Ada Konneh", 1L);
		person.setBirthDate("1952");
		person.setDeathDate("living");

		mapper.applyUpdateFields(person, Map.of(
				"birthDate", "",
				"deathDate", "  "));

		assertThat(person.getBirthDate()).isNull();
		assertThat(person.getDeathDate()).isNull();
	}
}
