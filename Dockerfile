# ── Stage 1: build ───────────────────────────────────────────────────────────
# Uses the official Maven image with Java 21 to compile the project.
# We copy pom.xml first and download dependencies before copying source —
# this means Docker can cache the dependency layer and skip the slow download
# step on future builds when only source files change.
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: run ─────────────────────────────────────────────────────────────
# Uses a minimal JRE image — no compiler, no Maven, much smaller final image.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/jali-0.0.1-SNAPSHOT.jar app.jar

# Render sets PORT dynamically; application.properties reads it via ${PORT:8080}
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
