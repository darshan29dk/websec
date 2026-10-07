# AEGIS Phase 4 — Security Model & Boundaries

## Principles
1. **Source-IP Integrity**: AEGIS never infers, invents, or guesses an attacker IP. If `source_ip` is present in telemetry, it is marked `OBSERVED`. Otherwise, `source_ip_confidence` is marked `UNKNOWN` and the UI explicitly warns: `"Source IP unavailable from available telemetry."`
2. **Authorized Target Scoping**: Ingestion rejects security telemetry events for targets that do not exist or are not active/authorized.
3. **No Automatic Blocking or Containment**: `CONTAINED` status is a manually recorded investigation state only. AEGIS does not automatically modify firewall rules, drop traffic, or block IPs.
4. **Lab Mode Isolation**: Synthetic test events are restricted to `AEGIS_LAB_MODE=true` and tagged with `event_source = LAB_SIMULATION`. The UI renders a prominent `LAB EVENT` badge.
5. **No AI / RAG / Predictive Scoring**: All detection matching and correlation logic is strictly rule-based and deterministic.
