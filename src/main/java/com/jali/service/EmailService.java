package com.jali.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Sends transactional emails via the Resend REST API (https://resend.com).
 *
 * Required env vars:
 *   RESEND_API_KEY  — your Resend API key (starts with "re_")
 *   JALI_EMAIL_FROM — verified sender, e.g. "Jali <noreply@jali.app>"
 *                     Defaults to onboarding@resend.dev for local testing
 *                     (Resend only allows this address to send to the account owner's email)
 *   JALI_APP_BASE_URL — frontend origin, e.g. https://jali.app
 */
@Service
public class EmailService {

	private static final Logger log = LoggerFactory.getLogger(EmailService.class);
	private static final String RESEND_URL = "https://api.resend.com/emails";
	private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

	private final OkHttpClient http = new OkHttpClient();
	private final ObjectMapper mapper;

	@Value("${resend.api.key:}")
	private String apiKey;

	@Value("${jali.email.from:onboarding@resend.dev}")
	private String from;

	@Value("${jali.app.base-url:http://localhost:5173}")
	private String appBaseUrl;

	public EmailService(ObjectMapper mapper) {
		this.mapper = mapper;
	}

	// ── Public send methods ───────────────────────────────────────────────────

	public void sendVerificationEmail(String toEmail, String token) {
		String link = appBaseUrl + "/verify-email?token=" + token;
		String html = verificationHtml(link);
		send(toEmail, "Verify your Jali email", html);
	}

	public void sendPasswordResetEmail(String toEmail, String token) {
		String link = appBaseUrl + "/reset-password?token=" + token;
		String html = resetHtml(link);
		send(toEmail, "Reset your Jali password", html);
	}

	// ── Internal ─────────────────────────────────────────────────────────────

	private void send(String to, String subject, String html) {
		if (apiKey == null || apiKey.isBlank()) {
			log.warn("RESEND_API_KEY not set — skipping email to {} (subject: {})", to, subject);
			log.info("Email link would have been in the HTML body (check logs in dev)");
			log.debug("Email HTML: {}", html);
			return;
		}

		try {
			String body = mapper.writeValueAsString(Map.of(
					"from", from,
					"to", List.of(to),
					"subject", subject,
					"html", html
			));

			Request request = new Request.Builder()
					.url(RESEND_URL)
					.header("Authorization", "Bearer " + apiKey)
					.post(RequestBody.create(body, JSON))
					.build();

			try (Response response = http.newCall(request).execute()) {
				if (!response.isSuccessful()) {
					String responseBody = response.body() != null ? response.body().string() : "(empty)";
					log.error("Resend API error {} for email to {}: {}", response.code(), to, responseBody);
				} else {
					log.info("Email sent to {} (subject: {})", to, subject);
				}
			}
		} catch (IOException e) {
			// Log but don't throw — email failure shouldn't crash the request
			log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
		}
	}

	// ── Email templates ───────────────────────────────────────────────────────

	private String verificationHtml(String link) {
		return emailWrapper(
				"Verify your email",
				"You're almost in. Click the button below to verify your email address and start preserving your family's history.",
				link,
				"Verify email address",
				"This link expires in 24 hours. If you didn't create a Jali account, you can safely ignore this email."
		);
	}

	private String resetHtml(String link) {
		return emailWrapper(
				"Reset your password",
				"We received a request to reset your Jali password. Click the button below to choose a new one.",
				link,
				"Reset password",
				"This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password has not been changed."
		);
	}

	private String emailWrapper(String heading, String body, String ctaLink, String ctaLabel, String footnote) {
		return """
				<!DOCTYPE html>
				<html lang="en">
				<head>
				  <meta charset="UTF-8" />
				  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
				  <title>%s — Jali</title>
				</head>
				<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,'Segoe UI',Roboto,sans-serif;">
				  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px;">
				    <tr><td align="center">
				      <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1e1e2e;border:1px solid rgba(167,139,250,0.18);border-radius:16px;overflow:hidden;">
				        <!-- Top accent bar -->
				        <tr><td style="height:3px;background:linear-gradient(90deg,transparent,#a78bfa 30%%,#8b5cf6 50%%,#a78bfa 70%%,transparent);"></td></tr>
				        <!-- Header -->
				        <tr><td style="padding:32px 40px 0;text-align:center;">
				          <div style="font-size:28px;font-weight:800;letter-spacing:0.08em;color:#a78bfa;">JALI</div>
				          <div style="font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#64748b;margin-top:4px;">Digital griot</div>
				        </td></tr>
				        <!-- Body -->
				        <tr><td style="padding:28px 40px;">
				          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f1f5f9;letter-spacing:-0.02em;">%s</h1>
				          <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#94a3b8;">%s</p>
				          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
				            <tr><td style="border-radius:8px;background:linear-gradient(180deg,#a78bfa 0%%,#9370db 100%%);">
				              <a href="%s" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#0f172a;text-decoration:none;border-radius:8px;">%s</a>
				            </td></tr>
				          </table>
				          <p style="margin:0;font-size:13px;color:#64748b;">Or copy this link into your browser:<br/>
				            <a href="%s" style="color:#a78bfa;word-break:break-all;font-size:12px;">%s</a>
				          </p>
				        </td></tr>
				        <!-- Footer -->
				        <tr><td style="padding:20px 40px 28px;border-top:1px solid #334155;">
				          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">%s</p>
				        </td></tr>
				      </table>
				    </td></tr>
				  </table>
				</body>
				</html>
				""".formatted(heading, heading, body, ctaLink, ctaLabel, ctaLink, ctaLink, footnote);
	}
}
