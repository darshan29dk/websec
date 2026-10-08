package com.globalshield.auth;

import com.globalshield.audit.AuditService;
import com.globalshield.audit.AuditEventType;
import com.globalshield.exception.BadRequestException;
import com.globalshield.exception.DuplicateResourceException;
import com.globalshield.exception.ResourceNotFoundException;
import com.globalshield.exception.UnauthorizedException;
import com.globalshield.security.JwtTokenProvider;
import com.globalshield.security.UserPrincipal;
import com.globalshield.user.User;
import com.globalshield.user.UserRepository;
import com.globalshield.user.UserResponse;
import com.globalshield.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;
    private final OtpService otpService;

    private boolean isAuthorizedEmailDomain(String email) {
        if (email == null) return false;
        String lower = email.toLowerCase().trim();
        return lower.endsWith("@gmail.com") || lower.endsWith("@outlook.com") || lower.endsWith("@aegis.local");
    }

    @Transactional
    public void requestRegistrationOtp(String emailStr) {
        String email = emailStr.toLowerCase().trim();
        if (!isAuthorizedEmailDomain(email)) {
            throw new BadRequestException("Access denied. Only @gmail.com and @outlook.com email addresses are authorized.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User with email '" + email + "' already exists");
        }

        otpService.generateAndSendOtp(email, "Account Registration", "REGISTRATION");
    }

    @Transactional
    public void requestForgotPasswordOtp(String emailStr) {
        String email = emailStr.toLowerCase().trim();
        if (!isAuthorizedEmailDomain(email)) {
            throw new BadRequestException("Access denied. Only @gmail.com and @outlook.com email addresses are authorized.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No registered account found with email '" + email + "'"));

        if (!user.isEnabled()) {
            throw new BadRequestException("User account is disabled.");
        }

        otpService.generateAndSendOtp(email, "Password Reset", "PASSWORD_RESET");
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        if (!isAuthorizedEmailDomain(email)) {
            throw new BadRequestException("Access denied. Only @gmail.com and @outlook.com email addresses are authorized.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No registered account found with email '" + email + "'"));

        // Verify OTP code
        otpService.verifyOtp(email, request.getOtp(), "PASSWORD_RESET");

        // Update password using SHA-512 encoder
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        // Revoke old refresh tokens for security
        refreshTokenRepository.deleteByUserId(user.getId());

        auditService.logEvent(
                user.getId(),
                user.getEmail(),
                AuditEventType.PASSWORD_RESET,
                "User",
                user.getId().toString(),
                "PASSWORD_RESET",
                "Password reset successfully using OTP verification",
                null,
                null
        );
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress, String userAgent) {
        String email = request.getEmail().toLowerCase().trim();
        if (!isAuthorizedEmailDomain(email)) {
            throw new BadRequestException("Access denied. Only @gmail.com and @outlook.com email addresses are authorized.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User with email '" + request.getEmail() + "' already exists");
        }

        // Verify registration OTP if provided or required
        if (request.getOtp() != null && !request.getOtp().trim().isEmpty()) {
            otpService.verifyOtp(email, request.getOtp(), "REGISTRATION");
        }

        // If no users exist yet, make the first user ADMIN; otherwise respect request role or default to ANALYST
        UserRole assignedRole = request.getRole();
        if (userRepository.count() == 0) {
            assignedRole = UserRole.ADMIN;
        } else if (assignedRole == null) {
            assignedRole = UserRole.ANALYST;
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName().trim())
                .role(assignedRole)
                .enabled(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .lastLoginAt(Instant.now())
                .build();

        user = userRepository.save(user);

        // Generate tokens
        UserPrincipal principal = UserPrincipal.create(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        
        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshTokenStr = tokenProvider.generateRefreshToken(user.getId());

        saveRefreshToken(user, refreshTokenStr);

        auditService.logEvent(
                user.getId(),
                user.getEmail(),
                AuditEventType.LOGIN_SUCCESS,
                "User",
                user.getId().toString(),
                "REGISTER_AND_LOGIN",
                "User registered with role " + user.getRole(),
                ipAddress,
                userAgent
        );

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .expiresInMs(tokenProvider.getJwtAccessExpirationMs())
                .user(UserResponse.fromEntity(user))
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        String email = request.getEmail().toLowerCase().trim();
        if (!isAuthorizedEmailDomain(email)) {
            throw new UnauthorizedException("Access denied. Only @gmail.com and @outlook.com email addresses are authorized to log in.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userRepository.findById(userPrincipal.getId())
                    .orElseThrow(() -> new UnauthorizedException("User not found"));

            if (!user.isEnabled()) {
                throw new UnauthorizedException("User account is disabled");
            }

            user.setLastLoginAt(Instant.now());
            userRepository.save(user);

            String accessToken = tokenProvider.generateAccessToken(authentication);
            String refreshTokenStr = tokenProvider.generateRefreshToken(user.getId());

            saveRefreshToken(user, refreshTokenStr);

            auditService.logEvent(
                    user.getId(),
                    user.getEmail(),
                    AuditEventType.LOGIN_SUCCESS,
                    "User",
                    user.getId().toString(),
                    "LOGIN_SUCCESS",
                    "User authenticated successfully",
                    ipAddress,
                    userAgent
            );

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshTokenStr)
                    .expiresInMs(tokenProvider.getJwtAccessExpirationMs())
                    .user(UserResponse.fromEntity(user))
                    .build();

        } catch (BadCredentialsException ex) {
            auditService.logEvent(
                    null,
                    email,
                    AuditEventType.LOGIN_FAILURE,
                    "User",
                    null,
                    "LOGIN_FAILURE",
                    "Invalid email or password provided",
                    ipAddress,
                    userAgent
            );
            throw ex;
        }
    }

    private String hashToken(String token) {
        if (token == null) return "";
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }

    @Transactional
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        String tokenStr = request.getRefreshToken();
        if (!tokenProvider.validateToken(tokenStr)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        UUID userId = tokenProvider.getUserIdFromJWT(tokenStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (!user.isEnabled()) {
            throw new UnauthorizedException("User account is disabled");
        }

        RefreshToken refreshTokenEntity = refreshTokenRepository.findByTokenHash(hashToken(tokenStr))
                .orElseThrow(() -> new UnauthorizedException("Refresh token record not found or revoked"));

        if (refreshTokenEntity.isRevoked() || refreshTokenEntity.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token is expired or revoked");
        }

        // Revoke current token and generate new ones
        refreshTokenEntity.setRevoked(true);
        refreshTokenRepository.save(refreshTokenEntity);

        String newAccessToken = tokenProvider.generateAccessTokenFromUserId(user.getId(), user.getEmail(), user.getRole().name());
        String newRefreshTokenStr = tokenProvider.generateRefreshToken(user.getId());

        saveRefreshToken(user, newRefreshTokenStr);

        return RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenStr)
                .expiresInMs(tokenProvider.getJwtAccessExpirationMs())
                .build();
    }

    @Transactional
    public void logout(UserPrincipal currentUser, String ipAddress, String userAgent) {
        if (currentUser != null) {
            refreshTokenRepository.deleteByUserId(currentUser.getId());
            auditService.logEvent(
                    currentUser.getId(),
                    currentUser.getEmail(),
                    AuditEventType.LOGOUT,
                    "User",
                    currentUser.getId().toString(),
                    "LOGOUT",
                    "User logged out successfully",
                    ipAddress,
                    userAgent
            );
        }
    }

    private void saveRefreshToken(User user, String tokenStr) {
        Instant expiresAt = Instant.now().plusMillis(tokenProvider.getJwtRefreshExpirationMs());
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(tokenStr))
                .expiresAt(expiresAt)
                .revoked(false)
                .createdAt(Instant.now())
                .build();
        refreshTokenRepository.save(refreshToken);
    }
}
