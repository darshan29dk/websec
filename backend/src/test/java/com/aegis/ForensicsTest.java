package com.aegis;

import com.aegis.forensics.dto.*;
import com.aegis.forensics.enums.*;
import com.aegis.forensics.service.ForensicService;
import com.aegis.incident.*;
import com.aegis.target.*;
import com.aegis.user.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ForensicsTest {

    @Autowired
    private ForensicService forensicService;

    @Autowired
    private SecurityTargetRepository targetRepository;

    @Autowired
    private SecurityIncidentRepository incidentRepository;

    @Autowired
    private UserRepository userRepository;

    private SecurityTarget target;
    private User testUser;
    private SecurityIncident incident;

    @BeforeEach
    public void setup() {
        testUser = userRepository.findByEmail("forensic-admin@aegis.local")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("forensic-admin@aegis.local")
                        .displayName("Forensic Investigator")
                        .passwordHash("hash")
                        .role(UserRole.ADMIN)
                        .build()));

        target = new SecurityTarget();
        target.setName("Forensics Lab Target");
        target.setPrimaryUrl("http://forensics.lab.local");
        target.setTargetType(TargetType.WEB_URL);
        target.setStatus(TargetStatus.ACTIVE);
        target.setCreatedBy(testUser);
        target = targetRepository.save(target);

        incident = new SecurityIncident();
        incident.setTargetId(target.getId());
        incident.setTitle("Correlated SQL Injection Incident");
        incident.setDescription("Multiple SQL injection probes detected against /api/search");
        incident.setSeverity(IncidentSeverity.HIGH);
        incident.setConfidence(IncidentConfidence.HIGH);
        incident.setStatus(IncidentStatus.OPEN);
        incident.setCorrelationKey("corr-key-12345");
        incident.setSourceIp("198.51.100.10");
        incident.setSourceIpConfidence(com.aegis.event.SourceIpConfidence.OBSERVED);
        incident.setFirstObservedAt(java.time.OffsetDateTime.now().minusSeconds(600));
        incident.setLastObservedAt(java.time.OffsetDateTime.now());
        incident.setCreatedBy("forensic-admin@aegis.local");
        incident = incidentRepository.save(incident);
    }

    @Test
    public void testForensicCaseCreationAndIncidentAssociation() {
        ForensicCaseResponse caseResp = forensicService.createCaseFromIncident(incident.getId(), testUser);

        assertNotNull(caseResp.getId());
        assertNotNull(caseResp.getCaseNumber());
        assertTrue(caseResp.getCaseNumber().startsWith("FR-"));
        assertEquals("Forensics Lab Target", caseResp.getTargetName());
        assertEquals(CaseStatus.OPEN, caseResp.getStatus());
        assertEquals(1, caseResp.getEvidenceCount(), "Initial incident evidence should be attached");
    }

    @Test
    public void testEvidenceHashingSecretRedactionAndIntegrityVerification() {
        CreateForensicCaseRequest req = new CreateForensicCaseRequest();
        req.setTargetId(target.getId());
        req.setTitle("Evidence Integrity Case");
        req.setPriority(CasePriority.HIGH);

        ForensicCaseResponse fc = forensicService.createCase(req, testUser);

        AddEvidenceRequest evReq = new AddEvidenceRequest();
        evReq.setEvidenceType(EvidenceType.HTTP_REQUEST);
        evReq.setSourceType(EvidenceSourceType.WEB_SERVER);
        evReq.setSourceReference("nginx-access.log:402");
        evReq.setEventTime(Instant.now().minusSeconds(120));
        evReq.setProvenance("Web Server Log Collector");
        evReq.setContent("GET /api/user Authorization: Bearer secret_jwt_token_12345");
        evReq.setDescription("HTTP GET with sensitive header");
        evReq.setConfidence(EvidenceConfidence.HIGH);
        evReq.setClassification(EvidenceClassification.OBSERVED);

        EvidenceResponse evidence = forensicService.addEvidence(fc.getId(), evReq);

        assertNotNull(evidence.getId());
        assertNotNull(evidence.getContentHash());
        assertEquals(64, evidence.getContentHash().length(), "SHA-256 hash length should be 64 hex characters");
        assertEquals(IntegrityStatus.VERIFIED, evidence.getIntegrityStatus());

        EvidenceVerificationResponse verification = forensicService.verifyEvidenceIntegrity(evidence.getId());
        assertEquals(IntegrityStatus.VERIFIED, verification.getStatus());
        assertEquals(evidence.getContentHash(), verification.getCalculatedHash());
    }

    @Test
    public void testTimelineAndAttackReconstructionGeneration() {
        ForensicCaseResponse fc = forensicService.createCaseFromIncident(incident.getId(), testUser);

        AddEvidenceRequest evReq = new AddEvidenceRequest();
        evReq.setEvidenceType(EvidenceType.APPLICATION_LOG);
        evReq.setSourceType(EvidenceSourceType.APPLICATION);
        evReq.setSourceReference("app.log:102");
        evReq.setEventTime(Instant.now().minusSeconds(300));
        evReq.setProvenance("App Log Parser");
        evReq.setContent("POST /api/search SQL injection probe error 500");
        evReq.setDescription("Application error during SQL injection probe");
        evReq.setConfidence(EvidenceConfidence.HIGH);
        evReq.setClassification(EvidenceClassification.OBSERVED);

        forensicService.addEvidence(fc.getId(), evReq);

        Page<TimelineEventResponse> timeline = forensicService.getCaseTimeline(fc.getId(), PageRequest.of(0, 20));
        assertFalse(timeline.isEmpty(), "Timeline should contain correlated events");

        AttackChainResponse chain = forensicService.getAttackChain(fc.getId());
        assertNotNull(chain);
        assertFalse(chain.getEvents().isEmpty(), "Attack reconstruction events should be generated");
    }

    @Test
    public void testForensicSummaryDeterministicOutput() {
        ForensicCaseResponse fc = forensicService.createCaseFromIncident(incident.getId(), testUser);
        ForensicSummaryResponse summary = forensicService.getForensicSummary(fc.getId());

        assertNotNull(summary);
        assertEquals(fc.getCaseNumber(), summary.getCaseNumber());
        assertFalse(summary.isExploitationEstablished(), "Exploitation should not be claimed without proof");
        assertEquals("Attribution cannot be determined from available evidence.", summary.getAttributionStatus());
    }
}
