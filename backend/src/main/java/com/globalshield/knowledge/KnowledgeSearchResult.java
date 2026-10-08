package com.globalshield.knowledge;

import java.util.UUID;

public class KnowledgeSearchResult {
    private Long documentId;
    private UUID documentUuid;
    private String title;
    private String source;
    private String sourceUrl;
    private String documentType;
    private Long chunkId;
    private UUID chunkUuid;
    private String contentExcerpt;
    private double relevanceScore;

    public KnowledgeSearchResult() {}

    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }

    public UUID getDocumentUuid() { return documentUuid; }
    public void setDocumentUuid(UUID documentUuid) { this.documentUuid = documentUuid; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public Long getChunkId() { return chunkId; }
    public void setChunkId(Long chunkId) { this.chunkId = chunkId; }

    public UUID getChunkUuid() { return chunkUuid; }
    public void setChunkUuid(UUID chunkUuid) { this.chunkUuid = chunkUuid; }

    public String getContentExcerpt() { return contentExcerpt; }
    public void setContentExcerpt(String contentExcerpt) { this.contentExcerpt = contentExcerpt; }

    public double getRelevanceScore() { return relevanceScore; }
    public void setRelevanceScore(double relevanceScore) { this.relevanceScore = relevanceScore; }
}
