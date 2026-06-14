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
	private final String neo4jUri;
	private final String neo4jUsername;
	private final String neo4jPassword;

	public HealthController(
			DataSource dataSource,
			Driver neo4jDriver,
			@Value("${spring.data.neo4j.database:neo4j}") String neo4jDatabase,
			@Value("${spring.neo4j.uri:}") String neo4jUri,
			@Value("${spring.neo4j.authentication.username:}") String neo4jUsername,
			@Value("${spring.neo4j.authentication.password:}") String neo4jPassword) {
		this.dataSource = dataSource;
		this.neo4jDriver = neo4jDriver;
		this.neo4jDatabase = neo4jDatabase;
		this.neo4jUri = neo4jUri;
		this.neo4jUsername = neo4jUsername;
		this.neo4jPassword = neo4jPassword;
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
		body.put("postgres", postgresUp ? "UP" : "DOWN");

		body.put("neo4jUriConfigured", neo4jUri != null && !neo4jUri.isBlank());
		body.put("neo4jUsernameConfigured", neo4jUsername != null && !neo4jUsername.isBlank());
		body.put("neo4jPasswordConfigured", neo4jPassword != null && !neo4jPassword.isBlank());
		if (neo4jUri != null && !neo4jUri.isBlank()) {
			body.put("neo4jUriScheme", neo4jUri.startsWith("neo4j+s://") ? "neo4j+s" : "other");
		}

		String neo4jError = null;
		boolean neo4jUp = checkNeo4j();
		if (!neo4jUp) {
			neo4jError = lastNeo4jError;
		}
		body.put("neo4j", neo4jUp ? "UP" : "DOWN");
		if (neo4jError != null) {
			body.put("neo4jError", neo4jError);
		}

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

	private String lastNeo4jError;

	private boolean checkNeo4j() {
		lastNeo4jError = null;

		if (neo4jUri == null || neo4jUri.isBlank()) {
			lastNeo4jError = "NEO4J_URI is not set";
			return false;
		}
		if (!neo4jUri.startsWith("neo4j+s://") && !neo4jUri.startsWith("bolt://")) {
			lastNeo4jError = "NEO4J_URI must start with neo4j+s:// (Aura) or bolt:// (local)";
			return false;
		}

		try {
			neo4jDriver.verifyConnectivity();
		}
		catch (Exception ex) {
			lastNeo4jError = sanitizeNeo4jError(ex);
			return false;
		}

		try (Session session = neo4jDriver.session(SessionConfig.forDatabase(neo4jDatabase))) {
			session.run("RETURN 1").consume();
			return true;
		}
		catch (Exception ex) {
			lastNeo4jError = sanitizeNeo4jError(ex);
			return false;
		}
	}

	private static String sanitizeNeo4jError(Exception ex) {
		String message = ex.getMessage();
		if (message == null || message.isBlank()) {
			return ex.getClass().getSimpleName();
		}
		// Never echo credentials if the driver includes them in the message.
		return message.replaceAll("(?i)password[^\\s]*", "password=***");
	}
}
