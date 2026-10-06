package com.aegis.exception;

import org.springframework.http.HttpStatus;

public class InvalidTargetUrlException extends AegisException {

    public InvalidTargetUrlException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
