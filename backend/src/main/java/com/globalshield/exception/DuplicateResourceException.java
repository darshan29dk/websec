package com.globalshield.exception;

import org.springframework.http.HttpStatus;

public class DuplicateResourceException extends AegisException {

    public DuplicateResourceException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
