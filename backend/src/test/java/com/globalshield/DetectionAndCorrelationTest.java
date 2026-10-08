package com.globalshield;

import com.globalshield.detection.DetectionMatch;
import com.globalshield.event.*;
import com.globalshield.incident.IncidentService;
import com.globalshield.incident.SecurityIncident;
import com.globalshield.target.SecurityTarget;
import com.globalshield.target.SecurityTargetRepository;
import com.globalshield.target.TargetStatus;
import com.globalshield.target.TargetType;
import com.globalshield.user.User;
import com.globalshield.user.UserRepository;
import com.globalshield.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class DetectionAndCorrelationTest {

    @Autowired
    private EventService eventService;

    @Autowired
    private IncidentService incidentService;

    @Autowired
    private SecurityTargetRepository targetRepository;

    @Autowired
    private UserRepository userRepository;

    private SecurityTarget target;
    private User testUser;

    @BeforeEach
    public void setup() {
        testUser = userRepository.findByEmail("admin-detection@aegis.local")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("admin-detection@aegis.local")
                        .displayName("Admin Detection")
                        .passwordHash("hash")
                        .role(UserRole.ADMIN)
                        .build()));

        target = new SecurityTarget();
        target.setName("Lab Target");
        target.setPrimaryUrl("http://target.lab.local");
        target.setTargetType(TargetType.WEB_URL);
        target.setStatus(TargetStatus.ACTIVE);
        target.setCreatedBy(testUser);
        target = targetRepository.save(target);
    }

    @Test
    public void testSqlInjectionDetectionAndIncidentCorrelation() {
        HttpEventIngestRequest request1 = new HttpEventIngestRequest();
        request1.setTargetId(target.getId());
        request1.setSourceIp("198.51.100.10");
        request1.setMethod("GET");
        request1.setHost("target.lab.local");
        request1.setPath("/products");
        request1.setQueryString("id=1' UNION SELECT username, password FROM users--");
        request1.setEventSource(EventSource.LAB_SIMULATION);

        SecurityEvent event1 = eventService.ingestHttpEvent(request1);
        List<DetectionMatch> detections1 = eventService.getDetectionsForEvent(event1.getId());

        assertFalse(detections1.isEmpty(), "SQL Injection rule should trigger detection match");
        assertEquals("HIGH", detections1.get(0).getSeverity().name());

        // Verify correlated incident creation
        Page<SecurityIncident> incidents = incidentService.getIncidents(0, 10, target.getId(), null, null);
        assertFalse(incidents.isEmpty(), "Detection should trigger SecurityIncident creation");
        assertEquals("198.51.100.10", incidents.getContent().get(0).getSourceIp());
        assertEquals(SourceIpConfidence.OBSERVED, incidents.getContent().get(0).getSourceIpConfidence());
    }

    @Test
    public void testNormalRequestDoesNotTriggerIncident() {
        HttpEventIngestRequest request = new HttpEventIngestRequest();
        request.setTargetId(target.getId());
        request.setSourceIp("198.51.100.20");
        request.setMethod("GET");
        request.setHost("target.lab.local");
        request.setPath("/home");
        request.setEventSource(EventSource.APPLICATION_LOG);

        SecurityEvent event = eventService.ingestHttpEvent(request);
        List<DetectionMatch> detections = eventService.getDetectionsForEvent(event.getId());

        assertTrue(detections.isEmpty(), "Normal request should not trigger detections");
    }
}
