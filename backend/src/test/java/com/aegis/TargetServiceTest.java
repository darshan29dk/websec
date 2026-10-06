package com.aegis;

import com.aegis.audit.AuditService;
import com.aegis.exception.BadRequestException;
import com.aegis.exception.DuplicateResourceException;
import com.aegis.exception.InvalidTargetUrlException;
import com.aegis.security.UserPrincipal;
import com.aegis.target.*;
import com.aegis.user.User;
import com.aegis.user.UserRepository;
import com.aegis.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TargetServiceTest {

    @Mock
    private SecurityTargetRepository targetRepository;

    @Mock
    private TargetScopeRepository scopeRepository;

    @Mock
    private TargetAuthorizationRepository authorizationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private TargetService targetService;

    private User sampleUser;
    private UserPrincipal currentUser;
    private SecurityTarget sampleTarget;

    @BeforeEach
    void setUp() {
        UUID userId = UUID.randomUUID();
        sampleUser = User.builder()
                .id(userId)
                .email("analyst@aegis.local")
                .displayName("Analyst User")
                .role(UserRole.ANALYST)
                .build();

        currentUser = UserPrincipal.create(sampleUser);

        sampleTarget = SecurityTarget.builder()
                .id(UUID.randomUUID())
                .name("Target Web App")
                .primaryUrl("https://example.com/")
                .status(TargetStatus.ACTIVE)
                .createdBy(sampleUser)
                .build();
    }

    @Test
    @DisplayName("Should successfully create a target with valid normalized URL")
    void testCreateTargetSuccess() {
        TargetRequest request = TargetRequest.builder()
                .name("Target Web App")
                .primaryUrl("https://example.com")
                .description("Testing authorized target")
                .build();

        when(targetRepository.existsByPrimaryUrlAndStatusNot(anyString(), any())).thenReturn(false);
        when(userRepository.findById(sampleUser.getId())).thenReturn(Optional.of(sampleUser));
        when(targetRepository.save(any())).thenReturn(sampleTarget);
        when(targetRepository.findById(sampleTarget.getId())).thenReturn(Optional.of(sampleTarget));

        TargetResponse response = targetService.createTarget(request, currentUser, "127.0.0.1", "JUnit");

        assertNotNull(response);
        assertEquals("Target Web App", response.getName());
        verify(targetRepository).save(any());
        verify(scopeRepository).save(any());
        verify(auditService).logEvent(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should reject invalid target URL with unsupported scheme")
    void testCreateTargetInvalidUrlScheme() {
        TargetRequest request = TargetRequest.builder()
                .name("Malicious Scheme")
                .primaryUrl("file:///etc/shadow")
                .build();

        assertThrows(InvalidTargetUrlException.class,
                () -> targetService.createTarget(request, currentUser, "127.0.0.1", "JUnit"));
    }

    @Test
    @DisplayName("Should reject target authorization when expiration date is before authorization date")
    void testAddAuthorizationInvalidDates() {
        TargetAuthorizationRequest request = TargetAuthorizationRequest.builder()
                .authorizationType(AuthorizationType.WRITTEN_PERMISSION)
                .authorizationStatement("Valid statement")
                .authorizationDate(LocalDate.now())
                .expirationDate(LocalDate.now().minusDays(1)) // Expired before start
                .build();

        when(targetRepository.findById(sampleTarget.getId())).thenReturn(Optional.of(sampleTarget));

        assertThrows(BadRequestException.class,
                () -> targetService.addAuthorization(sampleTarget.getId(), request, currentUser, "127.0.0.1", "JUnit"));
    }
}
