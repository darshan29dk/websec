# AEGIS Phase 3 REST API Specification

## 1. Attack Surface API

### `GET /api/v1/assessments/{id}/attack-surface`
Returns complete attack surface model for an assessment (assets, relationships, summary counts).

### `GET /api/v1/assessments/{id}/attack-surface/assets`
Returns paginated list of attack surface assets filtered by `assetType` (`DOMAIN`, `HOST`, `IP_ADDRESS`, `PORT`, `SERVICE`, `TECHNOLOGY`, `WEB_APPLICATION`, `ENDPOINT`, `PARAMETER`).

### `GET /api/v1/assessments/{id}/attack-surface/relationships`
Returns graph relationships (`RESOLVES_TO`, `HOSTS`, `EXPOSES`, `RUNS`, `USES`, `SERVES`, `CONTAINS`).

### `GET /api/v1/assessments/{id}/attack-surface/summary`
Returns metric counts for hosts, IPs, ports, services, technologies, web apps, endpoints, APIs, and findings.

---

## 2. Vulnerability Findings API

### `GET /api/v1/findings`
Returns paginated security findings with backend filtering by `assessmentId`, `severity`, `status`, `confidence`, `source`, and text `search`.

### `GET /api/v1/findings/{id}`
Returns full finding detail object including normalized finding model, evidence list, reference list, correlation list, and analyst comments.

### `POST /api/v1/findings/{id}/status`
Updates finding status (`OPEN`, `CONFIRMED`, `FALSE_POSITIVE`, `ACCEPTED_RISK`, `RESOLVED`, `REOPENED`) with required audit logging and optional comment.

### `POST /api/v1/findings/{id}/comments`
Adds analyst audit comment to a finding.

### `GET /api/v1/assessments/{id}/findings/summary`
Returns finding severity breakdown summary for an assessment.
