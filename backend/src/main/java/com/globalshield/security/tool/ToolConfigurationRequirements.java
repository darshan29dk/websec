package com.globalshield.security.tool;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ToolConfigurationRequirements {
    private String toolName;
    private List<String> requiredEnvironmentVariables;
    private List<String> requiredSystemBinaries;
    private boolean requiresNetworkAccess;
    private boolean requiresElevatedPrivileges;
    private String configurationGuide;
}
