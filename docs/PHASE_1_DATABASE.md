# AEGIS Phase 1 — Database Schema & Migration Specification

AEGIS uses PostgreSQL as its relational database. Schema management is strictly controlled via Flyway migrations (`spring.jpa.hibernate.ddl-auto=validate`).

---

## Tables & Relationships

1. **`users`**: User account credentials, BCrypt password hash, display names, roles (`ADMIN`, `ANALYST`, `VIEWER`), and timestamps.
2. **`refresh_tokens`**: Secure JWT refresh tokens with revocation flags.
3. **`security_targets`**: Registered web application targets (`WEB_URL`) with status (`ACTIVE`, `DISABLED`, `ARCHIVED`).
4. **`target_scopes`**: Target boundary rules (`DOMAIN`, `URL`, `IP`, `PATH`).
5. **`target_authorizations`**: Written permission and owner authorization records with `authorization_date` and `expiration_date`.
6. **`assessment_profiles`**: Pre-seeded profile definitions (`PASSIVE`, `STANDARD_AUTHORIZED`, `COMPREHENSIVE_AUTHORIZED`).
7. **`security_assessments`**: Assessment records with lifecycle status (`DRAFT`, `QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`).
8. **`audit_events`**: Immutable audit logs capturing security events, actor, IP address, and User-Agent.

---

## Supabase PostgreSQL Compatibility

All primary keys use standard PostgreSQL `UUID` types with `TIMESTAMP WITH TIME ZONE` columns. Flyway migration `V1__initial_schema.sql` can be executed directly against standard PostgreSQL or Supabase instances without modifications.
