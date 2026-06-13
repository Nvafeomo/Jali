package com.jali.service;

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.jali.repository.neo4j.ParentLinkRow;
import com.jali.repository.neo4j.PersonRepository;

@ExtendWith(MockitoExtension.class)
class RelationshipInferenceServiceTest {

	private static final Long TREE_ID = 1L;

	@Mock
	private PersonRepository personRepository;

	@InjectMocks
	private RelationshipInferenceService inferenceService;

	@Test
	void parentLinkAddsHalfSiblingEdgesToCoChildren() {
		when(personRepository.findOtherChildUuidsByParent("parent", "child", TREE_ID))
				.thenReturn(List.of("sibling1", "sibling2"));
		when(personRepository.hasSiblingBetween("child", "sibling1", TREE_ID)).thenReturn(false);
		when(personRepository.hasSiblingBetween("child", "sibling2", TREE_ID)).thenReturn(false);
		when(personRepository.hasParentChildBetween("child", "sibling1", TREE_ID)).thenReturn(false);
		when(personRepository.hasParentChildBetween("child", "sibling2", TREE_ID)).thenReturn(false);
		when(personRepository.countSharedParents("child", "sibling1", TREE_ID)).thenReturn(1L);
		when(personRepository.countSharedParents("child", "sibling2", TREE_ID)).thenReturn(1L);
		when(personRepository.findSiblingUuidsOf("child", TREE_ID)).thenReturn(List.of());

		inferenceService.afterParentLinked("parent", "child", TREE_ID);

		verify(personRepository).createSiblingOfEdgeIfAbsent(
				"child", "sibling1", TREE_ID, true, "parent", true);
		verify(personRepository).createSiblingOfEdgeIfAbsent(
				"child", "sibling2", TREE_ID, true, "parent", true);
	}

	@Test
	void siblingLinkCopiesKnownParentsAndSkipsExisting() {
		when(personRepository.findParentLinksOfChild("sibling", TREE_ID))
				.thenReturn(List.of(
						new ParentLinkRow("mother", "MOTHER"),
						new ParentLinkRow("father", "FATHER")));
		when(personRepository.hasDirectParentOf("mother", "anchor", TREE_ID)).thenReturn(false);
		when(personRepository.hasDirectParentOf("father", "anchor", TREE_ID)).thenReturn(true);
		when(personRepository.wouldCreateParentCycle(anyString(), eq("anchor"), eq(TREE_ID))).thenReturn(false);
		when(personRepository.hasSiblingBetween(anyString(), eq("anchor"), eq(TREE_ID))).thenReturn(false);
		when(personRepository.hasMarriageBetween(anyString(), eq("anchor"), eq(TREE_ID))).thenReturn(false);
		when(personRepository.findOtherChildUuidsByParent(eq("mother"), eq("anchor"), eq(TREE_ID)))
				.thenReturn(List.of());
		when(personRepository.findSiblingUuidsOf("anchor", TREE_ID)).thenReturn(List.of());
		when(personRepository.hasSiblingBetween("anchor", "sibling", TREE_ID)).thenReturn(true);

		inferenceService.afterSiblingLinked("anchor", "sibling", TREE_ID);

		verify(personRepository).createParentOfEdge("mother", "anchor", TREE_ID);
		verify(personRepository).setParentRole("mother", "anchor", TREE_ID, "MOTHER");
		verify(personRepository, never()).createParentOfEdge("father", "anchor", TREE_ID);
	}

	@Test
	void skipsSiblingInferenceWhenAlreadyLinked() {
		when(personRepository.findOtherChildUuidsByParent("parent", "child", TREE_ID))
				.thenReturn(List.of("sibling1"));
		when(personRepository.hasSiblingBetween("child", "sibling1", TREE_ID)).thenReturn(true);
		when(personRepository.findSiblingUuidsOf("child", TREE_ID)).thenReturn(List.of("sibling1"));
		when(personRepository.countSharedParents("child", "sibling1", TREE_ID)).thenReturn(1L);
		when(personRepository.isHalfSiblingEdge("child", "sibling1", TREE_ID)).thenReturn(true);

		inferenceService.afterParentLinked("parent", "child", TREE_ID);

		verify(personRepository, never()).createSiblingOfEdgeIfAbsent(
				anyString(), anyString(), eq(TREE_ID), anyBoolean(), anyString(), anyBoolean());
		verify(personRepository, never()).updateSiblingHalfStatus(
				anyString(), anyString(), eq(TREE_ID), eq(false), eq(null));
	}

	@Test
	void promotesHalfSiblingToFullWhenSecondSharedParentExists() {
		when(personRepository.findOtherChildUuidsByParent("father", "child", TREE_ID))
				.thenReturn(List.of("sibling1"));
		when(personRepository.hasSiblingBetween("child", "sibling1", TREE_ID)).thenReturn(true);
		when(personRepository.findSiblingUuidsOf("child", TREE_ID)).thenReturn(List.of("sibling1"));
		when(personRepository.countSharedParents("child", "sibling1", TREE_ID)).thenReturn(2L);
		when(personRepository.isHalfSiblingEdge("child", "sibling1", TREE_ID)).thenReturn(false);
		when(personRepository.findParentLinksOfChild("child", TREE_ID))
				.thenReturn(List.of(new ParentLinkRow("mother", "MOTHER"), new ParentLinkRow("father", "FATHER")));
		when(personRepository.hasDirectParentOf("mother", "sibling1", TREE_ID)).thenReturn(true);
		when(personRepository.hasDirectParentOf("father", "sibling1", TREE_ID)).thenReturn(true);

		inferenceService.afterParentLinked("father", "child", TREE_ID);

		verify(personRepository).updateSiblingHalfStatus("child", "sibling1", TREE_ID, false, null);
		verify(personRepository, never()).createSiblingOfEdgeIfAbsent(
				anyString(), anyString(), eq(TREE_ID), anyBoolean(), anyString(), anyBoolean());
	}

	@Test
	void createsFullSiblingEdgeWhenBothParentsAlreadyShared() {
		when(personRepository.findOtherChildUuidsByParent("father", "child", TREE_ID))
				.thenReturn(List.of("sibling1"));
		when(personRepository.hasSiblingBetween("child", "sibling1", TREE_ID)).thenReturn(false);
		when(personRepository.hasParentChildBetween("child", "sibling1", TREE_ID)).thenReturn(false);
		when(personRepository.countSharedParents("child", "sibling1", TREE_ID)).thenReturn(2L);
		when(personRepository.findSiblingUuidsOf("child", TREE_ID)).thenReturn(List.of());

		inferenceService.afterParentLinked("father", "child", TREE_ID);

		verify(personRepository).createSiblingOfEdgeIfAbsent(
				"child", "sibling1", TREE_ID, false, null, true);
	}

	@Test
	void syncsNewParentsToFullSiblingsWhenChildGainsParentsLater() {
		when(personRepository.findOtherChildUuidsByParent("father", "child", TREE_ID))
				.thenReturn(List.of());
		when(personRepository.findSiblingUuidsOf("child", TREE_ID)).thenReturn(List.of("sibling1"));
		when(personRepository.isHalfSiblingEdge("child", "sibling1", TREE_ID)).thenReturn(false);
		when(personRepository.findParentLinksOfChild("child", TREE_ID))
				.thenReturn(List.of(new ParentLinkRow("mother", "MOTHER"), new ParentLinkRow("father", "FATHER")));
		when(personRepository.hasDirectParentOf("mother", "sibling1", TREE_ID)).thenReturn(false);
		when(personRepository.hasDirectParentOf("father", "sibling1", TREE_ID)).thenReturn(false);
		when(personRepository.wouldCreateParentCycle(anyString(), eq("sibling1"), eq(TREE_ID))).thenReturn(false);
		when(personRepository.hasSiblingBetween(anyString(), eq("sibling1"), eq(TREE_ID))).thenReturn(false);
		when(personRepository.hasMarriageBetween(anyString(), eq("sibling1"), eq(TREE_ID))).thenReturn(false);
		when(personRepository.findOtherChildUuidsByParent(eq("mother"), eq("sibling1"), eq(TREE_ID)))
				.thenReturn(List.of());
		when(personRepository.findOtherChildUuidsByParent(eq("father"), eq("sibling1"), eq(TREE_ID)))
				.thenReturn(List.of());

		inferenceService.afterParentLinked("father", "child", TREE_ID);

		verify(personRepository).createParentOfEdge("mother", "sibling1", TREE_ID);
		verify(personRepository).createParentOfEdge("father", "sibling1", TREE_ID);
	}

	@Test
	void doesNotSyncSecondParentToHalfSibling() {
		when(personRepository.findOtherChildUuidsByParent("father", "child", TREE_ID))
				.thenReturn(List.of());
		when(personRepository.findSiblingUuidsOf("child", TREE_ID)).thenReturn(List.of("sibling1"));
		when(personRepository.isHalfSiblingEdge("child", "sibling1", TREE_ID)).thenReturn(true);

		inferenceService.afterParentLinked("father", "child", TREE_ID);

		verify(personRepository, never()).createParentOfEdge(eq("father"), eq("sibling1"), eq(TREE_ID));
	}

	@Test
	void spouseLinkAddsCoParentWhenChildHasExactlyOneParent() {
		when(personRepository.findChildUuidsOf("father", TREE_ID)).thenReturn(List.of("child1"));
		when(personRepository.hasDirectParentOf("mother", "child1", TREE_ID)).thenReturn(false);
		when(personRepository.countParentsOf("child1", TREE_ID)).thenReturn(1L);
		when(personRepository.wouldCreateParentCycle("mother", "child1", TREE_ID)).thenReturn(false);
		when(personRepository.hasSiblingBetween("mother", "child1", TREE_ID)).thenReturn(false);
		when(personRepository.hasMarriageBetween("mother", "child1", TREE_ID)).thenReturn(false);
		when(personRepository.findOtherChildUuidsByParent("mother", "child1", TREE_ID)).thenReturn(List.of());
		when(personRepository.findSiblingUuidsOf("child1", TREE_ID)).thenReturn(List.of());
		when(personRepository.findChildUuidsOf("mother", TREE_ID)).thenReturn(List.of());

		inferenceService.afterSpouseLinked("father", "mother", TREE_ID);

		verify(personRepository).createParentOfEdge("mother", "child1", TREE_ID);
	}

	@Test
	void spouseLinkSkipsChildWithTwoParents() {
		when(personRepository.findChildUuidsOf("father", TREE_ID)).thenReturn(List.of("child1"));
		when(personRepository.hasDirectParentOf("mother", "child1", TREE_ID)).thenReturn(false);
		when(personRepository.countParentsOf("child1", TREE_ID)).thenReturn(2L);
		when(personRepository.findChildUuidsOf("mother", TREE_ID)).thenReturn(List.of());

		inferenceService.afterSpouseLinked("father", "mother", TREE_ID);

		verify(personRepository, never()).createParentOfEdge(eq("mother"), eq("child1"), eq(TREE_ID));
	}
}
