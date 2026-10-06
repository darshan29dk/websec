# AEGIS Phase 1 — Testing Specification

## Overview

The AEGIS Phase 1 test suite comprises unit tests (JUnit 5 + Mockito), URL validation tests, and full end-to-end Spring Boot integration tests (`@SpringBootTest` + `MockMvc`).

---

## Execution Command

```bash
# Run complete backend test suite
cd backend
mvn clean test
```

---

## Verified Test Cases (20/20 Passed)

### 1. `AegisIntegrationTest`
- `testHealthEndpoint()`: Validates `/api/v1/health` status returns `UP` with database and Flyway migration metadata.
- `testUnauthenticatedProtection()`: Validates protected endpoints return `401 Unauthorized` without JWT.
- `testEndToEndPhase1Flow()`: Validates end-to-end registration, login, JWT validation, `/auth/me`, profile listing, and audit query.

### 2. `AuthServiceTest`
- `testSuccessfulRegistration()`: Validates user creation, role assignment, password hashing, and JWT token issuance.
- `testDuplicateEmailRegistration()`: Validates rejection of existing user email with `DuplicateResourceException` (409 Conflict).
- `testInvalidPasswordLogin()`: Validates authentication failure and audit logging.

### 3. `TargetServiceTest`
- `testCreateTargetSuccess()`: Validates URL normalization and target creation with initial URL scope entry.
- `testCreateTargetInvalidUrlScheme()`: Validates rejection of `file://` scheme with `InvalidTargetUrlException`.
- `testAddAuthorizationInvalidDates()`: Validates rejection when `expirationDate` is before `authorizationDate`.

### 4. `AssessmentServiceTest`
- `testCreateAssessmentSuccess()`: Validates assessment creation in `QUEUED` state with valid unexpired authorization and confirmation.
- `testRejectUnconfirmedAuthorization()`: Validates rejection when `authorizationConfirmed` is false.
- `testRejectMissingAuthorization()`: Validates rejection with `AuthorizationRequiredException` when no target authorization exists.
- `testRejectExpiredAuthorization()`: Validates rejection with `ExpiredAuthorizationException` when target authorization has expired.
- `testRejectDisabledTarget()`: Validates rejection when target status is `DISABLED`.

### 5. `UrlValidatorUtilTest`
- Validates HTTPS scheme normalization, bare domain scheme prepending, empty URL rejection, and illegal scheme rejection (`file:`, `javascript:`, `ftp:`).

---

## Frontend Build Verification

```bash
cd frontend
npm run build
```
- TypeScript compilation: 0 errors
- Vite bundle creation: `dist/assets/index-DFMc0z6W.js`
