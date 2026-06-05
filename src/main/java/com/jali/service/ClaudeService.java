package com.jali.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class ClaudeService {

    private static final String CLAUDE_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL = "claude-haiku-4-5-20251001";

    private final String apiKey;
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    public ClaudeService(
            @Value("${anthropic.api.key}") String apiKey,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.httpClient = new OkHttpClient();
        this.objectMapper = objectMapper;
    }

    public JsonNode extractEntities(
            String transcript,
            String anchorPersonName,
            List<String> existingPeopleInTree) throws IOException {

        String prompt = buildPrompt(transcript, anchorPersonName, existingPeopleInTree);

        String requestJson = objectMapper.writeValueAsString(Map.of(
                "model", MODEL,
                "max_tokens", 1024,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", prompt
                ))
        ));

        Request request = new Request.Builder()
                .url(CLAUDE_URL)
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .post(RequestBody.create(requestJson, MediaType.parse("application/json")))
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Claude API error: " + response.code()
                        + " " + response.body().string());
            }
            JsonNode json = objectMapper.readTree(response.body().string());
            String content = json.get("content").get(0).get("text").asText();
            // extract JSON block from Claude's response
            int start = content.indexOf('{');
            int end = content.lastIndexOf('}') + 1;
            if (start == -1 || end == 0) {
                throw new IOException("Claude did not return valid JSON");
            }
            return objectMapper.readTree(content.substring(start, end));
        }
    }

    private String buildPrompt(
            String transcript,
            String anchorPersonName,
            List<String> existingPeople) {

        return """
                You are analyzing an oral history transcript for a family tree application.
                
                %s
                
                Known people already in the family tree: %s
                
                Transcript:
                "%s"
                
                Extract and return ONLY a JSON object in this exact format:
                {
                  "people_mentioned": ["name1", "name2"],
                  "places_mentioned": ["place1", "place2"],
                  "relationships": [
                    {"from": "person name", "to": "person name", "type": "PARENT_OF or MARRIED_TO or SIBLING_OF"}
                  ],
                  "corroborations": ["description of what was confirmed"],
                  "contradictions": ["description of what conflicts with existing info"]
                }
                
                Rules:
                - Resolve pronouns using the anchor context if provided
                - Only include relationships you are confident about
                - Match names to existing tree members where possible
                - Return only the JSON, no explanation
                """.formatted(
                anchorPersonName != null
                        ? "This recording is anchored to: " + anchorPersonName
                        + ". Resolve 'her', 'his', 'their' relative to this person."
                        : "No anchor person provided.",
                existingPeople.isEmpty() ? "none yet" : String.join(", ", existingPeople),
                transcript
        );
    }
}
