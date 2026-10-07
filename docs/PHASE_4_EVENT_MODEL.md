# AEGIS Phase 4 — Event Model

## Overview
Phase 4 handles security events with strict provenance tracking and sensitivity redaction.

## Event Tables
1. `security_events`: Core normalized event container storing event type, timestamp, source IP, source IP confidence, event source, and metadata.
2. `http_events`: Detailed web request/response telemetry linked to `security_events`.
3. `network_events`: Network stream layer telemetry linked to `security_events`.

## Provenance (`event_source`)
- `ASSESSMENT_TOOL`
- `WEB_SERVER_LOG`
- `REVERSE_PROXY`
- `WAF`
- `APPLICATION_LOG`
- `NETWORK_SENSOR`
- `MANUAL_IMPORT`
- `LAB_SIMULATION`

## Redaction & Security Boundaries
- Sensitive authorization tokens (`Authorization: Bearer ...`), passwords, and session cookies are redacted during normalization.
- Request/response payload references are bounded and never store unlimited raw binary dumps directly in primary DB tables.
