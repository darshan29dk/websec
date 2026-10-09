package com.globalshield.fuzzing.analysis;

import com.globalshield.finding.entity.FindingConfidence;
import com.globalshield.fuzzing.entity.TestResultClassification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuzzingAnalysisResult {

    private TestResultClassification classification;
    private FindingConfidence confidence;
    private String diffSummary;
    private String anomalyDetails;
    private boolean findingWarranted;
    private String findingTitle;
    private String findingDescription;
    private String findingSeverity;
}
