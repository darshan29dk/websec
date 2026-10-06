# AEGIS Phase 3 Architecture: Attack Surface Discovery & Vulnerability Intelligence

## 1. Overview
Phase 3 builds an automated attack surface modeling and vulnerability intelligence layer on top of raw Phase 2 security tool assessment results. It operates purely as an authorized analysis engine, ingesting tool execution evidence (from Nmap, WhatWeb, Nikto, Nuclei, ZAP, and HTTP Security Analysis) and producing normalized asset inventories and deduplicated security findings.

## 2. Architectural Pipeline
```
[Phase 2 Tool Execution Results (Nmap, WhatWeb, Nikto, Nuclei, ZAP, HttpSecurity)]
                              │
                              ▼
           ┌──────────────────────────────────────┐
           │     FindingNormalizationService      │
           └──────────────────────────────────────┘
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
┌───────────────────────────┐     ┌───────────────────────────┐
│   Attack Surface Engine   │     │   Vulnerability Engine    │
├───────────────────────────┤     ├───────────────────────────┤
│ • Assets & Relationships  │     │ • Security Findings       │
│ • Host/IP Inventory       │     │ • Finding Evidence        │
│ • Port/Service Inventory  │     │ • References (CVE/CWE/...)│
│ • Technology Inventory    │     │ • Multi-Tool Correlations │
│ • Web Apps & Endpoints    │     │ • Deduplication Engine    │
│ • Parameter Inventory     │     │ • Status Workflow         │
│ • TLS Observations        │     │ • Severity Normalization  │
└───────────────────────────┘     └───────────────────────────┘
```

## 3. Key Components
- **`AttackSurfaceService`**: Extracts structured assets (`DOMAIN`, `HOST`, `IP_ADDRESS`, `PORT`, `SERVICE`, `TECHNOLOGY`, `WEB_APPLICATION`, `ENDPOINT`, `PARAMETER`, `TLS_ENDPOINT`) and explicit evidence-backed relationships (`RESOLVES_TO`, `HOSTS`, `EXPOSES`, `RUNS`, `USES`, `SERVES`, `CONTAINS`).
- **`FindingNormalizationService`**: Normalizes raw tool alerts into unified `SecurityFinding` models with strict severity mapping (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`), confidence attribution, SHA-256 deduplication hashing, and sensitive data redaction.
- **`VulnerabilityIntelligenceProvider`**: Service abstraction providing database-backed CVE, CWE, and OWASP intelligence without hallucinating missing data.
- **`FindingService`**: Manages finding state transitions (`OPEN`, `CONFIRMED`, `FALSE_POSITIVE`, `ACCEPTED_RISK`, `RESOLVED`, `REOPENED`), audit comments, and multi-tool correlations.
