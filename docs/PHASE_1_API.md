# AEGIS Phase 1 — REST API Specification

All API endpoints reside under `/api/v1` and return standard JSON responses:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-10-06T18:00:00Z"
}
```

---

## Endpoint Summary

### Authentication & Users
- `POST /api/v1/auth/register` — User registration (BCrypt hashed)
- `POST /api/v1/auth/login` — Authenticate credentials & return access/refresh JWTs
- `POST /api/v1/auth/refresh` — Refresh access token
- `POST /api/v1/auth/logout` — Revoke user tokens
- `GET  /api/v1/auth/me` — Return current authenticated user profile
- `GET  /api/v1/users` — Paginated user listing (ADMIN)

### Target Management
- `POST /api/v1/targets` — Register target (Strict HTTP/HTTPS URL validation)
- `GET  /api/v1/targets` — Paginated search & list of targets
- `GET  /api/v1/targets/{id}` — Get target details
- `PUT  /api/v1/targets/{id}` — Update target metadata
- `DELETE /api/v1/targets/{id}` — Disable target (Soft delete)
- `POST /api/v1/targets/{id}/authorization` — Add authorization record
- `GET  /api/v1/targets/{id}/authorization` — List target authorizations
- `POST /api/v1/targets/{id}/scope` — Add target scope entry
- `GET  /api/v1/targets/{id}/scope` — List target scope entries

### Assessments
- `GET  /api/v1/assessment-profiles` — List active assessment profiles
- `POST /api/v1/assessments` — Create assessment (Requires active target, unexpired authorization, and explicit confirmation)
- `GET  /api/v1/assessments` — List assessments
- `GET  /api/v1/assessments/{id}` — Get assessment details
- `POST /api/v1/assessments/{id}/cancel` — Cancel queued assessment

### Audit & Health
- `GET /api/v1/audit` — Query audit logs (ADMIN / ANALYST)
- `GET /api/v1/health` — System, Database & Flyway health check
