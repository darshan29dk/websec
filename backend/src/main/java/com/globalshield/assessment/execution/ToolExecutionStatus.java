package com.globalshield.assessment.execution;

public enum ToolExecutionStatus {
    QUEUED,
    VALIDATING,
    RUNNING,
    COMPLETED,
    PARTIALLY_COMPLETED,
    FAILED,
    TIMEOUT,
    CANCELLED,
    NOT_AVAILABLE,
    BLOCKED
}
