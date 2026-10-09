package com.globalshield.auth;

import com.globalshield.common.ApiResponse;
import com.globalshield.common.IpUtil;
import com.globalshield.security.UserPrincipal;
import com.globalshield.user.User;
import com.globalshield.user.UserRepository;
import com.globalshield.user.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication, User Registration, and OTP Password Reset endpoints")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/request-otp")
    @Operation(summary = "Request registration OTP", description = "Sends a 6-digit OTP code to the provided email address via SMTP")
    public ResponseEntity<ApiResponse<Void>> requestOtp(@Valid @RequestBody OtpRequest request) {
        authService.requestRegistrationOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(
                "A 6-digit verification code has been sent to " + request.getEmail() + ". Please check your inbox (and spam folder).",
                null));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user account with OTP verification and role-based access")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        
        String ipAddress = IpUtil.getClientIp(httpRequest);
        String userAgent = IpUtil.getUserAgent(httpRequest);
        AuthResponse response = authService.register(request, ipAddress, userAgent);
        return new ResponseEntity<>(ApiResponse.success("User registered successfully", response), HttpStatus.CREATED);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset OTP", description = "Generates and emails a password reset OTP code via SMTP to registered email")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestForgotPasswordOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(
                "A password reset code has been sent to " + request.getEmail() + ". Please check your inbox (and spam folder).",
                null));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using OTP", description = "Verifies the 6-digit OTP and updates user password using SHA-512 encryption")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully. You can now log in with your new password.", null));
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticates user credentials and returns JWT access and refresh tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = IpUtil.getClientIp(httpRequest);
        String userAgent = IpUtil.getUserAgent(httpRequest);
        AuthResponse response = authService.login(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT access token", description = "Obtain a new access token using a valid refresh token")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {

        RefreshTokenResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    @Operation(summary = "User logout", description = "Revokes current refresh tokens for the authenticated user")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String ipAddress = IpUtil.getClientIp(httpRequest);
        String userAgent = IpUtil.getUserAgent(httpRequest);
        authService.logout(currentUser, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile", description = "Returns details of the currently authenticated user")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ApiResponse.success(UserResponse.fromEntity(user)));
    }
}
