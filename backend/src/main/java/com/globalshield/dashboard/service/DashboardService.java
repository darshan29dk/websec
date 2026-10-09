package com.globalshield.dashboard.service;

import com.globalshield.assessment.AssessmentStatus;
import com.globalshield.assessment.SecurityAssessmentRepository;
import com.globalshield.attacksurface.repository.WebEndpointRepository;
import com.globalshield.audit.AuditEvent;
import com.globalshield.audit.AuditEventRepository;
import com.globalshield.dashboard.dto.GlobalDashboardChartsDto;
import com.globalshield.dashboard.dto.GlobalDashboardOverviewDto;
import com.globalshield.finding.entity.FindingSeverity;
import com.globalshield.finding.entity.FindingStatus;
import com.globalshield.finding.entity.SecurityFinding;
import com.globalshield.finding.repository.SecurityFindingRepository;
import com.globalshield.incident.IncidentStatus;
import com.globalshield.incident.SecurityIncidentRepository;
import com.globalshield.monitoring.entity.MonitoringConfiguration;
import com.globalshield.monitoring.repository.MonitoringConfigurationRepository;
import com.globalshield.retest.entity.RetestStatus;
import com.globalshield.retest.repository.RetestRepository;
import com.globalshield.target.SecurityTarget;
import com.globalshield.target.SecurityTargetRepository;
import com.globalshield.target.TargetRiskCalculationService;
import com.globalshield.target.TargetStatus;
import com.globalshield.target.dto.TargetRiskEvaluationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final SecurityTargetRepository targetRepository;
    private final TargetRiskCalculationService riskCalculationService;
    private final SecurityFindingRepository findingRepository;
    private final SecurityAssessmentRepository assessmentRepository;
    private final SecurityIncidentRepository incidentRepository;
    private final MonitoringConfigurationRepository monitoringRepository;
    private final RetestRepository retestRepository;
    private final WebEndpointRepository endpointRepository;
    private final AuditEventRepository auditEventRepository;

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMM yyyy").withZone(ZoneId.of("UTC"));

    @Transactional(readOnly = true)
    public GlobalDashboardOverviewDto getGlobalOverview() {
        List<SecurityTarget> activeTargets = targetRepository.findAll().stream()
                .filter(t -> t.getStatus() != TargetStatus.ARCHIVED)
                .toList();

        long totalWebsites = activeTargets.size();
        long criticalRiskWebsites = 0;
        long highRiskWebsites = 0;
        long mediumRiskWebsites = 0;
        long lowRiskWebsites = 0;
        long unassessedWebsites = 0;

        List<Integer> assessedScores = new ArrayList<>();

        for (SecurityTarget target : activeTargets) {
            TargetRiskEvaluationDto eval = riskCalculationService.evaluateTargetRisk(target.getId());
            switch (eval.getRiskCategory()) {
                case "CRITICAL" -> criticalRiskWebsites++;
                case "HIGH" -> highRiskWebsites++;
                case "MEDIUM" -> mediumRiskWebsites++;
                case "LOW" -> lowRiskWebsites++;
                default -> unassessedWebsites++;
            }
            if (eval.getRiskScore() != null) {
                assessedScores.add(eval.getRiskScore());
            }
        }

        Integer overallPostureScore = null;
        String overallPostureStatus = "NOT_ASSESSED";
        if (!assessedScores.isEmpty()) {
            double avg = assessedScores.stream().mapToInt(Integer::intValue).average().orElse(0.0);
            overallPostureScore = (int) Math.round(avg);
            if (overallPostureScore >= 80) overallPostureStatus = "STRONG";
            else if (overallPostureScore >= 60) overallPostureStatus = "WARNING";
            else overallPostureStatus = "AT_RISK";
        }

        // Findings calculations
        List<SecurityFinding> allFindings = findingRepository.findAll();
        List<SecurityFinding> openFindings = allFindings.stream()
                .filter(f -> f.getStatus() != FindingStatus.RESOLVED &&
                             f.getStatus() != FindingStatus.FIXED &&
                             f.getStatus() != FindingStatus.FALSE_POSITIVE)
                .toList();

        long totalUniqueOpenFindings = openFindings.size();
        long criticalOpenFindings = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.CRITICAL).count();
        long highOpenFindings = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.HIGH).count();
        long mediumOpenFindings = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.MEDIUM).count();
        long lowOpenFindings = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.LOW || f.getSeverity() == FindingSeverity.INFO).count();
        long findingsResolved = allFindings.stream().filter(f -> f.getStatus() == FindingStatus.RESOLVED || f.getStatus() == FindingStatus.FIXED).count();

        // Retest verified fixes
        long verifiedFixes = retestRepository.countByStatus(RetestStatus.COMPLETED);

        // Discovered endpoints
        long totalDiscoveredEndpoints = endpointRepository.count();

        // Assessments by status
        Map<String, Long> assessmentsByStatus = new HashMap<>();
        for (AssessmentStatus st : AssessmentStatus.values()) {
            long count = assessmentRepository.countByStatus(st);
            if (count > 0) {
                assessmentsByStatus.put(st.name(), count);
            }
        }

        // Incidents by status
        Map<String, Long> incidentsByStatus = new HashMap<>();
        long totalIncidents = incidentRepository.count();
        for (IncidentStatus st : IncidentStatus.values()) {
            long c = incidentRepository.findAll().stream().filter(i -> i.getStatus() == st).count();
            if (c > 0) {
                incidentsByStatus.put(st.name(), c);
            }
        }

        boolean telemetryConfigured = totalIncidents > 0;
        String telemetryStatusMessage = telemetryConfigured
                ? "Active telemetry sensors connected. " + totalIncidents + " event(s) recorded."
                : "Observed attack telemetry is not configured. Configure telemetry/SIEM integration to observe live attacks.";

        // Monitoring
        List<MonitoringConfiguration> allConfigs = monitoringRepository.findAll();
        long monitoringActiveCount = allConfigs.stream().filter(MonitoringConfiguration::isEnabled).count();
        double monitoringCoveragePercent = totalWebsites > 0
                ? Math.round(((double) monitoringActiveCount / totalWebsites) * 1000.0) / 10.0
                : 0.0;

        String latestMonitoringStatus = monitoringActiveCount > 0
                ? monitoringActiveCount + " website(s) actively monitored"
                : "No continuous monitoring schedules active";

        return GlobalDashboardOverviewDto.builder()
                .totalWebsites(totalWebsites)
                .criticalRiskWebsites(criticalRiskWebsites)
                .highRiskWebsites(highRiskWebsites)
                .mediumRiskWebsites(mediumRiskWebsites)
                .lowRiskWebsites(lowRiskWebsites)
                .unassessedWebsites(unassessedWebsites)
                .totalDiscoveredEndpoints(totalDiscoveredEndpoints)
                .totalUniqueOpenFindings(totalUniqueOpenFindings)
                .criticalOpenFindings(criticalOpenFindings)
                .highOpenFindings(highOpenFindings)
                .mediumOpenFindings(mediumOpenFindings)
                .lowOpenFindings(lowOpenFindings)
                .findingsResolved(findingsResolved)
                .verifiedFixes(verifiedFixes)
                .assessmentsByStatus(assessmentsByStatus)
                .incidentsByStatus(incidentsByStatus)
                .telemetryConfigured(telemetryConfigured)
                .telemetryStatusMessage(telemetryStatusMessage)
                .monitoringActiveCount(monitoringActiveCount)
                .monitoringCoveragePercent(monitoringCoveragePercent)
                .latestMonitoringStatus(latestMonitoringStatus)
                .overallPostureScore(overallPostureScore)
                .overallPostureStatus(overallPostureStatus)
                .riskCalculationMethodology("Critical Finding Override enabled: Any website with >=1 open confirmed Critical vulnerability is forced to CRITICAL risk. Weights: Critical=25, High=15, Medium=5, Low=1.")
                .build();
    }

    @Transactional(readOnly = true)
    public GlobalDashboardChartsDto getGlobalCharts() {
        List<SecurityTarget> activeTargets = targetRepository.findAll().stream()
                .filter(t -> t.getStatus() != TargetStatus.ARCHIVED)
                .toList();

        long totalWebsites = activeTargets.size();

        // 1. Website risk distribution
        Map<String, Long> riskCounts = new LinkedHashMap<>();
        riskCounts.put("CRITICAL", 0L);
        riskCounts.put("HIGH", 0L);
        riskCounts.put("MEDIUM", 0L);
        riskCounts.put("LOW", 0L);
        riskCounts.put("NOT_ASSESSED", 0L);

        List<GlobalDashboardChartsDto.HighestRiskWebsiteItem> targetRiskItems = new ArrayList<>();

        for (SecurityTarget target : activeTargets) {
            TargetRiskEvaluationDto eval = riskCalculationService.evaluateTargetRisk(target.getId());
            String cat = eval.getRiskCategory();
            riskCounts.put(cat, riskCounts.getOrDefault(cat, 0L) + 1);

            targetRiskItems.add(GlobalDashboardChartsDto.HighestRiskWebsiteItem.builder()
                    .targetId(target.getId())
                    .name(target.getName())
                    .primaryUrl(target.getPrimaryUrl())
                    .riskCategory(cat)
                    .riskScore(eval.getRiskScore())
                    .openCriticalFindings(eval.getOpenCriticalCount())
                    .openHighFindings(eval.getOpenHighCount())
                    .build());
        }

        List<GlobalDashboardChartsDto.RiskDistributionItem> riskDistribution = new ArrayList<>();
        for (Map.Entry<String, Long> e : riskCounts.entrySet()) {
            double pct = totalWebsites > 0 ? Math.round(((double) e.getValue() / totalWebsites) * 1000.0) / 10.0 : 0.0;
            riskDistribution.add(GlobalDashboardChartsDto.RiskDistributionItem.builder()
                    .category(e.getKey())
                    .count(e.getValue())
                    .percentage(pct)
                    .build());
        }

        // 2. Open findings by severity
        List<SecurityFinding> allFindings = findingRepository.findAll();
        List<SecurityFinding> openFindings = allFindings.stream()
                .filter(f -> f.getStatus() != FindingStatus.RESOLVED &&
                             f.getStatus() != FindingStatus.FIXED &&
                             f.getStatus() != FindingStatus.FALSE_POSITIVE)
                .toList();

        long critCount = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.CRITICAL).count();
        long highCount = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.HIGH).count();
        long medCount = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.MEDIUM).count();
        long lowCount = openFindings.stream().filter(f -> f.getSeverity() == FindingSeverity.LOW || f.getSeverity() == FindingSeverity.INFO).count();

        List<GlobalDashboardChartsDto.SeverityDistributionItem> findingsBySeverity = List.of(
                new GlobalDashboardChartsDto.SeverityDistributionItem("CRITICAL", critCount),
                new GlobalDashboardChartsDto.SeverityDistributionItem("HIGH", highCount),
                new GlobalDashboardChartsDto.SeverityDistributionItem("MEDIUM", medCount),
                new GlobalDashboardChartsDto.SeverityDistributionItem("LOW", lowCount)
        );

        // 3. Highest-risk websites (Top 5)
        targetRiskItems.sort((a, b) -> {
            int scoreA = a.getRiskScore() != null ? a.getRiskScore() : 999;
            int scoreB = b.getRiskScore() != null ? b.getRiskScore() : 999;
            // Lower score means higher risk
            return Integer.compare(scoreA, scoreB);
        });
        List<GlobalDashboardChartsDto.HighestRiskWebsiteItem> highestRiskWebsites = targetRiskItems.stream()
                .filter(i -> !"NOT_ASSESSED".equals(i.getRiskCategory()))
                .limit(5)
                .toList();

        // 4. Timeline trend (Discovered vs Resolved over time)
        Map<String, long[]> timelineBuckets = new TreeMap<>();
        for (SecurityFinding f : allFindings) {
            if (f.getFirstSeenAt() != null) {
                String period = MONTH_FORMATTER.format(f.getFirstSeenAt());
                timelineBuckets.computeIfAbsent(period, k -> new long[2])[0]++;
            }
            if (f.getStatus() == FindingStatus.RESOLVED || f.getStatus() == FindingStatus.FIXED) {
                if (f.getUpdatedAt() != null) {
                    String period = MONTH_FORMATTER.format(f.getUpdatedAt());
                    timelineBuckets.computeIfAbsent(period, k -> new long[2])[1]++;
                }
            }
        }
        List<GlobalDashboardChartsDto.TimelineTrendItem> findingsTimeline = new ArrayList<>();
        if (timelineBuckets.isEmpty()) {
            findingsTimeline.add(new GlobalDashboardChartsDto.TimelineTrendItem("Recent", openFindings.size(), allFindings.size() - openFindings.size()));
        } else {
            for (Map.Entry<String, long[]> entry : timelineBuckets.entrySet()) {
                findingsTimeline.add(new GlobalDashboardChartsDto.TimelineTrendItem(entry.getKey(), entry.getValue()[0], entry.getValue()[1]));
            }
        }

        // 5. Assessment statuses
        List<GlobalDashboardChartsDto.StatusCountItem> assessmentStatuses = new ArrayList<>();
        for (AssessmentStatus status : AssessmentStatus.values()) {
            long count = assessmentRepository.countByStatus(status);
            if (count > 0) {
                assessmentStatuses.add(new GlobalDashboardChartsDto.StatusCountItem(status.name(), count));
            }
        }

        // 6. Remediation and retest outcomes
        List<GlobalDashboardChartsDto.StatusCountItem> retestOutcomes = new ArrayList<>();
        for (RetestStatus st : RetestStatus.values()) {
            long count = retestRepository.countByStatus(st);
            if (count > 0) {
                retestOutcomes.add(new GlobalDashboardChartsDto.StatusCountItem(st.name(), count));
            }
        }

        // 7. Posture trend items (derived from assessed targets)
        List<GlobalDashboardChartsDto.PostureTrendItem> postureTrends = new ArrayList<>();
        if (!activeTargets.isEmpty()) {
            for (SecurityTarget target : activeTargets) {
                TargetRiskEvaluationDto eval = riskCalculationService.evaluateTargetRisk(target.getId());
                if (eval.getRiskScore() != null) {
                    postureTrends.add(new GlobalDashboardChartsDto.PostureTrendItem(target.getName(), eval.getRiskScore()));
                }
            }
        }

        // 8. Recent verified security activity
        List<GlobalDashboardChartsDto.RecentSecurityActivityItem> recentActivity = new ArrayList<>();
        List<AuditEvent> recentAudits = auditEventRepository.findAll(
                PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();

        for (AuditEvent event : recentAudits) {
            recentActivity.add(GlobalDashboardChartsDto.RecentSecurityActivityItem.builder()
                    .eventType(event.getEventType() != null ? event.getEventType().name() : "SECURITY_EVENT")
                    .description(event.getDetails() != null ? event.getDetails() : event.getAction())
                    .targetName(event.getResourceType() + " #" + (event.getResourceId() != null && event.getResourceId().length() > 8 ? event.getResourceId().substring(0, 8) : event.getResourceId()))
                    .timestamp(event.getCreatedAt() != null ? event.getCreatedAt().toString() : "")
                    .build());
        }

        return GlobalDashboardChartsDto.builder()
                .riskDistribution(riskDistribution)
                .findingsBySeverity(findingsBySeverity)
                .highestRiskWebsites(highestRiskWebsites)
                .findingsTimeline(findingsTimeline)
                .assessmentStatuses(assessmentStatuses)
                .remediationRetestOutcomes(retestOutcomes)
                .postureTrends(postureTrends)
                .recentSecurityActivity(recentActivity)
                .build();
    }
}
