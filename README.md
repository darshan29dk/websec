# AEGIS — Authorized Web Security Assessment Platform

**AEGIS** is an enterprise-grade, authorized web security assessment and vulnerability intelligence platform. It provides structured target management, security boundary policy enforcement, multi-tool assessment orchestration, attack surface modeling, normalized vulnerability intelligence, attack detection, and evidence-driven investigation workspace.

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
6. [Phase 4 Technical Specification](#phase-4-technical-specification)
   - [Phase 4 Architecture Workflow](#phase-4-architecture-workflow)
   - [Event Model & Telemetry Provenance](#event-model--telemetry-provenance)
   - [Detection Engine & Initial Rules](#detection-engine--initial-rules)
   - [Investigation Workspace & Hypotheses](#investigation-workspace--hypotheses)
   - [Attack Chain Reconstruction Topology](#attack-chain-reconstruction-topology)
   - [Security Boundaries & Source IP Integrity](#security-boundaries--source-ip-integrity)
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
                                  │ Detection & Correlation │     │ Investigation Workspace  │
                                  ├─────────────────────────┤     ├──────────────────────────┤
                                  │ • Rule Engine           │     │ • Hypotheses & Evidence  │
                                  │ • Observable Correlator │     │ • Chronological Timeline │
                                  │ • Incident Deduplication│     │ • Attack Chain Graph     │
                                  └────────────┬────────────┘     └────────────┬─────────────┘
                                               │                               │
                                               └───────────────┬───────────────┘
                                                               │
                                                               ▼
                                                  ┌──────────────────────────┐
                                                  │ Supabase PostgreSQL DB   │
                                                  │ (Flyway V1, V2, V3, V4)  │
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

## Phase 4 Technical Specification

### Phase 4 Architecture Workflow
```
Event (Ingestion / Normalization)
 ↓
Detection Rules (Signature / Pattern Matching)
 ↓
Event Correlation (Time-windowed & Observable grouping)
 ↓
Incident Creation (Deduplicated Incident Lifecycle)
 ↓
Investigation Workspace (Hypothesis & Evidence linking)
 ↓
Investigation Timeline (Chronological Telemetry & Audit)
 ↓
Attack Chain Reconstruction (Evidence-driven Graph)
 ↓
Evidence Preservation & Finding Correlation
```

### Event Model & Telemetry Provenance
1. **`security_events`**: Core normalized event container storing event type, timestamp, source IP, source IP confidence, event source, and metadata.
2. **`http_events`**: Detailed web request/response telemetry linked to `security_events`.
3. **`network_events`**: Network stream layer telemetry linked to `security_events`.

#### Provenance Types (`event_source`)
- `ASSESSMENT_TOOL`
- `WEB_SERVER_LOG`
- `REVERSE_PROXY`
- `WAF`
- `APPLICATION_LOG`
- `NETWORK_SENSOR`
- `MANUAL_IMPORT`
- `LAB_SIMULATION`

### Detection Engine & Initial Rules
The Detection Engine evaluates normalized security events against deterministic detection rules without AI/LLM models:
1. **SQL Injection Pattern**: Detects SQL syntax indicators, UNION selects, and error probes in parameters/paths.
2. **XSS Probe**: Detects script tags, DOM handler probes (`onload=`, `onerror=`), and script execution payloads.
3. **Path Traversal Probe**: Detects path manipulation patterns (`../`, `..\`, `%2e%2e`).
4. **Command Injection Probe**: Detects OS command execution probe sequences (`|`, `;`, `&&`, `$()`).
5. **Sensitive Endpoint Probing**: Detects requests targeting sensitive configuration/admin resources (`/.env`, `/admin`, `/actuator`).
6. **Repeated Authentication Failures**: Detects multiple failed authentication attempts on login endpoints.
7. **Unusual HTTP Error Burst**: Detects abnormal bursts of HTTP 4xx/5xx responses within telemetry stream.

### Investigation Workspace & Hypotheses
- **Incident Status Workflow**: `NEW` → `OPEN` → `INVESTIGATING` → `CONTAINED` → `RESOLVED` / `CLOSED` / `FALSE_POSITIVE`.
- **Hypothesis Evaluation**: `PROPOSED`, `SUPPORTED`, `PARTIALLY_SUPPORTED`, `REJECTED`, `INCONCLUSIVE`.
- **Evidence Relationships**: `SUPPORTING`, `CONTRADICTING`, `NEUTRAL`.
- **Valid Investigation Conclusions**: `CONFIRMED`, `LIKELY`, `SUSPICIOUS`, `INCONCLUSIVE`, `FALSE_POSITIVE`.

### Attack Chain Reconstruction Topology
- **Node Types**: `RECONNAISSANCE`, `PROBE`, `EXPLOIT_ATTEMPT`, `AUTHENTICATION_EVENT`, `ACCESS`, `IMPACT`, `UNKNOWN`.
- **Edge Relationships**: `PRECEDES`, `RELATED_TO`, `POTENTIALLY_LEADS_TO`.
- **Strict Evidence Rule**: Never label a node `SUCCESSFUL_EXPLOITATION` or infer data theft unless direct, verified telemetry evidence confirms server response compromise. Default terminal node for probed endpoints is `EXPLOIT_ATTEMPT` or `POTENTIAL_IMPACT`.

### Security Boundaries & Source IP Integrity
1. **Source-IP Integrity**: AEGIS never infers, invents, or guesses an attacker IP. If `source_ip` is present in telemetry, it is marked `OBSERVED`. Otherwise, `source_ip_confidence` is marked `UNKNOWN` and the UI explicitly warns: `"Source IP unavailable from available telemetry."`
2. **Authorized Target Scoping**: Ingestion rejects security telemetry events for targets that do not exist or are not active/authorized.
3. **No Automatic Blocking or Containment**: `CONTAINED` status is a manually recorded investigation state only. AEGIS does not automatically modify firewall rules, drop traffic, or block IPs.
4. **Lab Mode Isolation**: Synthetic test events are restricted to `AEGIS_LAB_MODE=true` and tagged with `event_source = LAB_SIMULATION`. The UI renders a prominent `LAB EVENT` badge.
5. **No AI / RAG / Predictive Scoring**: All detection matching and correlation logic is strictly rule-based and deterministic.

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

### Security Events & Telemetry API
- `POST /api/v1/events/http` — Ingest HTTP telemetry event.
- `POST /api/v1/events/network` — Ingest network telemetry event.
- `POST /api/v1/events/batch` — Batch ingest telemetry events.
- `GET /api/v1/events` — Paginated telemetry events.
- `GET /api/v1/events/{id}` — Event detail.
- `GET /api/v1/events/{id}/detections` — Triggered detections for event.

### Detections API
- `GET /api/v1/detections` — Query detection matches.
- `PATCH /api/v1/detections/{id}/status` — Update detection match status.
- `GET /api/v1/detections/rules` — View detection rules.

### Incidents API
- `GET /api/v1/incidents` — Paginated security incidents.
- `GET /api/v1/incidents/{id}` — Incident details.
- `PATCH /api/v1/incidents/{id}/status` — Update incident status.
- `GET /api/v1/incidents/{id}/events` — Incident correlated events.
- `GET /api/v1/incidents/{id}/timeline` — Incident timeline events.
- `GET /api/v1/incidents/{id}/attack-chain` — Incident attack chain topology.
- `POST /api/v1/incidents/{id}/investigation` — Initialize investigation workspace.

### Investigations Workspace API
- `GET /api/v1/investigations` — List investigations.
- `GET /api/v1/investigations/{id}` — Workspace details.
- `POST /api/v1/investigations/{id}/hypotheses` — Create analyst hypothesis.
- `POST /api/v1/investigations/{id}/evidence` — Link evidence to hypothesis.
- `POST /api/v1/investigations/{id}/notes` — Add analyst note.
- `PATCH /api/v1/investigations/{id}/status` — Update status and conclusion.

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

### Detection & Investigation Schema (`V4`)
- `security_events`: `id`, `target_id`, `assessment_id`, `event_type`, `event_time`, `source_ip`, `source_ip_confidence`, `event_source`, `normalized_data`, timestamps.
- `http_events`: `id`, `security_event_id`, `target_id`, `method`, `scheme`, `host`, `port`, `path`, `query_string`, `status_code`, `request_headers`, `response_headers`.
- `network_events`: `id`, `security_event_id`, `target_id`, `source_ip`, `destination_ip`, `protocol`, `direction`, `bytes_in`, `bytes_out`.
- `detection_rules`: `id`, `name`, `description`, `event_type`, `severity`, `confidence`, `conditions`, `enabled`.
- `detection_matches`: `id`, `rule_id`, `target_id`, `event_id`, `severity`, `confidence`, `matched_at`, `evidence`, `status`.
- `security_incidents`: `id`, `target_id`, `title`, `severity`, `confidence`, `status`, `correlation_key`, `source_ip`, `source_ip_confidence`, `first_observed_at`, `last_observed_at`.
- `investigations`: `id`, `incident_id`, `status`, `primary_hypothesis`, `confidence`, `created_by`, `closed_at`.
- `investigation_hypotheses`: `id`, `investigation_id`, `statement`, `status`, `confidence`, `created_by`.
- `investigation_evidence`: `id`, `investigation_id`, `evidence_type`, `source_type`, `source_id`, `description`, `confidence`.
- `hypothesis_evidence`: `hypothesis_id`, `evidence_id`, `relationship`.
- `timeline_events`: `id`, `investigation_id`, `event_id`, `event_time`, `event_type`, `title`, `description`, `confidence`.
- `attack_chains`: `id`, `investigation_id`, `title`, `confidence`.
- `attack_chain_nodes`: `id`, `attack_chain_id`, `node_type`, `reference_type`, `reference_id`, `label`, `event_time`, `confidence`.
- `attack_chain_edges`: `id`, `attack_chain_id`, `from_node_id`, `to_node_id`, `relationship`, `confidence`.
- `investigation_notes`: `id`, `investigation_id`, `author_id`, `content`, timestamps.

---

## Testing & Quality Assurance

AEGIS includes comprehensive automated backend integration tests and frontend static type verification.

### Backend Test Execution
```bash
# Run backend test suite with JDK 21
mvn test
```
**Test Results**: 34/34 tests passed cleanly (0 errors, 0 failures).

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
