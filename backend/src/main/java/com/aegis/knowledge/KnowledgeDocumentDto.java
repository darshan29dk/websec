package com.aegis.knowledge;

import java.time.OffsetDateTime;
import java.util.UUID;

public class KnowledgeDocumentDto {
    private Long id;
    private UUID uuid;
    private String title;
    private String source;
    private String sourceUrl;
    private String documentType;
    private String version;
    private OffsetDateTime publishedAt;
    private OffsetDateTime retrievedAt;
    private String status;
    private String content;
    private String contentHash;
    private int chunkCount;
    private OffsetDateTime createdAt;

    public KnowledgeDocumentDto() {}

    public static KnowledgeDocumentDto fromEntity(KnowledgeDocument doc, int chunkCount) {
        KnowledgeDocumentDto dto = new KnowledgeDocumentDto();
        dto.id = doc.getId();
        dto.uuid = doc.getUuid();
        dto.title = doc.getTitle();
        dto.source = doc.getSource();
        dto.sourceUrl = doc.getSourceUrl();
        dto.documentType = doc.getDocumentType();
        dto.version = doc.getVersion();
        dto.publishedAt = doc.getPublishedAt();
        dto.retrievedAt = doc.getRetrievedAt();
        dto.status = doc.getStatus();
        dto.content = doc.getContent();
        dto.contentHash = doc.getContentHash();
        dto.chunkCount = chunkCount;
        dto.createdAt = doc.getCreatedAt();
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UUID getUuid() { return uuid; }
    public void setUuid(UUID uuid) { this.uuid = uuid; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public OffsetDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(OffsetDateTime publishedAt) { this.publishedAt = publishedAt; }

    public OffsetDateTime getRetrievedAt() { return retrievedAt; }
    public void setRetrievedAt(OffsetDateTime retrievedAt) { this.retrievedAt = retrievedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getContentHash() { return contentHash; }
    public void setContentHash(String contentHash) { this.contentHash = contentHash; }

    public int getChunkCount() { return chunkCount; }
    public void setChunkCount(int chunkCount) { this.chunkCount = chunkCount; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
