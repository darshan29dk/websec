package com.aegis.exception;

import org.springframework.http.HttpStatus;

public class ExpiredAuthorizationException extends AegisException {

    public ExpiredAuthorizationException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY); // 422
    }
}
