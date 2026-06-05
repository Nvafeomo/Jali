package com.jali.config;

import org.neo4j.driver.Driver;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.data.neo4j.core.Neo4jOperations;
import org.springframework.data.neo4j.core.Neo4jTemplate;
import org.springframework.data.neo4j.core.mapping.Neo4jMappingContext;
import org.springframework.data.neo4j.core.transaction.Neo4jTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * JPA registers a {@code PlatformTransactionManager} first, so Boot skips creating a
 * {@link Neo4jTransactionManager}. Without it, {@link Neo4jTemplate} has null transaction
 * templates and repository @Query methods NPE.
 */
@Configuration
@EnableTransactionManagement
public class Neo4jConfig {

	@Bean
	public Neo4jTransactionManager neo4jTransactionManager(Driver driver) {
		return new Neo4jTransactionManager(driver);
	}

	@Bean
	@ConditionalOnMissingBean(Neo4jOperations.class)
	public Neo4jTemplate neo4jTemplate(
			Neo4jClient neo4jClient,
			Neo4jMappingContext neo4jMappingContext,
			Neo4jTransactionManager transactionManager) {
		return new Neo4jTemplate(neo4jClient, neo4jMappingContext, transactionManager);
	}
}
