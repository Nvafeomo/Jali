package com.jali.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.jali.neo4j.Person;

class PersonGracePeriodServiceTest {

	private final PersonGracePeriodService service = new PersonGracePeriodService();

	@Test
	void withinGracePeriod_whenCreatedToday() {
		Person person = new Person("Aminata", 1L);
		person.setCreatedAt(Instant.now());

		assertThat(service.isWithinGracePeriod(person)).isTrue();
		assertThat(service.daysRemaining(person)).isEqualTo(7);
	}

	@Test
	void outsideGracePeriod_whenCreatedEightDaysAgo() {
		Person person = new Person("Ibrahim", 1L);
		person.setCreatedAt(Instant.now().minus(8, ChronoUnit.DAYS));

		assertThat(service.isWithinGracePeriod(person)).isFalse();
		assertThat(service.daysRemaining(person)).isZero();
	}

	@Test
	void outsideGracePeriod_whenCreatedAtMissing() {
		Person person = new Person("Legacy", 1L);
		person.setCreatedAt(null);

		assertThat(service.isWithinGracePeriod(person)).isFalse();
	}

	@Test
	void requireWithinGracePeriod_throwsWhenLocked() {
		Person person = new Person("Locked", 1L);
		person.setCreatedAt(Instant.now().minus(10, ChronoUnit.DAYS));

		assertThatThrownBy(() -> service.requireWithinGracePeriod(person))
				.isInstanceOf(ResponseStatusException.class)
				.satisfies(ex -> {
					ResponseStatusException error = (ResponseStatusException) ex;
					assert error.getStatusCode() == HttpStatus.FORBIDDEN;
				});
	}
}
