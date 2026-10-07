package com.aegis;

import com.aegis.event.*;
import com.aegis.target.SecurityTarget;
import com.aegis.target.SecurityTargetRepository;
import com.aegis.target.TargetStatus;
import com.aegis.target.TargetType;
import com.aegis.user.User;
import com.aegis.user.UserRepository;
import com.aegis.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class EventIngestionTest {

    @Autowired
    private EventService eventService;

    @Autowired
    private SecurityTargetRepository targetRepository;

    @Autowired
    private UserRepository userRepository;

    private SecurityTarget target;
    private User testUser;

    @BeforeEach
    public void setup() {
        testUser = userRepository.findByEmail("admin-ingest@aegis.local")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("admin-ingest@aegis.local")
                        .displayName("Admin Ingest")
                        .passwordHash("hash")
                        .role(UserRole.ADMIN)
                        .build()));

        target = new SecurityTarget();
        target.setName("Authorized Lab Target");
        target.setPrimaryUrl("http://target.lab.local");
        target.setTargetType(TargetType.WEB_URL);
        target.setStatus(TargetStatus.ACTIVE);
        target.setCreatedBy(testUser);
        target = targetRepository.save(target);
    }

    @Test
    public void testHttpEventIngestionWithObservedSourceIp() {
        HttpEventIngestRequest request = new HttpEventIngestRequest();
        request.setTargetId(target.getId());
        request.setSourceIp("203.0.113.45");
        request.setMethod("POST");
        request.setHost("target.lab.local");
        request.setPath("/api/login");
        request.setQueryString("user=admin");
        request.setRequestHeaders("Authorization: Bearer secret_jwt_token_here");
        request.setEventSource(EventSource.LAB_SIMULATION);

        SecurityEvent event = eventService.ingestHttpEvent(request);

        assertNotNull(event.getId());
        assertEquals("203.0.113.45", event.getSourceIp());
        assertEquals(SourceIpConfidence.OBSERVED, event.getSourceIpConfidence());
        assertEquals(EventSource.LAB_SIMULATION, event.getEventSource());
    }

    @Test
    public void testHttpEventIngestionWithUnknownSourceIp() {
        HttpEventIngestRequest request = new HttpEventIngestRequest();
        request.setTargetId(target.getId());
        request.setSourceIp(null); // No source IP in telemetry
        request.setMethod("GET");
        request.setHost("target.lab.local");
        request.setPath("/about");
        request.setEventSource(EventSource.APPLICATION_LOG);

        SecurityEvent event = eventService.ingestHttpEvent(request);

        assertNotNull(event.getId());
        assertNull(event.getSourceIp());
        assertEquals(SourceIpConfidence.UNKNOWN, event.getSourceIpConfidence());
    }

    @Test
    public void testInvalidTargetIdRejection() {
        HttpEventIngestRequest request = new HttpEventIngestRequest();
        request.setTargetId(java.util.UUID.randomUUID());
        request.setMethod("GET");
        request.setHost("unknown.local");
        request.setPath("/");

        assertThrows(IllegalArgumentException.class, () -> {
            eventService.ingestHttpEvent(request);
        });
    }
}
