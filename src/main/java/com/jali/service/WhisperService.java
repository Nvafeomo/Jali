package com.jali.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;

@Service
public class WhisperService {

    private static final String WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";

    private final String apiKey;
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    public WhisperService(
            @Value("${openai.api.key}") String apiKey,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.httpClient = new OkHttpClient();
        this.objectMapper = objectMapper;
    }

    public String transcribe(File audioFile) throws IOException {
        RequestBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("model", "whisper-1")
                .addFormDataPart("language", "en")
                .addFormDataPart("file",
                        audioFile.getName(),
                        RequestBody.create(audioFile, MediaType.parse("audio/mpeg")))
                .build();

        Request request = new Request.Builder()
                .url(WHISPER_URL)
                .header("Authorization", "Bearer " + apiKey)
                .post(requestBody)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Whisper API error: " + response.code()
                        + " " + response.body().string());
            }
            JsonNode json = objectMapper.readTree(response.body().string());
            return json.get("text").asText();
        }
    }
}
