package com.globalshield.knowledge;

import jakarta.validation.constraints.NotBlank;

public class KnowledgeIngestRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Source is required")
    private String source;

    private String sourceUrl;

    @NotBlank(message = "Document type is required")
    private String documentType;

    private String version;

    @NotBlank(message = "Content is required")
    private String content;

    public KnowledgeIngestRequest() {}

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

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
