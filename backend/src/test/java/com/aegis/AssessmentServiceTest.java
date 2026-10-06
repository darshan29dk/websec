package com.aegis;

import com.aegis.assessment.*;
import com.aegis.audit.AuditService;
import com.aegis.exception.*;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssessmentServiceTest {

    @Mock
    private SecurityAssessmentRepository assessmentRepository;

    @Mock
    private AssessmentProfileRepository profileRepository;

    @Mock
    private SecurityTargetRepository targetRepository;

    @Mock
    private TargetAuthorizationRepository authorizationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AssessmentService assessmentService;

    private User sampleUser;
    private UserPrincipal currentUser;
    private SecurityTarget activeTarget;
    private AssessmentProfile passiveProfile;
    private TargetAuthorization validAuthorization;

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

        activeTarget = SecurityTarget.builder()
                .id(UUID.randomUUID())
                .name("Target App")
                .primaryUrl("https://target.local/")
                .status(TargetStatus.ACTIVE)
                .createdBy(sampleUser)
                .build();

        passiveProfile = AssessmentProfile.builder()
                .id(UUID.randomUUID())
                .name("Passive Profile")
                .profileType(ProfileType.PASSIVE)
                .enabled(true)
                .build();

        validAuthorization = TargetAuthorization.builder()
                .id(UUID.randomUUID())
                .target(activeTarget)
                .authorizationType(AuthorizationType.WRITTEN_PERMISSION)
                .authorizationStatement("Written consent granted")
                .authorizedBy(sampleUser)
                .authorizationDate(LocalDate.now().minusDays(1))
                .expirationDate(LocalDate.now().plusDays(30))
                .build();
    }

    @Test
    @DisplayName("Should successfully queue an assessment with valid active authorization and confirmation")
    void testCreateAssessmentSuccess() {
        CreateAssessmentRequest request = CreateAssessmentRequest.builder()
                .targetId(activeTarget.getId())
                .profileId(passiveProfile.getId())
                .authorizationConfirmed(true)
                .build();

        when(targetRepository.findById(activeTarget.getId())).thenReturn(Optional.of(activeTarget));
        when(profileRepository.findById(passiveProfile.getId())).thenReturn(Optional.of(passiveProfile));
        when(authorizationRepository.findValidAuthorizationsForTarget(eq(activeTarget.getId()), any()))
                .thenReturn(List.of(validAuthorization));
        when(userRepository.findById(sampleUser.getId())).thenReturn(Optional.of(sampleUser));

        SecurityAssessment queuedAssessment = SecurityAssessment.builder()
                .id(UUID.randomUUID())
                .target(activeTarget)
                .profile(passiveProfile)
                .status(AssessmentStatus.QUEUED)
                .requestedBy(sampleUser)
                .authorizationConfirmed(true)
                .build();

        when(assessmentRepository.save(any())).thenReturn(queuedAssessment);
        when(assessmentRepository.findById(queuedAssessment.getId())).thenReturn(Optional.of(queuedAssessment));

        AssessmentResponse response = assessmentService.createAssessment(request, currentUser, "127.0.0.1", "JUnit");

        assertNotNull(response);
        assertEquals(AssessmentStatus.QUEUED, response.getStatus());
        assertEquals("Assessment engine will be implemented in Phase 2.", response.getStatusMessage());
        verify(assessmentRepository).save(any());
        verify(auditService).logEvent(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should reject assessment creation when authorizationConfirmed is false")
    void testRejectUnconfirmedAuthorization() {
        CreateAssessmentRequest request = CreateAssessmentRequest.builder()
                .targetId(activeTarget.getId())
                .profileId(passiveProfile.getId())
                .authorizationConfirmed(false)
                .build();

        when(targetRepository.findById(activeTarget.getId())).thenReturn(Optional.of(activeTarget));

        assertThrows(BadRequestException.class,
                () -> assessmentService.createAssessment(request, currentUser, "127.0.0.1", "JUnit"));
    }

    @Test
    @DisplayName("Should reject assessment creation when target has no authorization record")
    void testRejectMissingAuthorization() {
        CreateAssessmentRequest request = CreateAssessmentRequest.builder()
                .targetId(activeTarget.getId())
                .profileId(passiveProfile.getId())
                .authorizationConfirmed(true)
                .build();

        when(targetRepository.findById(activeTarget.getId())).thenReturn(Optional.of(activeTarget));
        when(profileRepository.findById(passiveProfile.getId())).thenReturn(Optional.of(passiveProfile));
        when(authorizationRepository.findValidAuthorizationsForTarget(eq(activeTarget.getId()), any()))
                .thenReturn(Collections.emptyList());
        when(authorizationRepository.findByTargetIdOrderByCreatedAtDesc(activeTarget.getId()))
                .thenReturn(Collections.emptyList());

        assertThrows(AuthorizationRequiredException.class,
                () -> assessmentService.createAssessment(request, currentUser, "127.0.0.1", "JUnit"));
    }

    @Test
    @DisplayName("Should reject assessment creation when target authorization is expired")
    void testRejectExpiredAuthorization() {
        CreateAssessmentRequest request = CreateAssessmentRequest.builder()
                .targetId(activeTarget.getId())
                .profileId(passiveProfile.getId())
                .authorizationConfirmed(true)
                .build();

        TargetAuthorization expiredAuth = TargetAuthorization.builder()
                .id(UUID.randomUUID())
                .target(activeTarget)
                .authorizationType(AuthorizationType.WRITTEN_PERMISSION)
                .authorizationStatement("Expired consent")
                .authorizedBy(sampleUser)
                .authorizationDate(LocalDate.now().minusDays(10))
                .expirationDate(LocalDate.now().minusDays(1)) // Expired yesterday
                .build();

        when(targetRepository.findById(activeTarget.getId())).thenReturn(Optional.of(activeTarget));
        when(profileRepository.findById(passiveProfile.getId())).thenReturn(Optional.of(passiveProfile));
        when(authorizationRepository.findValidAuthorizationsForTarget(eq(activeTarget.getId()), any()))
                .thenReturn(Collections.emptyList());
        when(authorizationRepository.findByTargetIdOrderByCreatedAtDesc(activeTarget.getId()))
                .thenReturn(List.of(expiredAuth));

        assertThrows(ExpiredAuthorizationException.class,
                () -> assessmentService.createAssessment(request, currentUser, "127.0.0.1", "JUnit"));
    }

    @Test
    @DisplayName("Should reject assessment creation when target is disabled")
    void testRejectDisabledTarget() {
        SecurityTarget disabledTarget = SecurityTarget.builder()
                .id(UUID.randomUUID())
                .name("Disabled Target")
                .status(TargetStatus.DISABLED)
                .build();

        CreateAssessmentRequest request = CreateAssessmentRequest.builder()
                .targetId(disabledTarget.getId())
                .profileId(passiveProfile.getId())
                .authorizationConfirmed(true)
                .build();

        when(targetRepository.findById(disabledTarget.getId())).thenReturn(Optional.of(disabledTarget));

        assertThrows(BadRequestException.class,
                () -> assessmentService.createAssessment(request, currentUser, "127.0.0.1", "JUnit"));
    }
}
