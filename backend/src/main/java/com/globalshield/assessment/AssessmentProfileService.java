package com.globalshield.assessment;

import com.globalshield.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssessmentProfileService {

    private final AssessmentProfileRepository profileRepository;

    @Transactional(readOnly = true)
    public List<AssessmentProfileResponse> getActiveProfiles() {
        return profileRepository.findByEnabledTrue().stream()
                .map(AssessmentProfileResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public AssessmentProfileResponse getProfileById(UUID id) {
        AssessmentProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AssessmentProfile", "id", id));
        return AssessmentProfileResponse.fromEntity(profile);
    }
}
