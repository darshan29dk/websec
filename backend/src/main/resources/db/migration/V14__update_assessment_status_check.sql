-- Flyway Migration V14: Expand security_assessments_status_check constraint to include VALIDATING and PARTIALLY_COMPLETED
ALTER TABLE security_assessments DROP CONSTRAINT IF EXISTS security_assessments_status_check;
ALTER TABLE security_assessments ADD CONSTRAINT security_assessments_status_check 
    CHECK (status IN ('DRAFT', 'QUEUED', 'VALIDATING', 'RUNNING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED'));
