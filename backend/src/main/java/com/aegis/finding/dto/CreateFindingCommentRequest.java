package com.aegis.finding.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateFindingCommentRequest {
    @NotBlank(message = "Comment text is mandatory")
    private String comment;
}
