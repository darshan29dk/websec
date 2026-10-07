package com.aegis.event;

import com.aegis.detection.DetectionEngine;
import com.aegis.detection.DetectionMatch;
import com.aegis.detection.DetectionMatchRepository;
import com.aegis.target.SecurityTarget;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class EventService {

    private final SecurityEventRepository securityEventRepository;
    private final HttpEventRepository httpEventRepository;
    private final NetworkEventRepository networkEventRepository;
    private final EventNormalizer eventNormalizer;
    private final DetectionEngine detectionEngine;
    private final DetectionMatchRepository detectionMatchRepository;

    public EventService(SecurityEventRepository securityEventRepository,
                        HttpEventRepository httpEventRepository,
                        NetworkEventRepository networkEventRepository,
                        EventNormalizer eventNormalizer,
                        DetectionEngine detectionEngine,
                        DetectionMatchRepository detectionMatchRepository) {
        this.securityEventRepository = securityEventRepository;
        this.httpEventRepository = httpEventRepository;
        this.networkEventRepository = networkEventRepository;
        this.eventNormalizer = eventNormalizer;
        this.detectionEngine = detectionEngine;
        this.detectionMatchRepository = detectionMatchRepository;
    }

    @Transactional
    public SecurityEvent ingestHttpEvent(HttpEventIngestRequest request) {
        SecurityTarget target = eventNormalizer.validateTarget(request.getTargetId());
        SecurityEvent securityEvent = eventNormalizer.normalizeHttpEvent(request, target);
        SecurityEvent savedSecurityEvent = securityEventRepository.save(securityEvent);

        HttpEvent httpEvent = eventNormalizer.buildHttpEvent(request, savedSecurityEvent);
        httpEventRepository.save(httpEvent);

        // Evaluate Detections
        detectionEngine.evaluateEvent(savedSecurityEvent, httpEvent, null);

        return savedSecurityEvent;
    }

    @Transactional
    public SecurityEvent ingestNetworkEvent(NetworkEventIngestRequest request) {
        SecurityTarget target = eventNormalizer.validateTarget(request.getTargetId());
        SecurityEvent securityEvent = eventNormalizer.normalizeNetworkEvent(request, target);
        SecurityEvent savedSecurityEvent = securityEventRepository.save(securityEvent);

        NetworkEvent netEvent = eventNormalizer.buildNetworkEvent(request, savedSecurityEvent);
        networkEventRepository.save(netEvent);

        // Evaluate Detections
        detectionEngine.evaluateEvent(savedSecurityEvent, null, netEvent);

        return savedSecurityEvent;
    }

    @Transactional
    public List<SecurityEvent> ingestBatch(BatchEventIngestRequest batchRequest) {
        List<SecurityEvent> ingested = new ArrayList<>();
        if (batchRequest.getHttpEvents() != null) {
            for (HttpEventIngestRequest req : batchRequest.getHttpEvents()) {
                ingested.add(ingestHttpEvent(req));
            }
        }
        if (batchRequest.getNetworkEvents() != null) {
            for (NetworkEventIngestRequest req : batchRequest.getNetworkEvents()) {
                ingested.add(ingestNetworkEvent(req));
            }
        }
        return ingested;
    }

    public Page<SecurityEvent> getEvents(int page, int size, UUID targetId, SecurityEventType eventType, EventSource source, String sourceIp, OffsetDateTime startTime, OffsetDateTime endTime) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "eventTime"));
        return securityEventRepository.findEventsFiltered(targetId, eventType, source, sourceIp, startTime, endTime, pageable);
    }

    public SecurityEvent getEventById(UUID id) {
        return securityEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Security event not found with ID: " + id));
    }

    public List<DetectionMatch> getDetectionsForEvent(UUID eventId) {
        return detectionMatchRepository.findByEventId(eventId);
    }
}
