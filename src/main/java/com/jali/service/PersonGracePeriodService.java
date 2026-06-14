package com.jali.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.jali.neo4j.Person;

@Service
public class PersonGracePeriodService {

	public static final int GRACE_DAYS = 7;

	public boolean isWithinGracePeriod(Person person) {
		if (person.getCreatedAt() == null) {
			return false;
		}
		return person.getCreatedAt().plus(GRACE_DAYS, ChronoUnit.DAYS).isAfter(Instant.now());
	}

	public long daysRemaining(Person person) {
		if (person.getCreatedAt() == null) {
			return 0;
		}
		long days = ChronoUnit.DAYS.between(Instant.now(), person.getCreatedAt().plus(GRACE_DAYS, ChronoUnit.DAYS));
		return Math.max(0, days);
	}

	public void requireWithinGracePeriod(Person person) {
		if (!isWithinGracePeriod(person)) {
			throw new ResponseStatusException(
					HttpStatus.FORBIDDEN,
					"Person details can only be edited within "
							+ GRACE_DAYS
							+ " days of adding them to the tree.");
		}
	}

	public void requireWithinGracePeriodToRemoveLinks(Person person) {
		if (!isWithinGracePeriod(person)) {
			throw new ResponseStatusException(
					HttpStatus.FORBIDDEN,
					"Relationship links can only be removed within "
							+ GRACE_DAYS
							+ " days of adding this person to the tree.");
		}
	}

	public void requireWithinGracePeriodToDelete(Person person) {
		if (!isWithinGracePeriod(person)) {
			throw new ResponseStatusException(
					HttpStatus.FORBIDDEN,
					"People can only be deleted within "
							+ GRACE_DAYS
							+ " days of adding them to the tree.");
		}
	}
}
