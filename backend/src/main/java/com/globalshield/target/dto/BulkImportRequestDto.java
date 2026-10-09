package com.globalshield.target.dto;

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
public class BulkImportRequestDto {

    private String csvContent;

    @Builder.Default
    private List<BulkImportEntryDto> entries = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkImportEntryDto {
        private String name;
        private String primaryUrl;
        private String description;
    }
}
