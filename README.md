# GlobalShield — Authorized Web Security Assessment, Defense & Continuous Protection Platform

**GlobalShield** is an enterprise-grade, authorized web security assessment, attack detection, defense validation, digital forensics, AI security analysis, defensive hardening, remediation tracking, security posture evaluation, and continuous security monitoring platform.

> GlobalShield continuously reduces security risk through authorized assessment, detection, remediation, controlled retesting, defense validation and monitoring.

---

## Table of Contents
1. [Product Purpose & Security Boundaries](#product-purpose--security-boundaries)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Database & Schema Migrations](#database--schema-migrations)
5. [Core Security Lifecycle Modules](#core-security-lifecycle-modules)
   - [Phase 1: Target Management & Security Control](#phase-1-target-management--security-control)
   - [Phase 2: Security Assessment Engine & Tool Adapters](#phase-2-security-assessment-engine--tool-adapters)
   - [Phase 3: Attack Surface & Vulnerability Intelligence](#phase-3-attack-surface--vulnerability-intelligence)
   - [Phase 4: Attack Detection & Event Correlation](#phase-4-attack-detection--event-correlation)
   - [Phase 5: Digital Forensics & Evidence Reconstruction](#phase-5-digital-forensics--evidence-reconstruction)
   - [Phase 6: AI Security Analyst & RAG Architecture](#phase-6-ai-security-analyst--rag-architecture)
   - [Phase 7: Defense Center & Remediation Workspace](#phase-7-defense-center--remediation-workspace)
   - [Phase 8: Controlled Retesting & Defense Validation](#phase-8-controlled-retesting--defense-validation)
   - [Phase 9: Security Posture & Regression Engine](#phase-9-security-posture--regression-engine)
   - [Phase 10: Reporting Engine, Continuous Monitoring & Security History](#phase-10-reporting-engine-continuous-monitoring--security-history)
6. [Security Tool Ecosystem](#security-tool-ecosystem)
7. [REST API Specification](#rest-api-specification)
8. [Database Schemas & Data Model](#database-schemas--data-model)
9. [Testing & Quality Assurance](#testing--quality-assurance)
10. [Getting Started & Local Development](#getting-started--local-development)

---

## Product Purpose & Security Boundaries

GlobalShield is designed strictly for **authorized web security assessments**.

### Explicit Boundaries & Security Controls
- **Target Authorization Required**: Security assessments and continuous monitoring can only be executed against targets with verified, active, unexpired authorization records.
- **SSRF & Network Boundary Enforcement**: `TargetNetworkPolicy` blocks internal subnets (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`) unless explicit Lab Mode (`GLOBALSHIELD_LAB_MODE=true`) is enabled for authorized local targets (e.g., OWASP Juice Shop).
- **No Unrestricted Command Execution**: Never provides or allows an unrestricted shell/terminal/command-execution interface. Arbitrary bash/sh/cmd/powershell execution and raw frontend commands are strictly prohibited. Tools run via `ProcessBuilder` with allowlisted arguments.
- **No Weaponized Exploitation**: GlobalShield does NOT perform destructive exploit execution, payload injection, automated shell commands, denial of service, or destructive testing.
- **Sensitive Data Redaction**: HTTP requests, cookies, Authorization headers, and session tokens in evidence are automatically scrubbed (`[REDACTED]`).
- **Source-IP Integrity**: Never invents or infers attacker IPs. If unobserved in telemetry, `source_ip` is `null`, `source_ip_confidence` is `UNKNOWN`, and UI displays `"Source IP unavailable from available telemetry."`
- **Forensic Integrity Rule**: Never invents forensic evidence, timestamps, HTTP headers, payloads, or attacker attribution. Unobserved attribution displays `"Attribution cannot be determined from available evidence."`
- **Zero Hallucination Policy**: Vulnerability intelligence (CVE, CWE, CVSS, OWASP) is recorded only when evidence exists; missing data is represented as `null`/`unavailable` without fake scoring.

---

## Architecture Overview

```
                          ┌─────────────────────────────────────────┐
                          │    GlobalShield Enterprise Console      │
                          │        (React 19 + TypeScript)          │
                          └────────────────────┬────────────────────┘
                                               │
                                               ▼
                          ┌─────────────────────────────────────────┐
                          │      GlobalShield REST API Gateway      │
                          │       (Spring Boot 3.3.4 + Java 21)     │
                          └────────────────────┬────────────────────┘
                                               │
             ┌─────────────────────────────────┼─────────────────────────────────┐
             ▼                                 ▼                                 ▼
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│ Target & Scope Engine   │       │ Tool Adapter Engine     │       │ Attack Surface Engine   │
├─────────────────────────┤       ├─────────────────────────┤       ├─────────────────────────┤
│ • Security Targets      │       │ • Nmap (Port/Service)   │       │ • Asset Graph           │
│ • Scope Rules           │       │ • WhatWeb (Tech Finger) │       │ • Endpoint Inventory    │
│ • Written Authorization │       │ • Nikto (Web Server)    │       │ • Technology Correlation│
│ • Immutable Audit Logs  │       │ • Nuclei (Vulnerabilities)│      │ • Relationship Mapping  │
└─────────────────────────┘       │ • OWASP ZAP (Web Scan)  │       └─────────────────────────┘
                                  │ • ffuf (Fuzzing)        │                    │
                                  │ • Amass (Subdomains)    │                    │
                                  │ • testssl.sh (TLS)      │                    │
                                  └────────────┬────────────┘                    │
                                               │                                 │
                                               ▼                                 ▼
                                  ┌──────────────────────────────────────────────────────────┐
                                  │ Finding Normalization & Deduplication Engine (SHA-256)   │
                                  └────────────┬───────────────────────────────┬─────────────┘
                                               │                               │
             ┌─────────────────────────────────┼───────────────────────────────┼─────────────────────────────────┐
             ▼                                 ▼                               ▼                                 ▼
┌─────────────────────────┐       ┌──────────────────────────┐    ┌──────────────────────────┐      ┌──────────────────────────┐
│ Detection & Correlation │       │ Digital Forensics Engine │    │ Security Posture Engine  │      │ Reporting & Monitoring   │
├─────────────────────────┤       ├──────────────────────────┤    ├──────────────────────────┤      ├──────────────────────────┤
│ • Telemetry Ingestion   │       │ • Forensic Cases         │    │ • 6 Posture Dimensions   │      │ • PDF/HTML/CSV/JSON Reports│
│ • Rule Engine           │       │ • SHA-256 Evidence Hash  │    │ • 0-100 Score Model      │      │ • Continuous Monitoring  │
│ • Incident Deduplication│       │ • Provenance Tracking    │    │ • Regression Analysis    │      │ • Auth Expiration Guard  │
└─────────────────────────┘       └──────────────────────────┘    └──────────────────────────┘      └──────────────────────────┘
                                               │                               │                                 │
                                               └───────────────┬───────────────┴─────────────────────────────────┘
                                                               │
                                                               ▼
                                                  ┌──────────────────────────┐
                                                  │ Supabase PostgreSQL DB   │
                                                  │ (Flyway V1 - V11)        │
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
├── assessment/          # Profiles, Assessment Orchestration, Tool Adapter Engine & Tool Status
├── attack_surface/      # Assets, Relationships, Technologies, WebApps, Endpoints
├── finding/             # SecurityFindings, Evidence, References, Fingerprints, Comments
├── vulnerability/       # VulnerabilityIntelligenceProvider, CVE/CWE/OWASP catalog models
├── event/               # SecurityEvent, HttpEvent, NetworkEvent, Normalizer, Telemetry Ingestion
├── detection/           # DetectionRule, DetectionEngine, DetectionMatch, Rules
├── correlation/         # EventCorrelationService, Time-Windowed Observable Correlator
├── incident/            # SecurityIncident, Incident Lifecycle & Triage Controller
├── investigation/       # Investigation Workspace, Hypotheses, Evidence, Notes, Timeline
├── attackchain/         # AttackChain Graph Topology (Nodes, Edges, Relationships)
├── forensics/           # Digital Forensics Cases, Evidence, SHA-256 Hashing, Provenance
├── ai/                  # AI Security Analyst, RAG Security Knowledge Base, Claim Validator
├── defense/             # Defense Controls Library, Recommendations & Remediation Workspace
├── retest/              # Controlled Retesting & Validation Decision Engine
├── posture/             # Security Posture Engine, 6 Dimensions, Fingerprint Regression Engine
├── report/              # Report Aggregator, PDF/HTML/CSV/JSON Renderers & Download Manager
├── monitoring/          # Continuous Monitoring Scheduler, Target Expiration Guard & Email Service
├── audit/               # Immutable System Audit Logging Engine
└── health/              # System, Database, Security Tool Health Checkers
```

---

## Technology Stack

- **Backend**: Java 21, Spring Boot 3.3.4, Spring Security 6.3, Spring Data JPA, Hibernate, Flyway 10.x, JJWT 0.12.6, OpenAPI / Swagger 3.
- **Frontend**: React 19, TypeScript 5.x, Vite, Lucide Icons, Custom GlobalShield Dark Theme CSS.
- **Database**: PostgreSQL 16+ (Fully compatible with Supabase PostgreSQL).
- **Containerization**: Docker, Docker Compose, Kali Linux security tools.

---

## Database & Schema Migrations

GlobalShield uses **Flyway** for deterministic database migrations. Schema changes are strictly validated (`spring.jpa.hibernate.ddl-auto=validate`).

- **`V1__initial_schema.sql`**: Core user accounts, roles, target management, target scope, written authorization, assessment profiles, assessment records, and audit log table.
- **`V2__web_security_assessment_engine.sql`**: Tool execution records, stage execution status, raw tool output persistence, and target network policy logs.
- **`V3__attack_surface_and_vulnerability_intelligence.sql`**: Attack surface assets, relationship graph, technologies, web apps, endpoints, parameters, normalized security findings, evidence, references, correlations, analyst comments, and CVE/CWE/OWASP catalog tables.
- **`V4__attack_detection_investigation.sql`**: Security events, HTTP telemetry events, network events, detection rules, detection matches, security incidents, investigations, hypotheses, evidence links, timeline events, attack chains, attack chain nodes, attack chain edges, and analyst notes.
- **`V5__digital_forensics.sql`**: Forensic cases, generic evidence model, evidence provenance tracking, HTTP/Network/Application forensic events, unified forensic timeline events, and forensic attack reconstruction events.
- **`V6__ai_security_analyst_rag.sql`**: Knowledge documents, vector chunks, AI investigations, claims, evidence references, and knowledge citations.
- **`V7__defense_remediation.sql`**: Defense controls library, defense recommendations, defense evidence, finding control mappings, remediation plans, and remediation tasks.
- **`V8__controlled_retesting_validation.sql`**: Retest execution records, retest findings, retest evidence, validation decisions, and defense validation results.
- **`V9__security_posture_and_regression.sql`**: Posture snapshots, posture dimensions, score factors, and security regression tracking.
- **`V10__reporting_monitoring_and_history.sql`**: Security reports, report artifacts, monitoring configurations, notification events, and target security history timeline.
- **`V11__globalshield_defense_and_tooling_expansion.sql`**: Security tools status, telemetry sources, WAF events, and system detection rules.

---

## Core Security Lifecycle Modules

### Phase 1: Target Management & Security Control
- **RBAC Authentication**: JWT access & refresh tokens with `ADMIN`, `ANALYST`, and `VIEWER` roles.
- **Security Target Boundary**: Target URL validation, domain scope constraints (`DOMAIN`, `URL`, `IP`, `PATH`), and verified written authorization records.
- **Immutable Audit Log**: Records system security actions (register, login, target create/update, assessment trigger, retest, posture calculation) with actor user ID, IP address, and resource metadata.

### Phase 2: Security Assessment Engine & Tool Adapters
- **Tool Adapter Architecture**: Dedicated adapters for **Nmap**, **WhatWeb**, **Nikto**, **Nuclei**, **OWASP ZAP**, **ffuf**, **Amass**, and **testssl.sh**.
- **Fixed Executable Paths & Allowlisted Arguments**: Eliminates shell execution vulnerabilities; processes run via `ProcessBuilder` without raw `sh -c` / `cmd /c` invocations.
- **Asynchronous Execution & Stage Lifecycle**: Assessment stages transition from `QUEUED` → `RUNNING` (0% to 100% progress) → `COMPLETED`.

### Phase 3: Attack Surface & Vulnerability Intelligence
- **Attack Surface Asset Graph**: Discovers and correlates `DOMAIN`, `HOST`, `IP_ADDRESS`, `PORT`, `SERVICE`, `TECHNOLOGY`, `WEB_APPLICATION`, `ENDPOINT`, `PARAMETER`, and `TLS_ENDPOINT` assets with explicit graph relationships.
- **Deterministic Finding Deduplication**: Generates SHA-256 fingerprints from `assessmentId + assetValue + endpointUrl + findingType + title`.
- **Finding Status Workflow**: State machine (`OPEN` → `CONFIRMED` / `FALSE_POSITIVE` / `ACCEPTED_RISK` → `RESOLVED` → `REOPENED`).

### Phase 4: Attack Detection & Event Correlation
- **Telemetry Event Ingestion & Normalization**: Standardized ingestion APIs for HTTP, WAF, reverse proxy, and network telemetry events with provenance.
- **Source-IP Integrity**: Never invents or infers attacker IPs. Unobserved IPs return `null` and display `"Source IP unavailable from available telemetry."`
- **Deterministic Rule Detection Engine**: Evaluates events against web security rules (SQL Injection, XSS, Path Traversal, Command Injection, Sensitive Endpoint Probing, Authentication Failures, Error Bursts).
- **Time-Windowed Event Correlation**: Groups correlated detections into deduplicated `SecurityIncident` records.

### Phase 5: Digital Forensics & Evidence Reconstruction
- **Forensic Case Management**: Case lifecycle (`OPEN`, `INVESTIGATING`, `EVIDENCE_COMPLETE`, `CLOSED`, `INCONCLUSIVE`) with target and incident linkage.
- **Evidence Provenance & SHA-256 Integrity Verification**: Cryptographic SHA-256 content hashing with real-time verification endpoint (`POST /api/v1/forensics/evidence/{id}/verify`).
- **Unified Forensic Timeline**: Strict chronological ordering by `event_time` and sequence number, distinguishing collection timestamp from actual event timestamp.

### Phase 6: AI Security Analyst & RAG Architecture
- **LLM Provider Abstraction**: Pluggable `LlmProvider` supporting `OPENAI`, `OLLAMA`, `MOCK`, and `DISABLED`.
- **RAG Security Knowledge Base**: Hybrid vector semantic and keyword search over authoritative security standards (OWASP, CWE catalog, TLS/Header guidance).
- **Prompt Injection Defense**: Wraps target-derived content inside XML delimiters (`<untrusted_target_telemetry>`) with explicit system instructions to ignore commands inside untrusted data.
- **Strict Anti-Hallucination Claim Validation**: `AiClaimValidator` enforces the mandatory **Source IP Rule**, **Timestamp Rule**, **Attribution Rule**, and evidence ID citation validation.

### Phase 7: Defense Center & Remediation Workspace
- **Security Controls Library**: Catalog of defense controls (`DB-QUERY-001`, `HTTP-SEC-001`, etc.) mapped to findings and OWASP vulnerabilities.
- **Remediation Board**: Lifecycle workspace tracking remediation work items across status columns (`OPEN`, `IN_PROGRESS`, `RETEST_REQUIRED`, `VALIDATED`, `CLOSED`).

### Phase 8: Controlled Retesting & Defense Validation
- **Retest Execution Engine**: Re-evaluates target vulnerabilities using target validation, scope validation, and allowlisted adapter parameters.
- **Validation Decision Engine**: Deterministically classifies retest outcomes into:
  - `FIXED`: Weakness no longer observable.
  - `PARTIALLY_FIXED`: Weakness partially remediated.
  - `NOT_FIXED`: Weakness still present.
  - `REGRESSED`: Previously fixed finding failed retest on subsequent assessment.
  - `INCONCLUSIVE`: Retest evidence incomplete.

### Phase 9: Security Posture & Regression Engine
- **Finding Fingerprint Strategy**: Computes stable SHA-256 fingerprints across assessments:
  `SHA-256(normalized_target + normalized_path + method + parameter + finding_type + cwe_or_cve)`
- **6 Posture Dimensions**:
  1. `VULNERABILITY_RISK` (35%): Penalties for unresolved critical (-25), high (-12), medium (-5), low (-2) findings.
  2. `ATTACK_SURFACE_RISK` (15%): Exposure penalties for asset and endpoint volume.
  3. `CONFIGURATION_SECURITY` (15%): Security header, TLS, and cookie security flags.
  4. `REMEDIATION_HEALTH` (15%): Bonuses for verified fixes (+10) and partial fixes (+5); penalties for reopened findings (-15).
  5. `DEFENSE_VALIDATION` (10%): Bonuses for passed retests (+15); penalties for failed retests (-15).
  6. `REGRESSION_RISK` (10%): Penalties for confirmed vulnerability regressions (-30 each).
- **Risk Classifications**:
  - `90–100`: `EXCELLENT`
  - `75–89`: `GOOD`
  - `60–74`: `MODERATE`
  - `40–59`: `HIGH_RISK`
  - `0–39`: `CRITICAL_RISK`

### Phase 10: Reporting Engine, Continuous Monitoring & Security History
- **Centralized Reporting**: Aggregates complete security data snapshots into 10 report types across **PDF**, **HTML**, **CSV**, and **JSON** export formats with SHA-256 checksum verification (`X-Report-Checksum-SHA256`).
- **Continuous Monitoring Scheduler**: `MonitoringScheduler` executes scheduled target assessments (`DAILY`, `WEEKLY`, `MONTHLY`, `CUSTOM`). Re-evaluates written authorization prior to every run; if authorization expires, updates status to `BLOCKED_AUTHORIZATION_EXPIRED`, dispatches notifications, and **halts scanner execution**.
- **Security History Timeline**: Aggregates target security history across assessments, findings, retests, posture changes, and incidents.

---

## Security Tool Ecosystem

GlobalShield integrates with approved Kali Linux tools using dedicated adapters that enforce conservative rate limits, execution timeouts, allowlisted parameters, and scope validation:

| Tool | Purpose | Supported Operations | Execution Method |
|---|---|---|---|
| **Nmap** | Host discovery & service enumeration | Port scanning, service detection | ProcessBuilder |
| **WhatWeb** | Application fingerprinting | Tech stack discovery | ProcessBuilder |
| **Nikto** | Web server security observations | Server config checks | ProcessBuilder |
| **Nuclei** | Vulnerability scanning | Allowlisted templates only | ProcessBuilder |
| **OWASP ZAP** | Passive/Active web security scan | Controlled API / daemon | ProcessBuilder / API |
| **ffuf** | Content & endpoint discovery | Allowlisted wordlists, rate limited | ProcessBuilder |
| **Amass** | Subdomain discovery | Scope-bounded DNS discovery | ProcessBuilder |
| **testssl.sh** | TLS/SSL configuration inspection | TLS version & cipher analysis | ProcessBuilder |

---

## REST API Specification

### Authentication & Target APIs
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`
- `GET /api/v1/targets`, `POST /api/v1/targets`, `GET /api/v1/targets/{id}`

### Security Tool & Assessment APIs
- `GET /api/v1/security-tools`, `GET /api/v1/security-tools/{tool}/health`
- `GET /api/v1/assessments`, `POST /api/v1/assessments`, `GET /api/v1/assessments/{id}`

### Detection, Incident & Forensics APIs
- `POST /api/v1/events/http`, `POST /api/v1/events/network`, `GET /api/v1/events`
- `GET /api/v1/incidents`, `GET /api/v1/incidents/{id}`, `POST /api/v1/incidents/{id}/triage`
- `POST /api/v1/forensics/cases`, `POST /api/v1/forensics/cases/{id}/evidence`, `POST /api/v1/forensics/evidence/{id}/verify`

### Defense, Retesting & Posture APIs
- `GET /api/v1/defense/recommendations`, `GET /api/v1/remediation`
- `POST /api/v1/retest`, `GET /api/v1/retest/{id}`
- `GET /api/v1/posture`, `GET /api/v1/posture/{targetId}`, `GET /api/v1/posture/{targetId}/history`

---

## Database Schemas & Data Model

- **`security_targets`**: `id`, `uuid`, `name`, `primary_url`, `status`, `authorized`, `authorization_expires_at`
- **`security_findings`**: `id`, `uuid`, `target_id`, `title`, `severity`, `status`, `finding_fingerprint`, `affected_url`
- **`security_tools_status`**: `id`, `tool_name`, `version`, `binary_path`, `availability_status`, `last_health_check`
- **`security_posture_snapshots`**: `id`, `target_id`, `score`, `risk_level`, `score_delta`, `snapshot_time`
- **`security_reports`**: `id`, `title`, `report_type`, `format`, `status`, `storage_path`, `sha256_checksum`

---

## Testing & Quality Assurance

GlobalShield includes comprehensive automated backend integration tests and frontend static type verification.

### Backend Test Execution
```bash
# Run backend test suite with JDK 21
$env:JAVA_HOME="C:\Program Files\Java\jdk-17"; mvn test
```
**Test Results**: All 61 backend unit & integration tests (`AegisIntegrationTest`, `AuditServiceTest`, `TargetNetworkPolicyTest`, `ToolParserTest`, `DetectionAndCorrelationTest`, `EvidenceGroundedAiTest`, `ForensicsTest`, `SecurityPostureServiceTest`, `ValidationDecisionEngineTest`) pass cleanly with 100% **BUILD SUCCESS**.

### Frontend Type Safety
```bash
cd frontend
npx tsc --noEmit
```
**Type Check Results**: 0 errors.

---

## Getting Started & Local Development

### Prerequisites
- JDK 21 / JDK 17 LTS
- Maven 3.9+
- Node.js 18+ and npm
- PostgreSQL 16+ or Supabase PostgreSQL instance

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
The GlobalShield Security Console will open at `http://localhost:5173`.
