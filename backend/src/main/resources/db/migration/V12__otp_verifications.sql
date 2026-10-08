-- V12: OTP Verification and Password Reset Support

CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) NOT NULL, -- REGISTRATION or PASSWORD_RESET
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON otp_verifications(email, purpose);
