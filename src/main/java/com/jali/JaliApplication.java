package com.jali;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.neo4j.repository.config.EnableNeo4jRepositories;

import com.jali.config.JwtProperties;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
@EnableJpaRepositories(basePackages = "com.jali.repository")
@EnableNeo4jRepositories(basePackages = "com.jali.repository")
public class JaliApplication {

	public static void main(String[] args) {
		SpringApplication.run(JaliApplication.class, args);
	}

}
