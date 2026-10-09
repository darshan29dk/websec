package com.globalshield.event.telemetry;

import java.util.UUID;

public interface SiemConnector {
    String getConnectorName();
    boolean isConfigured();
    boolean testConnection();
    int syncEvents(UUID targetId);
    String getConfigurationStatus();
}
