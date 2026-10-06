# AEGIS Phase 3 Database Schema & Data Model

## 1. Flyway Migration Script
Phase 3 database tables are defined in `backend/src/main/resources/db/migration/V3__attack_surface_and_vulnerability_intelligence.sql`.

## 2. Table Schemas

### `attack_surface_assets`
- `id` (UUID, Primary Key)
- `assessment_id` (UUID, Foreign Key)
- `asset_type` (VARCHAR: `DOMAIN`, `HOST`, `IP_ADDRESS`, `PORT`, `SERVICE`, `TECHNOLOGY`, `WEB_APPLICATION`, `ENDPOINT`, `PARAMETER`, `TLS_ENDPOINT`)
- `asset_value` (VARCHAR)
- `normalized_value` (VARCHAR)
- `parent_asset_id` (UUID)
- `status` (VARCHAR: `ACTIVE`, `INACTIVE`, `UNKNOWN`)
- `confidence` (VARCHAR: `VERY_HIGH`, `HIGH`, `MEDIUM`, `LOW`)
- `source` (VARCHAR)
- `first_seen_at`, `last_seen_at`, `created_at`, `updated_at` (TIMESTAMP)

### `attack_surface_relationships`
- `id` (UUID, Primary Key)
- `assessment_id` (UUID)
- `source_asset_id` (UUID)
- `relationship_type` (VARCHAR: `RESOLVES_TO`, `HOSTS`, `EXPOSES`, `RUNS`, `USES`, `SERVES`, `CONTAINS`)
- `target_asset_id` (UUID)
- `confidence` (VARCHAR)
- `source` (VARCHAR)

### `security_findings`
- `id` (UUID, Primary Key)
- `assessment_id` (UUID)
- `asset_id`, `endpoint_id` (UUID)
- `title`, `description` (TEXT)
- `finding_type` (VARCHAR)
- `severity` (VARCHAR: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`, `UNKNOWN`)
- `original_severity` (VARCHAR)
- `confidence` (VARCHAR: `VERY_HIGH`, `HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`)
- `status` (VARCHAR: `OPEN`, `CONFIRMED`, `FALSE_POSITIVE`, `ACCEPTED_RISK`, `RESOLVED`, `REOPENED`)
- `source` (VARCHAR)
- `deduplication_hash` (VARCHAR: SHA-256)
- `first_seen_at`, `last_seen_at`, `created_at`, `updated_at` (TIMESTAMP)

### `finding_evidence`
- `id` (UUID, Primary Key)
- `finding_id` (UUID)
- `evidence_type`, `source`, `content`, `redacted_content`, `location`, `hash` (TEXT)

### `finding_references`
- `id` (UUID, Primary Key)
- `finding_id` (UUID)
- `reference_type` (`CVE`, `CWE`, `OWASP`, `CISA`, `VENDOR`, `OTHER`), `reference_id`, `url`, `title`

### `finding_correlations`
- `id` (UUID, Primary Key)
- `finding_id`, `related_finding_id` (UUID)
- `correlation_type` (`SAME_ASSET`, `SAME_ENDPOINT`, `SAME_CVE`, `SAME_CWE`, `DUPLICATE`), `confidence`, `reason`

### `finding_comments`
- `id` (UUID, Primary Key)
- `finding_id`, `author_id`, `author_email` (VARCHAR), `comment` (TEXT)

### `cve_records`, `cwe_records`, `owasp_categories`
Catalog lookup tables for standardized vulnerability intelligence mapping.
