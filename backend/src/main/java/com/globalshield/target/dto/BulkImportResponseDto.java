package com.globalshield.target.dto;

import com.globalshield.target.TargetResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportResponseDto {

    private int totalRecords;
    private int importedCount;
    private int duplicateCount;
    private int skippedCount;
    private int failedCount;

    @Builder.Default
    private List<TargetResponse> successfulRecords = new ArrayList<>();

    @Builder.Default
    private List<BulkImportConflictDto> duplicateRecords = new ArrayList<>();

    @Builder.Default
    private List<BulkImportFailureDto> failedRecords = new ArrayList<>();

    private String summary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkImportConflictDto {
        private String name;
        private String primaryUrl;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkImportFailureDto {
        private String name;
        private String primaryUrl;
        private String error;
    }
}
