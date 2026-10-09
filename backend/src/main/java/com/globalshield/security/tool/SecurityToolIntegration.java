package com.globalshield.security.tool;

import java.util.List;

public interface SecurityToolIntegration {

    String getToolName();

    String getDisplayName();

    ToolCategory getCategory();

    ToolIntegrationType getIntegrationType();

    List<String> getSupportedOperations();

    ToolConfigurationRequirements getConfigurationRequirements();

    ToolHealthReport checkHealth();

    List<String> getKnownLimitations();
}
