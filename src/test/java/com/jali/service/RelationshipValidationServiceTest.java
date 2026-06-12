package com.jali.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.jali.repository.neo4j.PersonRepository;

@ExtendWith(MockitoExtension.class)
class RelationshipValidationServiceTest {

	@Mock
	private PersonRepository personRepository;

	@InjectMocks
	private RelationshipValidationService validationService;

	@Test
	void rejectsDuplicateParentChild() {
		when(personRepository.hasDirectParentOf("parent", "child", 1L)).thenReturn(true);

		assertThatThrownBy(() -> validationService.validateCreate("parent", "child", "PARENT_OF", 1L))
				.isInstanceOf(ResponseStatusException.class)
				.satisfies(ex -> {
					ResponseStatusException error = (ResponseStatusException) ex;
					assert error.getStatusCode() == HttpStatus.CONFLICT;
					assert error.getReason().contains("already exists");
				});
	}

	@Test
	void rejectsSiblingWhenParentChildExists() {
		when(personRepository.hasSiblingBetween("a", "b", 1L)).thenReturn(false);
		when(personRepository.hasParentChildBetween("a", "b", 1L)).thenReturn(true);

		assertThatThrownBy(() -> validationService.validateCreate("a", "b", "SIBLING_OF", 1L))
				.isInstanceOf(ResponseStatusException.class)
				.satisfies(ex -> {
					ResponseStatusException error = (ResponseStatusException) ex;
					assert error.getReason().contains("parent-child");
				});
	}

	@Test
	void rejectsParentChildWhenAlreadySiblings() {
		when(personRepository.hasDirectParentOf("parent", "child", 1L)).thenReturn(false);
		when(personRepository.wouldCreateParentCycle("parent", "child", 1L)).thenReturn(false);
		when(personRepository.hasSiblingBetween("parent", "child", 1L)).thenReturn(true);

		assertThatThrownBy(() -> validationService.validateCreate("parent", "child", "PARENT_OF", 1L))
				.isInstanceOf(ResponseStatusException.class)
				.satisfies(ex -> {
					ResponseStatusException error = (ResponseStatusException) ex;
					assert error.getReason().contains("siblings");
				});
	}
}
