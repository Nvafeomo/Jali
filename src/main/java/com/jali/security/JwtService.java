package com.jali.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.jali.config.JwtProperties;
import com.jali.entity.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	private final SecretKey signingKey;
	private final long expirationMs;

	public JwtService(JwtProperties jwtProperties) {
		byte[] keyBytes = jwtProperties.secret().getBytes(StandardCharsets.UTF_8);
		this.signingKey = Keys.hmacShaKeyFor(keyBytes);
		this.expirationMs = jwtProperties.expiration();
	}

	public String generateToken(Long userId, String email, Role role, Long familyTreeId) {
		Date now = new Date();
		Date expiry = new Date(now.getTime() + expirationMs);

		return Jwts.builder()
				.subject(email)
				.claim("userId", userId)
				.claim("email", email)
				.claim("role", role.name())
				.claim("familyTreeId", familyTreeId)
				.issuedAt(now)
				.expiration(expiry)
				.signWith(signingKey)
				.compact();
	}

	public UserPrincipal parseToken(String token) {
		try {
			Claims claims = Jwts.parser()
					.verifyWith(signingKey)
					.build()
					.parseSignedClaims(token)
					.getPayload();

			Long userId = claimAsLong(claims, "userId");
			String email = claims.get("email", String.class);
			String roleName = claims.get("role", String.class);
			Long familyTreeId = claimAsLong(claims, "familyTreeId");

			if (userId == null || email == null || roleName == null || familyTreeId == null) {
				throw new JwtException("Missing required JWT claims");
			}

			return new UserPrincipal(userId, email, Role.valueOf(roleName), familyTreeId);
		}
		catch (JwtException | IllegalArgumentException ex) {
			throw new JwtException("Invalid JWT", ex);
		}
	}

	private static Long claimAsLong(Claims claims, String name) {
		Object value = claims.get(name);
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			return number.longValue();
		}
		if (value instanceof String text) {
			return Long.parseLong(text);
		}
		throw new JwtException("Claim " + name + " must be numeric");
	}
}
