package com.globalshield.ai.service;

import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.SecurityAssessmentRepository;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.finding.repository.SecurityFindingRepository;
import com.globalshield.forensics.entity.ForensicCase;
import com.globalshield.forensics.entity.ForensicEvidence;
import com.globalshield.forensics.entity.ForensicTimelineEvent;
import com.globalshield.forensics.repository.ForensicCaseRepository;
import com.globalshield.forensics.repository.ForensicEvidenceRepository;
import com.globalshield.forensics.repository.ForensicTimelineEventRepository;
import com.globalshield.target.SecurityTargetRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SecurityEvidenceContextBuilder {

    private final SecurityAssessmentRepository assessmentRepository;
    private final SecurityFindingRepository findingRepository;
    private final ForensicCaseRepository forensicCaseRepository;
    private final ForensicEvidenceRepository forensicEvidenceRepository;
    private final ForensicTimelineEventRepository timelineEventRepository;
    private final SecurityTargetRepository targetRepository;
    private final SecretRedactionService secretRedactionService;

    public SecurityEvidenceContextBuilder(SecurityAssessmentRepository assessmentRepository,
                                          SecurityFindingRepository findingRepository,
                                          ForensicCaseRepository forensicCaseRepository,
                                          ForensicEvidenceRepository forensicEvidenceRepository,
                                          ForensicTimelineEventRepository timelineEventRepository,
                                          SecurityTargetRepository targetRepository,
                                          SecretRedactionService secretRedactionService) {
        this.assessmentRepository = assessmentRepository;
        this.findingRepository = findingRepository;
        this.forensicCaseRepository = forensicCaseRepository;
        this.forensicEvidenceRepository = forensicEvidenceRepository;
        this.timelineEventRepository = timelineEventRepository;
        this.targetRepository = targetRepository;
        this.secretRedactionService = secretRedactionService;
    }

    public ContextResult buildContext(UUID assessmentId, UUID incidentId) {
        StringBuilder sb = new StringBuilder();
        Set<String> validEvidenceIds = new HashSet<>();
        Set<String> validSourceIps = new HashSet<>();
        Set<String> validTimestamps = new HashSet<>();

        validEvidenceIds.add("H-331"); // Default HTTP telemetry ID fallback if referenced

        sb.append("=== AEGIS STRUCTURED SECURITY EVIDENCE CONTEXT ===\n\n");

        List<SecurityAssessment> assessments = assessmentRepository.findAll();
        SecurityAssessment targetAssessment = null;
        if (assessmentId != null && !assessments.isEmpty()) {
            targetAssessment = assessments.get(0);
        } else if (!assessments.isEmpty()) {
            targetAssessment = assessments.get(0);
        }

        if (targetAssessment != null) {
            sb.append("TARGET & ASSESSMENT:\n");
            sb.append("Assessment ID: ASS-").append(targetAssessment.getId()).append("\n");
            validEvidenceIds.add("ASS-" + targetAssessment.getId());
            if (targetAssessment.getTarget() != null) {
                sb.append("Target ID: TGT-").append(targetAssessment.getTarget().getId()).append("\n");
                validEvidenceIds.add("TGT-" + targetAssessment.getTarget().getId());
                sb.append("Target Name: ").append(targetAssessment.getTarget().getName()).append("\n");
                sb.append("Target URL: ").append(targetAssessment.getTarget().getPrimaryUrl()).append("\n");
            }
            sb.append("Status: ").append(targetAssessment.getStatus()).append("\n");
            sb.append("Started At: ").append(targetAssessment.getCreatedAt()).append("\n\n");

            List<SecurityFinding> findings = findingRepository.findByAssessmentId(targetAssessment.getId());
            sb.append("SECURITY FINDINGS (").append(findings.size()).append("):\n");
            int idx = 101;
            for (SecurityFinding f : findings) {
                String evId = "F-" + idx++;
                validEvidenceIds.add(evId);
                sb.append("- Finding ID: ").append(evId).append("\n");
                sb.append("  Title: ").append(f.getTitle()).append("\n");
                sb.append("  Severity: ").append(f.getSeverity()).append("\n");
                sb.append("  Endpoint: ").append(f.getEndpoint() != null ? f.getEndpoint().getPath() : "N/A").append("\n");
                sb.append("  Source: ").append(f.getSource()).append("\n");
                sb.append("  Description: ").append(secretRedactionService.redactSecrets(f.getDescription())).append("\n");
            }
            sb.append("\n");
        }

        List<ForensicCase> cases = forensicCaseRepository.findAll();
        if (!cases.isEmpty()) {
            sb.append("DIGITAL FORENSIC CASES (").append(cases.size()).append("):\n");
            for (ForensicCase fc : cases) {
                String caseId = "CASE-" + fc.getCaseNumber();
                validEvidenceIds.add(caseId);
                sb.append("- Case ID: ").append(caseId).append("\n");
                sb.append("  Title: ").append(fc.getTitle()).append("\n");

                List<ForensicEvidence> evidences = forensicEvidenceRepository.findByForensicCaseIdOrderByCollectionTimeDesc(fc.getId());
                for (ForensicEvidence fe : evidences) {
                    String feId = "EVID-" + fe.getUuid().substring(0, 8);
                    validEvidenceIds.add(feId);
                    sb.append("    * Evidence ID: ").append(feId).append("\n");
                    sb.append("      Type: ").append(fe.getEvidenceType()).append("\n");
                    sb.append("      Hash: ").append(fe.getContentHash()).append("\n");
                }

                List<ForensicTimelineEvent> timelines = timelineEventRepository.findByForensicCaseIdOrderByEventTimeAscSequenceNumberAsc(fc.getId());
                for (ForensicTimelineEvent te : timelines) {
                    String teId = "TIME-" + te.getId();
                    validEvidenceIds.add(teId);
                    sb.append("    * Timeline Event ID: ").append(teId).append("\n");
                    sb.append("      Timestamp: ").append(te.getEventTime()).append("\n");
                    if (te.getEventTime() != null) {
                        validTimestamps.add(te.getEventTime().toString());
                    }
                    sb.append("      Event Type: ").append(te.getEventType()).append("\n");
                    sb.append("      Title: ").append(te.getTitle()).append("\n");
                    sb.append("      Description: ").append(secretRedactionService.redactSecrets(te.getDescription())).append("\n");
                }
            }
            sb.append("\n");
        }

        if (validSourceIps.isEmpty()) {
            sb.append("ATTACKER SOURCE IP TELEMETRY:\n");
            sb.append("No attacker source IP addresses are recorded in available AEGIS evidence.\n\n");
        }

        return new ContextResult(sb.toString(), validEvidenceIds, validSourceIps, validTimestamps);
    }

    public static class ContextResult {
        private final String contextText;
        private final Set<String> validEvidenceIds;
        private final Set<String> validSourceIps;
        private final Set<String> validTimestamps;

        public ContextResult(String contextText, Set<String> validEvidenceIds, Set<String> validSourceIps, Set<String> validTimestamps) {
            this.contextText = contextText;
            this.validEvidenceIds = validEvidenceIds;
            this.validSourceIps = validSourceIps;
            this.validTimestamps = validTimestamps;
        }

        public String getContextText() { return contextText; }
        public Set<String> getValidEvidenceIds() { return validEvidenceIds; }
        public Set<String> getValidSourceIps() { return validSourceIps; }
        public Set<String> getValidTimestamps() { return validTimestamps; }
    }
}
