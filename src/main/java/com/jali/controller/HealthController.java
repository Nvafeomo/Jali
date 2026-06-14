package com.jali.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.neo4j.driver.SessionConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

	private final DataSource dataSource;
	private final Driver neo4jDriver;
	private final String neo4jDatabase;

	public HealthController(
			DataSource dataSource,
			Driver neo4jDriver,
			@Value("${spring.neo4j.database:neo4j}") String neo4jDatabase) {
		this.dataSource = dataSource;
		this.neo4jDriver = neo4jDriver;
		this.neo4jDatabase = neo4jDatabase;
	}

	@GetMapping("/health/live")
	public ResponseEntity<Map<String, String>> live() {
		return ResponseEntity.ok(Map.of("status", "UP"));
	}

	@GetMapping("/health")
	public ResponseEntity<Map<String, Object>> health() {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("status", "UP");

		boolean postgresUp = checkPostgres();
		boolean neo4jUp = checkNeo4j();

		body.put("postgres", postgresUp ? "UP" : "DOWN");
		body.put("neo4j", neo4jUp ? "UP" : "DOWN");

		if (!postgresUp || !neo4jUp) {
			body.put("status", "DOWN");
			return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
		}

		return ResponseEntity.ok(body);
	}

	private boolean checkPostgres() {
		try (var connection = dataSource.getConnection()) {
			return connection.isValid(2);
		}
		catch (Exception ex) {
			return false;
		}
	}

	private boolean checkNeo4j() {
		try (Session session = neo4jDriver.session(SessionConfig.forDatabase(neo4jDatabase))) {
			session.run("RETURN 1").consume();
			return true;
		}
		catch (Exception ex) {
			return false;
		}
	}
}
