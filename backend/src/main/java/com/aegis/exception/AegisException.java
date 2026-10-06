package com.aegis.exception;

import org.springframework.http.HttpStatus;

public class AegisException extends RuntimeException {

    private final HttpStatus status;

    public AegisException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public AegisException(String message, Throwable cause, HttpStatus status) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
