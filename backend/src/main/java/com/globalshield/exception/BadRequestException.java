package com.globalshield.exception;

import org.springframework.http.HttpStatus;

public class BadRequestException extends AegisException {

    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
