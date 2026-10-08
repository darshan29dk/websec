package com.globalshield.ai.dto;

import java.util.ArrayList;
import java.util.List;

public class AiQuestionResponseDto {
    private String question;
    private String answer;
    private String confidenceBasis;
    private List<String> evidenceCitations = new ArrayList<>();
    private List<String> knowledgeCitations = new ArrayList<>();

    public AiQuestionResponseDto() {}

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getConfidenceBasis() { return confidenceBasis; }
    public void setConfidenceBasis(String confidenceBasis) { this.confidenceBasis = confidenceBasis; }

    public List<String> getEvidenceCitations() { return evidenceCitations; }
    public void setEvidenceCitations(List<String> evidenceCitations) { this.evidenceCitations = evidenceCitations; }

    public List<String> getKnowledgeCitations() { return knowledgeCitations; }
    public void setKnowledgeCitations(List<String> knowledgeCitations) { this.knowledgeCitations = knowledgeCitations; }
}
