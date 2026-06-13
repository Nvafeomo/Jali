package com.jali.service;

import org.springframework.stereotype.Service;

import com.jali.repository.neo4j.ParentLinkRow;
import com.jali.repository.neo4j.PersonRepository;

/**
 * Expands a single user-created link into related parent/sibling edges so users
 * do not have to wire every connection manually.
 *
 * <ul>
 *   <li>Linking a child to one parent also links them as siblings (half-sibling
 *       under the hood) to that parent's other children, without adding the other
 *       parent.</li>
 *   <li>Linking to a sibling copies that sibling's known parents onto the new
 *       person, which may trigger further sibling links per parent.</li>
 *   <li>When two people share a second parent, any half-sibling edge between them
 *       is promoted to a full sibling ({@code halfSibling = false}).</li>
 * </ul>
 */
@Service
public class RelationshipInferenceService {

	private final PersonRepository personRepository;

	public RelationshipInferenceService(PersonRepository personRepository) {
		this.personRepository = personRepository;
	}

	public void afterParentLinked(String parentUuid, String childUuid, Long familyTreeId) {
		java.util.Set<String> relatedSiblings = new java.util.HashSet<>();

		for (String coChildUuid : personRepository.findOtherChildUuidsByParent(
				parentUuid, childUuid, familyTreeId)) {
			inferSiblingLink(childUuid, coChildUuid, parentUuid, familyTreeId);
			relatedSiblings.add(coChildUuid);
		}
		relatedSiblings.addAll(personRepository.findSiblingUuidsOf(childUuid, familyTreeId));

		for (String siblingUuid : relatedSiblings) {
			refreshSiblingHalfFlag(childUuid, siblingUuid, familyTreeId);
		}
	}

	public void afterSiblingLinked(String anchorUuid, String siblingUuid, Long familyTreeId) {
		for (ParentLinkRow parentLink : personRepository.findParentLinksOfChild(siblingUuid, familyTreeId)) {
			inferParentLink(
					parentLink.parentUuid(),
					anchorUuid,
					familyTreeId,
					parentLink.parentRole());
		}
		refreshSiblingHalfFlag(anchorUuid, siblingUuid, familyTreeId);
	}

	private void inferParentLink(
			String parentUuid,
			String childUuid,
			Long familyTreeId,
			String parentRole) {
		if (personRepository.hasDirectParentOf(parentUuid, childUuid, familyTreeId)) {
			return;
		}
		if (personRepository.wouldCreateParentCycle(parentUuid, childUuid, familyTreeId)) {
			return;
		}
		if (personRepository.hasSiblingBetween(parentUuid, childUuid, familyTreeId)) {
			return;
		}
		if (personRepository.hasMarriageBetween(parentUuid, childUuid, familyTreeId)) {
			return;
		}

		personRepository.createParentOfEdge(parentUuid, childUuid, familyTreeId);
		if (parentRole != null && !parentRole.isBlank()) {
			personRepository.setParentRole(parentUuid, childUuid, familyTreeId, parentRole.toUpperCase());
		}
		afterParentLinked(parentUuid, childUuid, familyTreeId);
	}

	private void inferSiblingLink(
			String childUuid,
			String coChildUuid,
			String triggerParentUuid,
			Long familyTreeId) {
		if (childUuid.equals(coChildUuid)) {
			return;
		}
		if (personRepository.hasParentChildBetween(childUuid, coChildUuid, familyTreeId)) {
			return;
		}

		if (personRepository.hasSiblingBetween(childUuid, coChildUuid, familyTreeId)) {
			return;
		}

		long sharedParents = personRepository.countSharedParents(childUuid, coChildUuid, familyTreeId);
		boolean halfSibling = sharedParents < 2;
		String sharedParentUuid = halfSibling ? triggerParentUuid : null;

		personRepository.createSiblingOfEdgeIfAbsent(
				childUuid,
				coChildUuid,
				familyTreeId,
				halfSibling,
				sharedParentUuid,
				true);
	}

	private void refreshSiblingHalfFlag(String aUuid, String bUuid, Long familyTreeId) {
		if (!personRepository.hasSiblingBetween(aUuid, bUuid, familyTreeId)) {
			return;
		}

		long sharedParents = personRepository.countSharedParents(aUuid, bUuid, familyTreeId);
		if (sharedParents >= 2) {
			personRepository.updateSiblingHalfStatus(aUuid, bUuid, familyTreeId, false, null);
		}
	}
}
