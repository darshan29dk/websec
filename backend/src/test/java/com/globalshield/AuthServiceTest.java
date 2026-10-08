package com.globalshield;

import com.globalshield.audit.AuditService;
import com.globalshield.auth.*;
import com.globalshield.exception.DuplicateResourceException;
import com.globalshield.exception.UnauthorizedException;
import com.globalshield.security.JwtTokenProvider;
import com.globalshield.user.User;
import com.globalshield.user.UserRepository;
import com.globalshield.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuditService auditService;

    @Mock
    private OtpService otpService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(UUID.randomUUID())
                .email("analyst@aegis.local")
                .passwordHash("hashed_password")
                .displayName("Analyst User")
                .role(UserRole.ANALYST)
                .enabled(true)
                .build();
    }

    @Test
    @DisplayName("Should successfully register a new user with valid OTP")
    void testSuccessfulRegistration() {
        RegisterRequest request = RegisterRequest.builder()
                .email("newuser@aegis.local")
                .password("SecurePass123!")
                .displayName("New User")
                .role(UserRole.ANALYST)
                .otp("123456")
                .build();

        when(userRepository.existsByEmail("newuser@aegis.local")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed_password");
        when(userRepository.save(any())).thenReturn(sampleUser);
        when(tokenProvider.generateAccessToken(any())).thenReturn("mock_access_token");
        when(tokenProvider.generateRefreshToken(any())).thenReturn("mock_refresh_token");

        AuthResponse response = authService.register(request, "127.0.0.1", "JUnit");

        assertNotNull(response);
        assertEquals("mock_access_token", response.getAccessToken());
        assertEquals("mock_refresh_token", response.getRefreshToken());
        verify(otpService).verifyOtp(eq("newuser@aegis.local"), eq("123456"), eq("REGISTRATION"));
        verify(userRepository).save(any());
        verify(auditService).logEvent(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should throw BadRequestException when registration OTP is missing")
    void testRegistrationFailsWithoutOtp() {
        RegisterRequest request = RegisterRequest.builder()
                .email("newuser@aegis.local")
                .password("SecurePass123!")
                .displayName("New User")
                .role(UserRole.ANALYST)
                .build();

        when(userRepository.existsByEmail("newuser@aegis.local")).thenReturn(false);

        assertThrows(com.globalshield.exception.BadRequestException.class, () -> authService.register(request, "127.0.0.1", "JUnit"));
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException on duplicate email registration")
    void testDuplicateEmailRegistration() {
        RegisterRequest request = RegisterRequest.builder()
                .email("analyst@aegis.local")
                .password("SecurePass123!")
                .displayName("Duplicate User")
                .otp("123456")
                .build();

        when(userRepository.existsByEmail("analyst@aegis.local")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(request, "127.0.0.1", "JUnit"));
    }

    @Test
    @DisplayName("Should throw BadCredentialsException on invalid login password")
    void testInvalidPasswordLogin() {
        LoginRequest request = LoginRequest.builder()
                .email("analyst@aegis.local")
                .password("WrongPassword")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request, "127.0.0.1", "JUnit"));
        verify(auditService).logEvent(eq(null), eq("analyst@aegis.local"), any(), any(), eq(null), any(), any(), any(), any());
    }
}
