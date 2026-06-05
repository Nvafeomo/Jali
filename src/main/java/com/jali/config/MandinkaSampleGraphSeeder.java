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
import com.jali.repository.PersonRepository;

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
		if (personRepository.countByFamilyTreeId(SAMPLE_TREE_ID) > 0) {
			log.info("Mandinka sample graph already present for familyTreeId={}", SAMPLE_TREE_ID);
			return;
		}

		Person greatGrandfather = person("Sekou Keita", "c.1920", "Kankan, Guinea");
		Person greatGrandmother = person("Mariama Diabate", "c.1925", "Kankan, Guinea");
		Person grandfather = person("Mamadu Keita", "1948", "Kankan, Guinea");
		Person grandmother = person("Fatoumata Camara", "1952", "Monrovia, Liberia");
		Person father = person("Ibrahim Keita", "1975", "Monrovia, Liberia");
		Person mother = person("Hawa Toure", "1978", "Conakry, Guinea");
		Person child = person("Aminata Keita", "2002", "Columbus, Ohio, USA");

		greatGrandfather.getChildren().add(new ParentOfRelationship(grandfather));
		greatGrandmother.getChildren().add(new ParentOfRelationship(grandfather));
		grandfather.getSpouses().add(new MarriedToRelationship(grandmother));
		grandfather.getChildren().add(new ParentOfRelationship(father));
		grandmother.getChildren().add(new ParentOfRelationship(father));
		father.getSpouses().add(new MarriedToRelationship(mother));
		father.getChildren().add(new ParentOfRelationship(child));
		mother.getChildren().add(new ParentOfRelationship(child));

		personRepository.save(greatGrandfather);
		personRepository.save(greatGrandmother);
		personRepository.save(grandfather);
		personRepository.save(father);

		log.info("Seeded Mandinka sample graph (4 generations, familyTreeId={})", SAMPLE_TREE_ID);
	}

	private Person person(String fullName, String birthDate, String birthplace) {
		Person person = new Person(fullName, SAMPLE_TREE_ID);
		person.setBirthDate(birthDate);
		person.setBirthplace(birthplace);
		person.setEthnicGroup("Mandinka");
		return person;
	}
}
