# AEGIS — Authorized Web Security Assessment Platform

**AEGIS** is an enterprise-grade, authorized web security assessment and vulnerability intelligence platform. It provides structured target management, security boundary policy enforcement, multi-tool assessment orchestration, attack surface modeling, normalized vulnerability intelligence, attack detection, evidence-driven investigation workspace, and digital forensics & evidence reconstruction.

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
   - [Phase 5: Digital Forensics & Evidence Reconstruction](#phase-5-digital-forensics--evidence-reconstruction)
6. [Technical Specifications](#technical-specifications)
   - [Phase 4 Detection & Investigation](#phase-4-detection--investigation)
   - [Phase 5 Digital Forensics & Evidence Reconstruction](#phase-5-digital-forensics--evidence-reconstruction)
7. [REST API Specification](#rest-api-specification)
8. [Database Schemas & Data Model](#database-schemas--data-model)
9. [Testing & Quality Assurance](#testing--quality-assurance)
10. [Getting Started & Local Development](#getting-started--local-development)

---

## Product Purpose & Security Boundaries

AEGIS is designed strictly for **authorized web security assessments**.

### Explicit Boundaries & Security Controls
- **Target Authorization Required**: Security assessments can only be executed against targets with verified authorization records.
- **SSRF & Network Boundary Enforcement**: `TargetNetworkPolicy` blocks internal subnets (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`) unless explicit Lab Mode is enabled.
- **No Weaponized Exploitation**: AEGIS does NOT perform exploit execution, payload injection, automated shell command execution, denial of service, or destructive testing.
- **Sensitive Data Redaction**: HTTP requests, cookies, Authorization headers, and session tokens in evidence are automatically scrubbed (`[REDACTED]`).
- **Source-IP Integrity**: Never invents or infers attacker IPs. If unobserved in telemetry, `source_ip` is `null`, `source_ip_confidence` is `UNKNOWN`, and UI displays `"Source IP unavailable from available telemetry."`
- **Forensic Integrity Rule**: Never invents forensic evidence, timestamps, HTTP headers, payloads, or attacker attribution. Unobserved attribution displays `"Attribution cannot be determined from available evidence."`
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
                                  │ Finding Normalization & Deduplication Engine (SHA-256)   │
                                  └────────────┬───────────────────────────────┬─────────────┘
                                               │                               │
                                               ▼                               ▼
                                  ┌─────────────────────────┐     ┌──────────────────────────┐
                                  │ Detection & Correlation │     │ Digital Forensics Engine │
                                  ├─────────────────────────┤     ├──────────────────────────┤
                                  │ • Rule Engine           │     │ • Forensic Cases         │
                                  │ • Observable Correlator │     │ • SHA-256 Evidence Hash  │
                                  │ • Incident Deduplication│     │ • Provenance Tracking    │
                                  └────────────┬────────────┘     │ • Attack Reconstruction  │
                                               │                  └────────────┬─────────────┘
                                               └───────────────┬───────────────┘
                                                               │
                                                               ▼
                                                  ┌──────────────────────────┐
                                                  │ Supabase PostgreSQL DB   │
                                                  │ (Flyway V1, V2..V5)      │
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
├── event/               # SecurityEvent, HttpEvent, NetworkEvent, Normalizer, Ingestion APIs
├── detection/           # DetectionRule, DetectionEngine, DetectionMatch, Rules
├── correlation/         # EventCorrelationService, Time-Windowed Observable Correlator
├── incident/            # SecurityIncident, Incident Lifecycle & Controller
├── investigation/       # Investigation Workspace, Hypotheses, Evidence, Notes, Timeline
├── attackchain/         # AttackChain Graph Topology (Nodes, Edges, Relationships)
├── forensics/           # Digital Forensics Cases, Evidence, SHA-256 Hashing, Provenance, Reconstruction
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
- **`V4__attack_detection_investigation.sql`**: Security events, HTTP telemetry events, network events, detection rules, detection matches, security incidents, investigations, hypotheses, evidence links, timeline events, attack chains, attack chain nodes, attack chain edges, and analyst notes.
- **`V5__digital_forensics.sql`**: Forensic cases, generic evidence model, evidence provenance tracking, HTTP/Network/Application forensic events, unified forensic timeline events, and forensic attack reconstruction events.

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
- **Attack Surface Asset Graph**: Discovers and correlates `DOMAIN`, `HOST`, `IP_ADDRESS`, `PORT`, `SERVICE`, `TECHNOLOGY`, `WEB_APPLICATION`, `ENDPOINT`, `PARAMETER`, and `TLS_ENDPOINT` assets with explicit graph relationships.
- **Deterministic Finding Deduplication**: Generates SHA-256 fingerprints from `assessmentId + assetValue + endpointUrl + findingType + title`.
- **Finding Status Workflow**: State machine (`OPEN` → `CONFIRMED` / `FALSE_POSITIVE` / `ACCEPTED_RISK` → `RESOLVED` → `REOPENED`).

### Phase 4: Attack Detection & Investigation
- **Telemetry Event Ingestion & Normalization**: Standardized ingestion APIs for HTTP and Network telemetry events with provenance.
- **Source-IP Integrity**: Never invents or infers attacker IPs. Unobserved IPs return `null` and display `"Source IP unavailable from available telemetry."`
- **Deterministic Rule Detection Engine**: Evaluates events against web security rules (SQL Injection, XSS, Path Traversal, Command Injection, Sensitive Endpoint Probing, Authentication Failures, Error Bursts).
- **Time-Windowed Event Correlation**: Grouping correlated detections into deduplicated `SecurityIncident` records.

### Phase 5: Digital Forensics & Evidence Reconstruction
- **Forensic Case Management**: Case lifecycle (`OPEN`, `INVESTIGATING`, `EVIDENCE_COMPLETE`, `CLOSED`, `INCONCLUSIVE`) with target and incident linkage.
- **Evidence Provenance & SHA-256 Integrity Verification**: Cryptographic SHA-256 content hashing with real-time verification endpoint (`POST /api/v1/forensics/evidence/{id}/verify`) and evidence transformation tracking.
- **Bounded Telemetry Events**: HTTP request/response, network connection, and application log forensic events with automatic credential redaction (`[REDACTED]`).
- **Unified Forensic Timeline**: Strict chronological ordering by `event_time` and sequence number, distinguishing collection timestamp from actual event timestamp.
- **Attack Event Reconstruction Topology**: Evidence-linked attack progression classified by evidence certainty (`OBSERVED`, `DERIVED`, `INFERRED`).

---

## Technical Specifications

### Phase 4 Detection & Investigation
- **Architecture Workflow**: `Event` → `Detection Rules` → `Event Correlation` → `Incident` → `Investigation` → `Timeline` → `Attack Chain` → `Evidence`.
- **Provenance Types**: `ASSESSMENT_TOOL`, `WEB_SERVER_LOG`, `REVERSE_PROXY`, `WAF`, `APPLICATION_LOG`, `NETWORK_SENSOR`, `MANUAL_IMPORT`, `LAB_SIMULATION`.

### Phase 5 Digital Forensics & Evidence Reconstruction
```
INCIDENT / SECURITY EVENT
        ↓
EVIDENCE COLLECTION
        ↓
EVIDENCE NORMALIZATION & SHA-256 HASHING
        ↓
PROVENANCE TRACKING
        ↓
FORENSIC TIMELINE (UTC & Collection vs Event Time)
        ↓
ATTACK EVENT RECONSTRUCTION (Observed / Derived / Inferred)
        ↓
DETERMINISTIC FORENSIC SUMMARY
```

#### Evidence Classification & Integrity
1. **`OBSERVED`**: Directly present in verified source telemetry.
2. **`DERIVED`**: Mathematically or deterministically calculated from observed evidence.
3. **`INFERRED`**: Logical analytical interpretation (clearly badged in UI to prevent misattribution).
4. **Integrity Status**: `VERIFIED`, `UNVERIFIED`, `MODIFIED`, `UNKNOWN`.

---

## REST API Specification

### Authentication & Target APIs
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`.
- `GET /api/v1/targets`, `POST /api/v1/targets`, `GET /api/v1/targets/{id}`.

### Assessment & Attack Surface APIs
- `GET /api/v1/assessments`, `POST /api/v1/assessments`, `GET /api/v1/assessments/{id}`.
- `GET /api/v1/assessments/{id}/attack-surface`, `GET /api/v1/findings`.

### Detection & Incident APIs
- `POST /api/v1/events/http`, `POST /api/v1/events/network`, `POST /api/v1/events/batch`, `GET /api/v1/events`.
- `GET /api/v1/detections`, `GET /api/v1/incidents`, `PATCH /api/v1/incidents/{id}/status`.

### Digital Forensics & Evidence Reconstruction API
- `POST /api/v1/forensics/cases` — Create new forensic case.
- `POST /api/v1/incidents/{incidentId}/forensic-case` — Initialize forensic case from incident.
- `GET /api/v1/forensics/cases` — Paginated list of forensic cases.
- `GET /api/v1/forensics/cases/{id}` — Forensic case details.
- `POST /api/v1/forensics/cases/{id}/close` — Close forensic case.
- `POST /api/v1/forensics/cases/{id}/evidence` — Add forensic evidence with SHA-256 computation.
- `GET /api/v1/forensics/cases/{id}/evidence` — Paginated evidence list.
- `POST /api/v1/forensics/evidence/{id}/verify` — Verify evidence SHA-256 hash integrity.
- `GET /api/v1/forensics/cases/{id}/timeline` — Chronological forensic timeline.
- `GET /api/v1/forensics/cases/{id}/http-events` — HTTP telemetry records.
- `GET /api/v1/forensics/cases/{id}/network-events` — Network connection records.
- `GET /api/v1/forensics/cases/{id}/attack-events` — Attack event nodes.
- `GET /api/v1/forensics/cases/{id}/attack-chain` — Attack reconstruction topology.
- `GET /api/v1/forensics/cases/{id}/summary` — Factual forensic summary.

---

## Database Schemas & Data Model

### Phase 1–4 Schemas (`V1`–`V4`)
- `users`, `security_targets`, `target_scopes`, `target_authorizations`, `security_assessments`, `audit_events`.
- `tool_executions`, `tool_outputs`, `attack_surface_assets`, `security_findings`, `finding_evidence`.
- `security_events`, `http_events`, `network_events`, `detection_rules`, `detection_matches`, `security_incidents`, `investigations`.

### Digital Forensics Schema (`V5`)
- `forensic_cases`: `id`, `uuid`, `incident_id`, `assessment_id`, `target_id`, `case_number`, `title`, `status`, `priority`, `created_by`, `opened_at`, `closed_at`, timestamps.
- `forensic_evidence`: `id`, `uuid`, `case_id`, `evidence_type`, `source_type`, `source_reference`, `event_time`, `collection_time`, `content_hash`, `integrity_status`, `confidence`, `classification`, `provenance`, `description`, `metadata`, timestamps.
- `evidence_provenance`: `id`, `evidence_id`, `source`, `collector`, `collected_at`, `original_reference`, `sha256`, `transformation`, timestamps.
- `http_forensic_events`: `id`, `case_id`, `evidence_id`, `event_time`, `source_ip`, `destination_ip`, `method`, `scheme`, `host`, `port`, `path`, `query_string`, `status_code`, `request_headers`, `response_headers`, `user_agent`, `tls_version`, timestamps.
- `network_forensic_events`: `id`, `case_id`, `evidence_id`, `event_time`, `source_ip`, `source_port`, `destination_ip`, `destination_port`, `protocol`, `direction`, `connection_state`, `bytes_in`, `bytes_out`, timestamps.
- `application_forensic_events`: `id`, `case_id`, `evidence_id`, `event_time`, `application`, `severity`, `event_type`, `message`, `request_id`, `session_id`, `source_ip`, `endpoint`, timestamps.
- `forensic_timeline_events`: `id`, `case_id`, `event_time`, `time_description`, `event_type`, `source`, `severity`, `title`, `description`, `evidence_id`, `confidence`, `sequence_number`, timestamps.
- `forensic_attack_events`: `id`, `case_id`, `timeline_event_id`, `event_type`, `stage`, `event_time`, `source_ip`, `target_endpoint`, `http_method`, `status_code`, `evidence_id`, `confidence`, `classification`, `description`, timestamps.

---

## Testing & Quality Assurance

AEGIS includes comprehensive automated backend integration tests and frontend static type verification.

### Backend Test Execution
```bash
# Run backend test suite with JDK 21
mvn test
```
**Test Results**: 38/38 tests passed cleanly (0 errors, 0 failures).

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
