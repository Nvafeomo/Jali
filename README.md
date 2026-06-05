# Jali

**Jali** is a family heritage platform for preserving lineage across generations. It's built for oral history, probabilistic confidence on relationships, and diaspora family trees.

> *Jali* (Mandinka): the griot — keeper of oral history, memory, and family lineage.

This repository is **proprietary**. See [LICENSE](LICENSE). No copying, redistribution, or commercial use without written permission.

---

## Architecture

Jali uses a **dual-database** backend: PostgreSQL for identity and tenancy, Neo4j for the family graph.

```mermaid
flowchart TB
    subgraph clients [Clients]
        REST[REST API]
        GQL[GraphQL / GraphiQL]
    end

    subgraph app [Spring Boot 4 — com.jali]
        SEC[JWT Security Filter]
        AUTH[AuthController / AuthService]
        PC[PersonController]
        RC[RelationshipController]
        GQC[PersonGraphQLController]
        CONF[ConfidenceScoreService]
        PGS[PersonGraphService]
    end

    subgraph data [Data layer]
        JPA[(PostgreSQL — users, family_trees)]
        NEO[(Neo4j Aura — Person graph)]
    end

    REST --> SEC
    GQL --> SEC
    SEC --> AUTH
    SEC --> PC
    SEC --> RC
    SEC --> GQC
    AUTH --> JPA
    PC --> PGS
    RC --> PGS
    RC --> CONF
    GQC --> PGS
    GQC --> CONF
    PGS --> NEO
    CONF --> NEO
```

### Package layout

```
com.jali/
├── JaliApplication.java          # Entry; JPA + Neo4j repo scanning
├── config/                       # Security, JWT, Neo4j/JPA transaction managers, seeder
├── controller/                   # REST + GraphQL controllers
├── service/                      # Auth, graph ops, confidence scoring
├── repository/
│   ├── jpa/                      # UserRepository, FamilyTreeRepository
│   └── neo4j/                    # PersonRepository (Cypher queries)
├── entity/                       # JPA: User, FamilyTree, Role
├── neo4j/                        # SDN nodes: Person, PARENT_OF, MARRIED_TO, SIBLING_OF
├── dto/                          # REST request/response records
└── security/                     # JWT filter, JwtService, UserPrincipal
```

### Design decisions

| Concern | Approach |
|--------|----------|
| **Tenancy** | Each user owns a `familyTreeId` (Postgres). All graph nodes carry `familyTreeId`; queries are scoped by JWT. |
| **Graph model** | `Person` nodes with relationship edges (`PARENT_OF`, `MARRIED_TO`, `SIBLING_OF`). Edge properties hold `confidenceScore`, `evidenceList`, `disputed`. |
| **Confidence** | `EvidenceType` weights + `ConfidenceScoreService`; evidence stored as JSON on edges. |
| **Transactions** | Explicit `transactionManager` (JPA) and `neo4jTransactionManager` — required when both stacks are active. |
| **APIs** | REST for CRUD + evidence; GraphQL for flexible tree reads (including edge confidence in `PersonEdge`). |

### Tech stack

- Java 21, Spring Boot 4.0.6
- PostgreSQL 16 (Docker) — auth & family trees
- Neo4j Aura — graph storage
- Spring Data JPA + Spring Data Neo4j
- Spring Security + JWT (jjwt)
- Spring GraphQL + GraphiQL

---

## Prerequisites

- Java 21
- Docker (for local Postgres)
- Neo4j Aura instance ([neo4j.com/cloud](https://neo4j.com/cloud/aura/))

---

## Local setup

### 1. Postgres

```bash
docker compose up -d
```

Postgres listens on **host port 5433** (avoids conflict with a local install on 5432).

### 2. Neo4j credentials

```bash
cp src/main/resources/application-local.properties.example \
   src/main/resources/application-local.properties
```

Edit `application-local.properties` with your Aura URI, username, and password. This file is gitignored.

### 3. Run

```bash
./mvnw spring-boot:run
```

Health check: `GET http://localhost:8080/health`

---

## API overview

### Auth (public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account + family tree |
| POST | `/auth/login` | Obtain JWT |

All other endpoints require: `Authorization: Bearer <token>`

### REST (JWT)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/people` | Create person |
| GET | `/people` | List people in your tree |
| GET | `/people/{uuid}` | Get person |
| GET | `/people/{uuid}/ancestors` | Ancestors (depth param) |
| GET | `/people/{uuid}/descendants` | Descendants (depth param) |
| POST | `/relationships` | Link two people |
| POST | `/relationships/evidence` | Add evidence to an edge |

### GraphQL

- Endpoint: `POST /graphql`
- Playground: `http://localhost:8080/graphiql`
- Schema: `src/main/resources/graphql/schema.graphqls`

In GraphiQL, add headers:

```json
{
  "Authorization": "Bearer YOUR_JWT_HERE"
}
```

Example query:

```graphql
query {
  person(uuid: "YOUR_PERSON_UUID") {
    fullName
    children {
      person { fullName }
      confidenceScore
      disputed
    }
  }
}
```

---

## Configuration

| File | Purpose |
|------|---------|
| `application.properties` | Defaults (Postgres URL, JWT, GraphiQL) |
| `application-local.properties` | Neo4j secrets (not committed) |
| `docker-compose.yml` | Local Postgres |

---

## Author

**Nvafeomo K. Konneh**

- **Email:** [nvafeomo05@gmail.com](mailto:nvafeomo05@gmail.com)
- **Phone:** 267-461-8268
- **LinkedIn:** [Nvafeomo Konneh](https://www.linkedin.com/in/nvafeomo-konneh-a6a1a9367)

---

## License

**Proprietary — All Rights Reserved.**

Unauthorized copying, modification, distribution, or commercial use is prohibited. See [LICENSE](LICENSE) for full terms.

Third-party dependencies (Spring Boot, Neo4j driver, etc.) remain under their respective open-source licenses.
