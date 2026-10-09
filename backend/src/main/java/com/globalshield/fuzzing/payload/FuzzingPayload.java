package com.globalshield.fuzzing.payload;

import com.globalshield.fuzzing.entity.OwaspCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuzzingPayload {

    private String name;
    private String payloadType;
    private OwaspCategory owaspCategory;
    private String testValue;
    private String baselineValue;
    private String description;
    private String detectionSignature;
}
