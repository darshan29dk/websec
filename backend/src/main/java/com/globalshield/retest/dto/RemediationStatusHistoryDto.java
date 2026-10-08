package com.globalshield.retest.dto;

import com.globalshield.retest.entity.RemediationStatusHistory;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class RemediationStatusHistoryDto {
    private String id;
    private String uuid;
    private String findingId;
    private String previousStatus;
    private String newStatus;
    private String changedBy;
    private String reason;
    private String source;
    private OffsetDateTime createdAt;

    public static RemediationStatusHistoryDto fromEntity(RemediationStatusHistory rsh) {
        if (rsh == null) return null;
        return RemediationStatusHistoryDto.builder()
                .id(rsh.getId() != null ? rsh.getId().toString() : null)
                .uuid(rsh.getUuid())
                .findingId(rsh.getFinding() != null && rsh.getFinding().getId() != null ? rsh.getFinding().getId().toString() : null)
                .previousStatus(rsh.getPreviousStatus())
                .newStatus(rsh.getNewStatus())
                .changedBy(rsh.getChangedBy())
                .reason(rsh.getReason())
                .source(rsh.getSource())
                .createdAt(rsh.getCreatedAt())
                .build();
    }
}
