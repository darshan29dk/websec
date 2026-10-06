# AEGIS Phase 1 — Security Architecture & Controls

## Security Principles

1. **Authorization Enforcement**: Security target creation requires explicit authorization validation before an assessment can be created. Expired or missing authorizations immediately block assessment setup.
2. **Password Hashing**: BCrypt algorithm with strength 12.
3. **Stateless JWT Security**: HMAC-SHA256 256-bit signed access tokens and database-tracked refresh tokens.
4. **CORS Restrictions**: No wildcard origins (`allowOrigins("*")`). Allowed origins are strictly driven by configuration environment variables.
5. **No Dangerous URL Schemes**: URL validation rejects `file:`, `javascript:`, `data:`, `ftp:`, `ssh:`, `gopher:`, `dict:`, `blob:`.
6. **No Arbitrary Command Execution**: Phase 1 contains zero shell command execution adaptors. Security scanner execution belongs strictly to Phase 2+.
7. **No Plaintext Secrets**: Zero credentials or JWT secrets committed to source repository.
8. **Parameterized SQL Queries**: All queries use Spring Data JPA or parameterized HQL/SQL to prevent SQL injection vulnerabilities.
