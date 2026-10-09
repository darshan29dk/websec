package com.globalshield.target;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TargetAuthorizationRequest {

    @NotNull(message = "Authorization type is required")
    private AuthorizationType authorizationType;

    @NotBlank(message = "Authorization statement is required")
    private String authorizationStatement;

    @NotNull(message = "Authorization date is required")
    private LocalDate authorizationDate;

    @NotNull(message = "Expiration date is required")
    @FutureOrPresent(message = "Expiration date must be today or in the future")
    private LocalDate expirationDate;
}
