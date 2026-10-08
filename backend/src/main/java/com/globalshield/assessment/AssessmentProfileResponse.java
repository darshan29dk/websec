package com.globalshield.assessment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentProfileResponse {
    private UUID id;
    private String name;
    private String description;
    private ProfileType profileType;
    private boolean enabled;
    private Instant createdAt;

    public static AssessmentProfileResponse fromEntity(AssessmentProfile profile) {
        if (profile == null) return null;
        return AssessmentProfileResponse.builder()
                .id(profile.getId())
                .name(profile.getName())
                .description(profile.getDescription())
                .profileType(profile.getProfileType())
                .enabled(profile.isEnabled())
                .createdAt(profile.getCreatedAt())
                .build();
    }
}
