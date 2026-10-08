package com.globalshield.ai.dto;

import jakarta.validation.constraints.NotBlank;

public class AiQuestionRequestDto {

    @NotBlank(message = "Question text is required")
    private String question;

    public AiQuestionRequestDto() {}

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
}
