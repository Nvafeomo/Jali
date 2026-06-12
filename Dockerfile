# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: run ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/jali-0.0.1-SNAPSHOT.jar app.jar

# Render injects PORT at runtime — application.properties reads ${PORT:8080}
ENV JAVA_OPTS="-XX:+TieredCompilation -XX:TieredStopAtLevel=1 -Dspring.jmx.enabled=false"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
