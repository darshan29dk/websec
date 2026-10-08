package com.globalshield.event;

import com.globalshield.common.ApiResponse;
import com.globalshield.common.PageResponse;
import com.globalshield.detection.DetectionMatch;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping("/http")
    public ResponseEntity<ApiResponse<SecurityEvent>> ingestHttpEvent(@Valid @RequestBody HttpEventIngestRequest request) {
        SecurityEvent event = eventService.ingestHttpEvent(request);
        return ResponseEntity.ok(ApiResponse.success("HTTP security event ingested and evaluated successfully", event));
    }

    @PostMapping("/network")
    public ResponseEntity<ApiResponse<SecurityEvent>> ingestNetworkEvent(@Valid @RequestBody NetworkEventIngestRequest request) {
        SecurityEvent event = eventService.ingestNetworkEvent(request);
        return ResponseEntity.ok(ApiResponse.success("Network security event ingested and evaluated successfully", event));
    }

    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<List<SecurityEvent>>> ingestBatch(@RequestBody BatchEventIngestRequest request) {
        List<SecurityEvent> events = eventService.ingestBatch(request);
        return ResponseEntity.ok(ApiResponse.success("Batch security events ingested successfully (" + events.size() + " events)", events));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<SecurityEvent>>> getEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID targetId,
            @RequestParam(required = false) SecurityEventType eventType,
            @RequestParam(required = false) EventSource source,
            @RequestParam(required = false) String sourceIp,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endTime
    ) {
        Page<SecurityEvent> eventPage = eventService.getEvents(page, size, targetId, eventType, source, sourceIp, startTime, endTime);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(eventPage)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SecurityEvent>> getEventById(@PathVariable UUID id) {
        SecurityEvent event = eventService.getEventById(id);
        return ResponseEntity.ok(ApiResponse.success(event));
    }

    @GetMapping("/{id}/detections")
    public ResponseEntity<ApiResponse<List<DetectionMatch>>> getDetectionsForEvent(@PathVariable UUID id) {
        List<DetectionMatch> matches = eventService.getDetectionsForEvent(id);
        return ResponseEntity.ok(ApiResponse.success(matches));
    }
}
