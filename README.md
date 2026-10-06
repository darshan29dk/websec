# AEGIS — Authorized Web Security Assessment Platform

**AEGIS** is an enterprise-grade authorized web security assessment and investigation platform built using Spring Boot, React, and PostgreSQL.

> [!IMPORTANT]
> **Phase 1 Implementation Complete**: Phase 1 provides the foundational architecture, authentication, role-based authorization, authorized target management, target scope definitions, assessment profile management, assessment lifecycle foundation (`QUEUED` state), audit logging, OpenAPI specifications, unit & integration test suites, and enterprise dark mode UI console.
>
> **Security Note**: In Phase 1, creating an assessment records the assessment lifecycle state in `QUEUED` mode. **No active security scanning, Nmap, Nuclei, Nikto, or attack tools are executed in Phase 1.**

---

## 🏛️ System Architecture

- **Backend**: Java 21, Spring Boot 3.3.4, Maven, Spring Security, JWT, Spring Data JPA, Jakarta Validation, OpenAPI 3.0 (Swagger UI).
- **Frontend**: React 19, TypeScript, Vite, Enterprise Security UI (Dark mode).
- **Database**: PostgreSQL (Supabase compatible), Flyway V1 SQL migrations (`spring.jpa.hibernate.ddl-auto=validate`).
- **Containerization**: Docker Compose (`postgres`, `backend`, `frontend`).

---

## 🚀 Getting Started

### Prerequisites

- **Java**: OpenJDK 21
- **Node.js**: v20+ / v22+
- **Maven**: 3.9+ (or system Maven wrapper)
- **Database**: PostgreSQL 16+ / Supabase PostgreSQL / Docker

---

### Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/aegis_db` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `postgres` |
| `JWT_SECRET` | 256-bit HMAC secret | Base64 / Hex 256-bit string |
| `JWT_ACCESS_EXPIRATION` | Access token TTL (ms) | `3600000` (1 hour) |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL (ms) | `604800000` (7 days) |
| `CORS_ALLOWED_ORIGINS` | Configurable CORS origins | `http://localhost:5173,http://localhost:3000` |

---

## 💻 Local Development Setup

### 1. Database Setup
Ensure PostgreSQL is running locally or via Docker Compose:
```bash
docker compose -f docker/docker-compose.yml up -d postgres
```

### 2. Backend Startup
From the `backend/` directory:
```bash
# Compile & run automated test suite
mvn clean test

# Run Spring Boot application
mvn spring-boot:run
```
- API Base URL: `http://localhost:8080/api/v1`
- Swagger UI Documentation: `http://localhost:8080/swagger-ui.html`
- Health Endpoint: `http://localhost:8080/api/v1/health`

### 3. Frontend Startup
From the `frontend/` directory:
```bash
npm install
npm run dev
```
- Frontend UI console: `http://localhost:5173`

---

## 📖 Phase 1 Documentation

Detailed architectural and operational documentation is available in the `docs/` folder:
- [PHASE_1_ARCHITECTURE.md](docs/PHASE_1_ARCHITECTURE.md)
- [PHASE_1_API.md](docs/PHASE_1_API.md)
- [PHASE_1_DATABASE.md](docs/PHASE_1_DATABASE.md)
- [PHASE_1_SECURITY.md](docs/PHASE_1_SECURITY.md)
- [PHASE_1_TESTING.md](docs/PHASE_1_TESTING.md)
