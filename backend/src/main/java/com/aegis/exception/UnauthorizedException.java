package com.aegis.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends AegisException {

    public UnauthorizedException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}
