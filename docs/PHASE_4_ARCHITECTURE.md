# AEGIS Phase 4 — Architecture

## Product Purpose
AEGIS Phase 4 provides Attack Detection and Investigation for authorized web targets.
It introduces telemetry event ingestion, rule-based detection, observable-driven event correlation, incident management, evidence-based investigation workflows, and attack-chain reconstruction.

## Architecture Workflow
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

## Core Packages
- `com.aegis.event`: Security Event, HTTP Event, Network Event, Normalization & Ingestion APIs.
- `com.aegis.detection`: Detection Rule Model, Matching Engine, Rule evaluation.
- `com.aegis.correlation`: Observable correlation service, time-bucketed deduplication.
- `com.aegis.incident`: Incident model, lifecycle status transitions, Incident API.
- `com.aegis.investigation`: Investigation Workspace, Hypotheses, Evidence, Notes, Timeline.
- `com.aegis.attackchain`: Attack Chain graph model (Nodes & Edges), evidence-driven topology.
