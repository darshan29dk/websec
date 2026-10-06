# AEGIS Phase 1 — Architecture Specification

## Overview

AEGIS Phase 1 establishes the clean modular foundation for authorized web security assessment and target management. The system is designed with strict package-by-feature modularization, separating authentication, authorization, target management, target scope, assessment lifecycle management, and audit logging.

```
backend/
├── src/main/java/com/aegis/
│   ├── AegisApplication.java
│   ├── config/          # CORS, OpenAPI, Security configs
│   ├── security/        # JWT filter, UserPrincipal, UserDetailsService
│   ├── auth/            # Registration, Login, Token Refresh, Logout
│   ├── user/            # User Entity, Roles (ADMIN, ANALYST, VIEWER)
│   ├── target/          # SecurityTarget, Scope, TargetAuthorization, URL Validation
│   ├── assessment/      # AssessmentProfile, SecurityAssessment lifecycle
│   ├── audit/           # Immutable Audit Logging engine
│   ├── health/          # System, DB & Flyway migration health check
│   ├── common/          # Uniform API response wrappers & helpers
│   └── exception/       # Centralized Global Exception Handler
```

---

## Technical Stack

- **Framework**: Spring Boot 3.3.4 (Java 21)
- **Security**: Spring Security 6.3 with JJWT 0.12.6 stateless token authentication
- **Database**: PostgreSQL 16+ (Compatible with Supabase PostgreSQL)
- **Migrations**: Flyway SQL Migrations (`V1__initial_schema.sql`)
- **ORM**: Hibernate JPA with `ddl-auto=validate`
- **Frontend**: React 19, TypeScript, Vite, Enterprise Security UI Console
