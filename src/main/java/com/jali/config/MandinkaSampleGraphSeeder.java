package com.jali.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.jali.neo4j.MarriedToRelationship;
import com.jali.neo4j.ParentOfRelationship;
import com.jali.neo4j.Person;
import com.jali.repository.neo4j.PersonRepository;

/**
 * Dev-only sample tree (familyTreeId 999001). Enable with
 * {@code jali.graph.seed.enabled=true} in application-local.properties.
 */
@Component
@ConditionalOnProperty(name = "jali.graph.seed.enabled", havingValue = "true")
public class MandinkaSampleGraphSeeder implements ApplicationRunner {

	public static final long SAMPLE_TREE_ID = 999_001L;

	private static final Logger log = LoggerFactory.getLogger(MandinkaSampleGraphSeeder.class);

	private final PersonRepository personRepository;

	public MandinkaSampleGraphSeeder(PersonRepository personRepository) {
		this.personRepository = personRepository;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!personRepository.findAllByFamilyTreeId(SAMPLE_TREE_ID).isEmpty()) {
			log.info("Mandinka sample graph already present for familyTreeId={}", SAMPLE_TREE_ID);
			return;
		}

		Person greatGrandfather = save(person("Sekou Keita", "c.1920", "Kankan, Guinea"));
		Person greatGrandmother = save(person("Mariama Diabate", "c.1925", "Kankan, Guinea"));
		Person grandfather = save(person("Mamadu Keita", "1948", "Kankan, Guinea"));
		Person grandmother = save(person("Fatoumata Camara", "1952", "Monrovia, Liberia"));
		Person father = save(person("Ibrahim Keita", "1975", "Monrovia, Liberia"));
		Person mother = save(person("Hawa Toure", "1978", "Conakry, Guinea"));
		Person child = save(person("Aminata Keita", "2002", "Columbus, Ohio, USA"));

		linkParent(greatGrandfather, grandfather);
		linkParent(greatGrandmother, grandfather);
		linkSpouse(grandfather, grandmother);
		linkParent(grandfather, father);
		linkParent(grandmother, father);
		linkSpouse(father, mother);
		linkParent(father, child);
		linkParent(mother, child);

		log.info("Seeded Mandinka sample graph (4 generations, familyTreeId={})", SAMPLE_TREE_ID);
	}

	private Person save(Person person) {
		return personRepository.save(person);
	}

	private void linkParent(Person parent, Person child) {
		Person from = personRepository.findById(parent.getId()).orElseThrow();
		Person to = personRepository.findById(child.getId()).orElseThrow();
		from.getChildren().add(new ParentOfRelationship(to));
		personRepository.save(from);
	}

	private void linkSpouse(Person a, Person b) {
		Person from = personRepository.findById(a.getId()).orElseThrow();
		Person to = personRepository.findById(b.getId()).orElseThrow();
		from.getSpouses().add(new MarriedToRelationship(to));
		personRepository.save(from);
	}

	private Person person(String fullName, String birthDate, String birthplace) {
		Person person = new Person(fullName, SAMPLE_TREE_ID);
		person.setBirthDate(birthDate);
		person.setBirthplace(birthplace);
		person.setEthnicGroup("Mandinka");
		return person;
	}
}
