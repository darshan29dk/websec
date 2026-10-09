package com.globalshield.auth;

import com.globalshield.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private long expiresInMs;
    private UserResponse user;

    @Builder.Default
    private boolean mfaRequired = false;
    private String message;
    private String email;
    private String otpCode;
}
