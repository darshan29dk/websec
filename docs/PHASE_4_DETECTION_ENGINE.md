# AEGIS Phase 4 — Detection Engine & Rules

## Rule Evaluation Architecture
The Detection Engine evaluates normalized security events against deterministic detection rules. No AI/LLM models are used.

## Initial Detection Rules
1. **SQL Injection Pattern**: Detects SQL syntax indicators, UNION selects, and error probes in parameters/paths.
2. **XSS Probe**: Detects script tags, DOM handler probes (`onload=`, `onerror=`), and script execution payloads.
3. **Path Traversal Probe**: Detects path manipulation patterns (`../`, `..\`, `%2e%2e`).
4. **Command Injection Probe**: Detects OS command execution probe sequences (`|`, `;`, `&&`, `$()`).
5. **Sensitive Endpoint Probing**: Detects requests targeting sensitive configuration/admin resources (`/.env`, `/admin`, `/actuator`).
6. **Repeated Authentication Failures**: Detects multiple failed authentication attempts on login endpoints.
7. **Unusual HTTP Error Burst**: Detects abnormal bursts of HTTP 4xx/5xx responses within telemetry stream.

## Correlation & Deduplication
- Detection matches are correlated over a configurable time window (`security.investigation.correlation-window-seconds`).
- Events sharing identical target, source IP (when available), and endpoint group generate a unified `SecurityIncident`.
