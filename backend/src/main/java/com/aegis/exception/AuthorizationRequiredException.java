package com.aegis.exception;

import org.springframework.http.HttpStatus;

public class AuthorizationRequiredException extends AegisException {

    public AuthorizationRequiredException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY); // 422
    }
}
