package com.jali.repository.neo4j;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.neo4j.test.autoconfigure.DataNeo4jTest;
import org.springframework.data.neo4j.repository.config.EnableNeo4jRepositories;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.Neo4jContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import com.jali.neo4j.MarriedToRelationship;
import com.jali.neo4j.ParentOfRelationship;
import com.jali.neo4j.Person;
import com.jali.neo4j.SiblingOfRelationship;

@DataNeo4jTest
@EnableNeo4jRepositories(basePackages = "com.jali.repository.neo4j")
@Testcontainers(disabledWithoutDocker = true)
class PersonRepositoryTest {

	private static final long TREE_A = 100L;
	private static final long TREE_B = 200L;

	@Container
	static Neo4jContainer<?> neo4j = new Neo4jContainer<>(DockerImageName.parse("neo4j:5.26"))
			.withAdminPassword("testpass");

	@DynamicPropertySource
	static void neo4jProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.neo4j.uri", neo4j::getBoltUrl);
		registry.add("spring.neo4j.authentication.username", () -> "neo4j");
		registry.add("spring.neo4j.authentication.password", neo4j::getAdminPassword);
	}

	@Autowired
	private PersonRepository personRepository;

	@Test
	void savePerson_roundTripsScalarProperties() {
		Person person = new Person("Fatoumata Keita", TREE_A);
		person.setBirthplace("Monrovia, Liberia");
		person.setBiologicalSex("F");
		person.setIsUnknownPlaceholder(false);

		Person saved = personRepository.save(person);

		Person loaded = personRepository.findByUuidAndFamilyTreeId(saved.getUuid(), TREE_A).orElseThrow();
		assertThat(loaded.getId()).isNotNull();
		assertThat(loaded.getFullName()).isEqualTo("Fatoumata Keita");
		assertThat(loaded.getBirthplace()).isEqualTo("Monrovia, Liberia");
		assertThat(loaded.getBiologicalSex()).isEqualTo("F");
		assertThat(loaded.getFamilyTreeId()).isEqualTo(TREE_A);
		assertThat(loaded.getConfidenceScore()).isEqualTo(1.0);
	}

	@Test
	void parentOfRelationship_roundTripsEdgeProperties() {
		Person parent = personRepository.save(new Person("Ibrahim Keita", TREE_A));
		Person child = new Person("Aminata Keita", TREE_A);

		parent.getChildren().add(new ParentOfRelationship(child));
		parent.getChildren().getFirst().setDisputed(true);
		parent.getChildren().getFirst().getEvidenceList().add("ORAL_HISTORY:grandmother_account");

		personRepository.save(parent);

		Person loaded = personRepository.findById(parent.getId()).orElseThrow();

		assertThat(loaded.getChildren()).hasSize(1);
		ParentOfRelationship edge = loaded.getChildren().getFirst();
		assertThat(edge.getChild().getFullName()).isEqualTo("Aminata Keita");
		assertThat(edge.getConfidenceScore()).isEqualTo(0.10);
		assertThat(edge.getDisputed()).isTrue();
		assertThat(edge.getEvidenceList()).contains("ORAL_HISTORY:grandmother_account");
	}

	@Test
	void marriedToRelationship_roundTrips() {
		Person spouseA = personRepository.save(new Person("Mamadu Keita", TREE_A));
		Person spouseB = new Person("Fatoumata Camara", TREE_A);

		spouseA.getSpouses().add(new MarriedToRelationship(spouseB));
		spouseA.getSpouses().getFirst().setMarriageDate("1972");

		personRepository.save(spouseA);

		Person loaded = personRepository.findById(spouseA.getId()).orElseThrow();

		assertThat(loaded.getSpouses()).hasSize(1);
		assertThat(loaded.getSpouses().getFirst().getSpouse().getFullName()).isEqualTo("Fatoumata Camara");
		assertThat(loaded.getSpouses().getFirst().getMarriageDate()).isEqualTo("1972");
	}

	@Test
	void findByUuid_wrongFamilyTreeId_isEmpty() {
		Person saved = personRepository.save(new Person("Sekou Keita", TREE_A));

		assertThat(personRepository.findByUuidAndFamilyTreeId(saved.getUuid(), TREE_B)).isEmpty();
		assertThat(personRepository.existsByUuidAndFamilyTreeId(saved.getUuid(), TREE_A)).isTrue();
	}

	@Test
	void relationshipExistenceQueries_detectParentChildAndConflicts() {
		Person parent = personRepository.save(new Person("Ibrahim Keita", TREE_A));
		Person child = personRepository.save(new Person("Aminata Keita", TREE_A));
		parent.getChildren().add(new ParentOfRelationship(child));
		personRepository.save(parent);

		assertThat(personRepository.hasDirectParentOf(parent.getUuid(), child.getUuid(), TREE_A)).isTrue();
		assertThat(personRepository.hasParentChildBetween(parent.getUuid(), child.getUuid(), TREE_A)).isTrue();
		assertThat(personRepository.wouldCreateParentCycle(child.getUuid(), parent.getUuid(), TREE_A)).isTrue();
		assertThat(personRepository.hasSiblingBetween(parent.getUuid(), child.getUuid(), TREE_A)).isFalse();
	}

	@Test
	void relationshipExistenceQueries_detectSiblingAndMarriage() {
		Person alice = personRepository.save(new Person("Alice", TREE_A));
		Person bob = personRepository.save(new Person("Bob", TREE_A));

		alice.getSiblings().add(new SiblingOfRelationship(bob));
		personRepository.save(alice);

		assertThat(personRepository.hasSiblingBetween(alice.getUuid(), bob.getUuid(), TREE_A)).isTrue();
		assertThat(personRepository.hasParentChildBetween(alice.getUuid(), bob.getUuid(), TREE_A)).isFalse();

		Person carol = personRepository.save(new Person("Carol", TREE_A));
		Person dave = personRepository.save(new Person("Dave", TREE_A));
		carol.getSpouses().add(new MarriedToRelationship(dave));
		personRepository.save(carol);

		assertThat(personRepository.hasMarriageBetween(carol.getUuid(), dave.getUuid(), TREE_A)).isTrue();
	}
}
