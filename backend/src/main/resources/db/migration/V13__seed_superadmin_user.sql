-- Flyway Migration V13: Seed Superadmin User Account
-- Email: dk9380905822@gmail.com
-- Password: Dk#5822..com (SHA-512 Encrypted)

INSERT INTO users (id, email, password_hash, display_name, role, enabled, created_at, updated_at)
VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'dk9380905822@gmail.com',
    'f292283b2d5bf04cdb5a01de5ad5b6d53e5473eb9c5f9483654cd0a4e0735e711ba167609864618b823b83ee99a35d27e8208c22efb333181fbeaa908bf99a68',
    'Super Admin',
    'ADMIN',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    enabled = TRUE,
    updated_at = CURRENT_TIMESTAMP;
