package com.globalshield.finding.dto;

import com.globalshield.finding.entity.FindingComment;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class FindingCommentResponse {
    private UUID id;
    private UUID findingId;
    private UUID authorId;
    private String authorEmail;
    private String comment;
    private Instant createdAt;
    private Instant updatedAt;

    public static FindingCommentResponse fromEntity(FindingComment entity) {
        return FindingCommentResponse.builder()
                .id(entity.getId())
                .findingId(entity.getFinding() != null ? entity.getFinding().getId() : null)
                .authorId(entity.getAuthor() != null ? entity.getAuthor().getId() : null)
                .authorEmail(entity.getAuthorEmail())
                .comment(entity.getComment())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
