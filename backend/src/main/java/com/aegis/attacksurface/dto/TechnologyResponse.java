package com.aegis.attacksurface.dto;

import com.aegis.attacksurface.entity.Technology;
import com.aegis.attacksurface.entity.TechnologyCategory;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TechnologyResponse {
    private UUID id;
    private UUID assessmentId;
    private String name;
    private TechnologyCategory category;
    private String version;
    private String confidence;
    private String source;
    private String evidence;
    private Instant firstSeenAt;
    private Instant lastSeenAt;

    public static TechnologyResponse fromEntity(Technology entity) {
        return TechnologyResponse.builder()
                .id(entity.getId())
                .assessmentId(entity.getAssessment() != null ? entity.getAssessment().getId() : null)
                .name(entity.getName())
                .category(entity.getCategory())
                .version(entity.getVersion())
                .confidence(entity.getConfidence())
                .source(entity.getSource())
                .evidence(entity.getEvidence())
                .firstSeenAt(entity.getFirstSeenAt())
                .lastSeenAt(entity.getLastSeenAt())
                .build();
    }
}
