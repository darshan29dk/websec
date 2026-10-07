package com.aegis.event;

import java.util.ArrayList;
import java.util.List;

public class BatchEventIngestRequest {

    private List<HttpEventIngestRequest> httpEvents = new ArrayList<>();
    private List<NetworkEventIngestRequest> networkEvents = new ArrayList<>();

    public BatchEventIngestRequest() {
    }

    public List<HttpEventIngestRequest> getHttpEvents() {
        return httpEvents;
    }
    public void setHttpEvents(List<HttpEventIngestRequest> httpEvents) {
        this.httpEvents = httpEvents;
    }

    public List<NetworkEventIngestRequest> getNetworkEvents() {
        return networkEvents;
    }
    public void setNetworkEvents(List<NetworkEventIngestRequest> networkEvents) {
        this.networkEvents = networkEvents;
    }
}
