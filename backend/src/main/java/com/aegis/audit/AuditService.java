package com.aegis.audit;

import com.aegis.common.PageResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditEventRepository auditEventRepository;

    @Transactional
    public void logEvent(
            UUID actorUserId,
            String actorEmail,
            AuditEventType eventType,
            String resourceType,
            String resourceId,
            String action,
            String details,
            String ipAddress,
            String userAgent) {

        try {
            AuditEvent event = AuditEvent.builder()
                    .actorUserId(actorUserId)
                    .actorEmail(actorEmail)
                    .eventType(eventType)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .action(action)
                    .details(details)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            auditEventRepository.save(event);
            log.info("Audit logged: [{}] action={} actor={} resource={}:{}", 
                    eventType, action, actorEmail, resourceType, resourceId);
        } catch (Exception e) {
            log.error("Failed to log audit event: {}", e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditEventResponse> getAuditEvents(
            int page,
            int size,
            String userEmail,
            AuditEventType eventType,
            String resourceType,
            String search) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<AuditEvent> eventsPage;
        if (userEmail == null && eventType == null && resourceType == null && search == null) {
            eventsPage = auditEventRepository.findAll(pageRequest);
        } else {
            eventsPage = auditEventRepository.searchAuditEvents(userEmail, eventType, resourceType, search, pageRequest);
        }

        Page<AuditEventResponse> dtoPage = eventsPage.map(AuditEventResponse::fromEntity);
        return PageResponse.from(dtoPage);
    }
}
