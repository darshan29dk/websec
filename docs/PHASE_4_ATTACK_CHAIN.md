# AEGIS Phase 4 — Attack Chain Reconstruction

## Design Philosophy
Attack chains in AEGIS Phase 4 are evidence-driven topology graphs constructed deterministically from verified telemetry and detections.

## Node Types
- `RECONNAISSANCE`
- `PROBE`
- `EXPLOIT_ATTEMPT`
- `AUTHENTICATION_EVENT`
- `ACCESS`
- `IMPACT`
- `UNKNOWN`

## Edge Relationships
- `PRECEDES`
- `RELATED_TO`
- `POTENTIALLY_LEADS_TO`

## Strict Rule
Never label a node `SUCCESSFUL_EXPLOITATION` or infer data theft unless direct, verified telemetry evidence confirms server response compromise. Default terminal node for probed endpoints is `EXPLOIT_ATTEMPT` or `POTENTIAL_IMPACT`.
