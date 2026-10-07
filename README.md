# AEGIS — Authorized Web Security Assessment Platform

**AEGIS** is an enterprise-grade, authorized web security assessment and vulnerability intelligence platform. It provides structured target management, security boundary policy enforcement, multi-tool assessment orchestration, attack surface modeling, and normalized vulnerability intelligence.

---

## Table of Contents
1. [Product Purpose & Security Boundaries](#product-purpose--security-boundaries)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Database & Schema Migrations](#database--schema-migrations)
5. [Core Modules](#core-modules)
   - [Phase 1: Target Management & Security Control](#phase-1-target-management--security-control)
   - [Phase 2: Security Assessment Engine](#phase-2-security-assessment-engine)
   - [Phase 3: Attack Surface & Vulnerability Intelligence](#phase-3-attack-surface--vulnerability-intelligence)
   - [Phase 4: Attack Detection & Investigation](#phase-4-attack-detection--investigation)
6. [REST API Specification](#rest-api-specification)
7. [Database Schemas & Data Model](#database-schemas--data-model)
8. [Testing & Quality Assurance](#testing--quality-assurance)
9. [Getting Started & Local Development](#getting-started--local-development)

---

## Product Purpose & Security Boundaries

AEGIS is designed strictly for **authorized web security assessments**.

### Explicit Boundaries & Security Controls
- **Target Authorization Required**: Security assessments can only be executed against targets with verified authorization records.
- **SSRF & Network Boundary Enforcement**: `TargetNetworkPolicy` blocks internal subnets (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`) unless explicit Lab Mode is enabled.
- **No Weaponized Exploitation**: AEGIS does NOT perform exploit execution, payload injection, automated shell command execution, denial of service, or destructive testing.
- **Sensitive Data Redaction**: HTTP requests, cookies, Authorization headers, and session tokens in evidence are automatically scrubbed (`[REDACTED]`).
- **Zero Hallucination Policy**: Vulnerability intelligence (CVE, CWE, CVSS, OWASP) is recorded only when evidence exists; missing data is represented as `null`/`unavailable` without fake scoring.

---

## Architecture Overview

```
                          ┌─────────────────────────────────────────┐
                          │    AEGIS Enterprise Security Console    │
                          │        (React 19 + TypeScript)          │
                          └────────────────────┬────────────────────┘
                                               │
                                               ▼
                          ┌─────────────────────────────────────────┐
                          │           AEGIS REST API Gateway        │
                          │       (Spring Boot 3.3.4 + Java 21)     │
                          └────────────────────┬────────────────────┘
                                               │
             ┌─────────────────────────────────┼─────────────────────────────────┐
             ▼                                 ▼                                 ▼
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│ Target & Scope Engine   │       │ Multi-Tool Orchestrator │       │ Attack Surface Engine   │
├─────────────────────────┤       ├─────────────────────────┤       ├─────────────────────────┤
│ • Security Targets      │       │ • Nmap (Port/Service)   │       │ • Asset Graph           │
│ • Scope Rules           │       │ • WhatWeb (Tech Finger) │       │ • Endpoint Inventory    │
│ • Written Authorization │       │ • Nikto (Web Server)    │       │ • Technology Correlation│
│ • Immutable Audit Logs  │       │ • Nuclei (Vulnerabilities)│      │ • Relationship Mapping  │
└─────────────────────────┘       │ • OWASP ZAP (Web Scan)  │       └─────────────────────────┘
                                  │ • HttpSecurity          │                    │
                                  └────────────┬────────────┘                    │
                                               │                                 │
                                               ▼                                 ▼
                                  ┌──────────────────────────────────────────────────────────┐
                                  │  Finding Normalization & Deduplication Engine (SHA-256) │
                                  └────────────────────────────┬─────────────────────────────┘
                                                               │
                                                               ▼
                                                  ┌──────────────────────────┐
                                                  │ Supabase PostgreSQL DB   │
                                                  │ (Flyway V1, V2, V3)      │
                                                  └──────────────────────────┘
```

### Backend Package Structure
```
backend/src/main/java/com/aegis/
├── config/              # Security, CORS, Swagger, OpenAPI setup
├── security/            # JWT filters, UserPrincipal, TargetNetworkPolicy
├── auth/                # Register, Login, Token Refresh, Logout
├── user/                # User Entity, UserRole (ADMIN, ANALYST, VIEWER)
├── target/              # Target, Scope, Authorization entities & URL Validator
├── assessment/          # Profiles, Assessment Orchestration, Tool Output entities
├── attack_surface/      # Assets, Relationships, Technologies, WebApps, Endpoints
├── finding/             # SecurityFindings, Evidence, References, Correlations, Comments
├── vulnerability/       # VulnerabilityIntelligenceProvider, CVE/CWE/OWASP catalog models
├── audit/               # Immutable Audit Logging engine
├── health/              # System, DB & Flyway migration health check
└── exception/           # Centralized Global Exception Handler
```

---

## Technology Stack

- **Backend**: Java 21, Spring Boot 3.3.4, Spring Security 6.3, Spring Data JPA, Hibernate, Flyway 10.x, JJWT 0.12.6, OpenAPI / Swagger 3.
- **Frontend**: React 19, TypeScript 5.x, Vite, Lucide Icons, Enterprise Dark Theme CSS.
- **Database**: PostgreSQL 16+ (Fully compatible with Supabase PostgreSQL).
- **Containerization**: Docker, Docker Compose.

---

## Database & Schema Migrations

AEGIS uses **Flyway** for deterministic database migrations. Schema changes are strictly validated (`spring.jpa.hibernate.ddl-auto=validate`).

- **`V1__initial_schema.sql`**: Core user accounts, roles, target management, target scope, written authorization, assessment profiles, assessment records, and audit log table.
- **`V2__web_security_assessment_engine.sql`**: Tool execution records, stage execution status, raw tool output persistence, and target network policy logs.
- **`V3__attack_surface_and_vulnerability_intelligence.sql`**: Attack surface assets, relationship graph, technologies, web apps, endpoints, parameters, normalized security findings, evidence, references, correlations, analyst comments, and CVE/CWE/OWASP catalog tables.

### Supabase Connection Configuration (`application.yml`)
```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://db.ilsauwdyeizvbbirckwp.supabase.co:5432/postgres}
    username: ${SPRING_DATASOURCE_USERNAME:postgres}
    password: ${SPRING_DATASOURCE_PASSWORD:Dk#5822..com}
    driver-class-name: org.postgresql.Driver
```

---

## Core Modules

### Phase 1: Target Management & Security Control
- **RBAC Authentication**: JWT access & refresh tokens with `ADMIN`, `ANALYST`, and `VIEWER` roles.
- **Security Target Boundary**: Target URL validation, domain scope constraints (`DOMAIN`, `URL`, `IP`, `PATH`), and verified authorization records.
- **Immutable Audit Log**: Records security actions (register, login, target create/update, assessment trigger) with actor user ID, IP address, and details.

### Phase 2: Security Assessment Engine
- **Tool Adapter Architecture**: Dedicated adapters for **Nmap**, **WhatWeb**, **Nikto**, **Nuclei**, **OWASP ZAP**, and **HttpSecurity**.
- **Fixed Executable Paths & Allowlisted Arguments**: Eliminates shell execution vulnerabilities; processes run via `ProcessBuilder`.
- **Asynchronous Execution & Stage Lifecycle**: Assessment stages transition from `QUEUED` → `RUNNING` (0% to 100% progress) → `COMPLETED`.

### Phase 3: Attack Surface & Vulnerability Intelligence
- **Attack Surface Asset Graph**: Discovers and correlates `DOMAIN`, `HOST`, `IP_ADDRESS`, `PORT`, `SERVICE`, `TECHNOLOGY`, `WEB_APPLICATION`, `ENDPOINT`, `PARAMETER`, and `TLS_ENDPOINT` assets with explicit graph relationships (`RESOLVES_TO`, `HOSTS`, `EXPOSES`, `RUNS`, `USES`, `SERVES`, `CONTAINS`).
- **Deterministic Finding Deduplication**: Generates SHA-256 fingerprints from `assessmentId + assetValue + endpointUrl + findingType + title`.
- **Multi-Tool Finding Correlation**: Aggregates findings discovered across multiple tools into single deduplicated findings.
- **Finding Status Workflow**: State machine (`OPEN` → `CONFIRMED` / `FALSE_POSITIVE` / `ACCEPTED_RISK` → `RESOLVED` → `REOPENED`) with enforced audit comments.

### Phase 4: Attack Detection & Investigation
- **Telemetry Event Ingestion & Normalization**: Standardized ingestion APIs for HTTP and Network telemetry events with provenance (`ASSESSMENT_TOOL`, `WEB_SERVER_LOG`, `WAF`, `APPLICATION_LOG`, `LAB_SIMULATION`).
- **Source-IP Integrity**: Never invents or infers attacker IPs. If unobserved in telemetry, `source_ip` is `null`, `source_ip_confidence` is `UNKNOWN`, and UI displays `"Source IP unavailable from available telemetry."`
- **Deterministic Rule Detection Engine**: Evaluates events against web security rules (SQL Injection, XSS, Path Traversal, Command Injection, Sensitive Endpoint Probing, Authentication Failures, Error Bursts).
- **Time-Windowed Event Correlation**: Grouping correlated detections into deduplicated `SecurityIncident` records.
- **Investigation Workspace**: Manages analyst hypotheses (Supported/Contradicted), attached evidence, timeline sequence, analyst notes, and evidence-driven attack chain graph.

---

## REST API Specification

### Authentication API
- `POST /api/v1/auth/register` — Register new user account.
- `POST /api/v1/auth/login` — Authenticate and return JWT tokens.
- `POST /api/v1/auth/refresh` — Refresh access token using refresh token.
- `POST /api/v1/auth/logout` — Revoke refresh token.

### Target Management API
- `GET /api/v1/targets` — Paginated list of security targets.
- `POST /api/v1/targets` — Register new target with scope and authorization details.
- `GET /api/v1/targets/{id}` — Get target details.

### Security Assessment API
- `GET /api/v1/assessments` — List assessments.
- `POST /api/v1/assessments` — Create and queue new security assessment.
- `GET /api/v1/assessments/{id}` — Get assessment execution status and tool outputs.

### Attack Surface API
- `GET /api/v1/assessments/{id}/attack-surface` — Complete attack surface model.
- `GET /api/v1/assessments/{id}/attack-surface/assets` — Paginated assets by type.
- `GET /api/v1/assessments/{id}/attack-surface/relationships` — Relationship graph.
- `GET /api/v1/assessments/{id}/attack-surface/summary` — Attack surface metric counts.

### Vulnerability Findings API
- `GET /api/v1/findings` — Paginated findings with backend filtering (`severity`, `status`, `confidence`, `source`, `search`).
- `GET /api/v1/findings/{id}` — Finding detail with redacted evidence, references, correlations, and comments.
- `POST /api/v1/findings/{id}/status` — Update finding status.
- `POST /api/v1/findings/{id}/comments` — Add analyst audit comment.

---

## Database Schemas & Data Model

### Core Schema (`V1`)
- `users`: `id`, `email`, `password_hash`, `display_name`, `role`, `enabled`, timestamps.
- `security_targets`: `id`, `name`, `primary_url`, `target_type`, `status`, timestamps.
- `target_scopes`: `id`, `target_id`, `scope_type`, `scope_value`, `is_allowed`.
- `target_authorizations`: `id`, `target_id`, `authorized_by_name`, `authorization_date`, `expiration_date`.
- `security_assessments`: `id`, `target_id`, `profile_id`, `status`, `current_stage`, `progress_percent`, timestamps.
- `audit_events`: `id`, `event_type`, `action`, `actor_user_id`, `actor_email`, `resource_type`, `details`, timestamps.

### Assessment Schema (`V2`)
- `tool_executions`: `id`, `assessment_id`, `tool_name`, `status`, `exit_code`, `started_at`, `completed_at`.
- `tool_outputs`: `id`, `tool_execution_id`, `output_type`, `raw_output`.

### Attack Surface & Findings Schema (`V3`)
- `attack_surface_assets`: `id`, `assessment_id`, `asset_type`, `asset_value`, `normalized_value`, `status`, `confidence`, `source`.
- `attack_surface_relationships`: `id`, `assessment_id`, `source_asset_id`, `relationship_type`, `target_asset_id`.
- `security_findings`: `id`, `assessment_id`, `asset_id`, `endpoint_id`, `title`, `finding_type`, `severity`, `confidence`, `status`, `deduplication_hash`.
- `finding_evidence`: `id`, `finding_id`, `evidence_type`, `source`, `content`, `redacted_content`, `location`.
- `finding_references`: `id`, `finding_id`, `reference_type`, `reference_id`, `url`, `title`, `source`.
- `finding_correlations`: `id`, `finding_id`, `related_finding_id`, `correlation_type`, `confidence`, `reason`.
- `finding_comments`: `id`, `finding_id`, `author_id`, `author_email`, `comment`, timestamps.

---

## Testing & Quality Assurance

AEGIS includes comprehensive automated backend integration tests and frontend static type verification.

### Backend Test Execution
```bash
# Run backend test suite with JDK 21
mvn test
```
**Test Results**: 29/29 tests passed cleanly (0 errors, 0 failures).

### Frontend Type Check
```bash
cd frontend
npx tsc --noEmit
```
**Type Check Results**: 0 TypeScript compilation errors.

---

## Getting Started & Local Development

### Prerequisites
- JDK 21 (e.g. Java 21 LTS)
- Maven 3.9+
- Node.js 18+ and npm
- PostgreSQL 16+ or Supabase account

### 1. Backend Setup
```bash
cd backend
mvn clean package -DskipTests
java -jar target/aegis-backend-1.0.0-SNAPSHOT.jar
```
The backend API will start on `http://localhost:8080`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The AEGIS Security Console will open at `http://localhost:5173`.
