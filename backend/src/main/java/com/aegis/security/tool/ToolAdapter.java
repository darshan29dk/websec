package com.aegis.security.tool;

import com.aegis.assessment.AssessmentStage;
import com.aegis.assessment.SecurityAssessment;
import com.aegis.assessment.result.AssessmentAsset;
import com.aegis.assessment.result.AssessmentEndpoint;
import com.aegis.assessment.result.AssessmentObservation;

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
