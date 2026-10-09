# GlobalShield Platform Audit Report: Website-Centric Architecture

## Executive Summary
This audit inspects the GlobalShield repository to resolve issues where target counts, endpoints, and security metrics were intertwined or leaked across targets. The platform is being upgraded to a strictly **website-centric** security architecture across all ten product phases.

## 1. Root Causes Identified

1. **Target Counts vs. Endpoint Inventory Confusion**:
   - `SecurityTarget` represents a registered website. Discovered URLs and routes are stored in `WebEndpoint` (linked via `SecurityAssessment`).
   - Previously, the platform lacked dedicated backend aggregate endpoints, causing frontend components to calculate target counts and metrics from incomplete paged responses, occasionally confusing endpoints with websites.
   - **Resolution**: Enforce 1 website = 1 target (`SecurityTarget`). Endpoints are child assets under the target's attack surface and never create new `SecurityTarget` rows.

2. **Absence of Centralized Backend Dashboard Aggregate APIs**:
   - `OverviewPage.tsx` previously issued 9 parallel client-side requests with small page limits (e.g. 20 targets, 100 findings), calculating metrics locally in JavaScript.
   - Unassessed targets were mistakenly scored as 100% safe.
   - **Resolution**: Create dedicated `DashboardController` (`/api/v1/dashboard/overview` and `/api/v1/dashboard/charts`) and a centralized `TargetRiskCalculationService`.

3. **Risk Scoring Engine Inconsistencies**:
   - Previously, risk score calculation was fragmented across posture snapshots and local frontend heuristics.
   - **Resolution**: Implement centralized `TargetRiskCalculationService` with documented weights (Critical: 25, High: 15, Medium: 5, Low: 1) and the **mandatory Critical Finding Override rule**: any website with at least one open confirmed critical finding is forced into `CRITICAL` risk classification. Unassessed websites are classified as `NOT_ASSESSED`.

4. **Missing Bulk Import Capability**:
   - Only single-target creation was supported through the UI.
   - **Resolution**: Implement `POST /api/v1/targets/bulk-import` supporting CSV and JSON with per-record validation, duplicate URL normalization and conflict detection, atomic reporting, and no automatic scanning.

5. **Target Dashboard Organization & Stale State Bleed**:
   - `TargetDetailPage.tsx` lacked the required 15 structured tabs and did not systematically reset state when switching target IDs, which could cause brief stale data overlap.
   - **Resolution**: Refactor `TargetDetailPage.tsx` to immediately clear state upon route change and organize the target's data into 15 dedicated tabs.

## 2. Files Modified & Added

- **Backend**:
  - `com/globalshield/target/dto/TargetRiskEvaluationDto.java` (Added)
  - `com/globalshield/target/dto/BulkImportRequestDto.java` (Added)
  - `com/globalshield/target/dto/BulkImportResponseDto.java` (Added)
  - `com/globalshield/target/dto/TargetDashboardOverviewDto.java` (Added)
  - `com/globalshield/target/TargetRiskCalculationService.java` (Added)
  - `com/globalshield/dashboard/dto/GlobalDashboardOverviewDto.java` (Added)
  - `com/globalshield/dashboard/dto/GlobalDashboardChartsDto.java` (Added)
  - `com/globalshield/dashboard/service/DashboardService.java` (Added)
  - `com/globalshield/dashboard/controller/DashboardController.java` (Added)
  - `com/globalshield/target/TargetService.java` (Updated for bulk import & target endpoints)
  - `com/globalshield/target/TargetController.java` (Updated for bulk import & target endpoints)

- **Frontend**:
  - `frontend/src/types/dashboard.ts` (Added)
  - `frontend/src/services/api/dashboardApi.ts` (Added)
  - `frontend/src/services/api/targetApi.ts` (Updated)
  - `frontend/src/components/BulkImportModal.tsx` (Added)
  - `frontend/src/pages/OverviewPage.tsx` (Restructured to Global Dashboard: Cards -> Charts -> Targets)
  - `frontend/src/pages/TargetDetailPage.tsx` (Restructured to 15 Dedicated Scoped Tabs)
