package com.globalshield.retest.dto;

import lombok.Data;

@Data
public class CreateRetestRequestDto {
    private String reason;
    private boolean authorizationConfirmed = true;
}
