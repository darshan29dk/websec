package com.globalshield.security.tool;

import com.globalshield.assessment.AssessmentStage;
import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.result.AssessmentAsset;
import com.globalshield.assessment.result.AssessmentEndpoint;
import com.globalshield.assessment.result.AssessmentObservation;

import java.util.List;

public interface ToolAdapter {

    String getToolName();

    AssessmentStage getStage();

    boolean isAvailable();

    ToolExecutionResult execute(ToolExecutionRequest request);

    List<AssessmentAsset> parseAssets(SecurityAssessment assessment, ToolExecutionResult result);

    List<AssessmentEndpoint> parseEndpoints(SecurityAssessment assessment, ToolExecutionResult result);

    List<AssessmentObservation> parseObservations(SecurityAssessment assessment, ToolExecutionResult result);
}
