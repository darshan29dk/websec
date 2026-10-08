package com.globalshield.knowledge;

import com.globalshield.ai.embedding.EmbeddingProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class KnowledgeService {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeService.class);

    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeChunkRepository chunkRepository;
    private final EmbeddingProvider embeddingProvider;
    private final ObjectMapper objectMapper;

    public KnowledgeService(KnowledgeDocumentRepository documentRepository,
                            KnowledgeChunkRepository chunkRepository,
                            EmbeddingProvider embeddingProvider) {
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.embeddingProvider = embeddingProvider;
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void init() {
        seedAuthoritativeKnowledge();
    }

    @Transactional
    public KnowledgeDocumentDto ingestDocument(KnowledgeIngestRequest request) {
        String contentHash = computeHash(request.getContent());

        Optional<KnowledgeDocument> existing = documentRepository.findByContentHash(contentHash);
        if (existing.isPresent()) {
            KnowledgeDocument doc = existing.get();
            int chunkCount = chunkRepository.findByDocumentIdOrderByChunkIndexAsc(doc.getId()).size();
            return KnowledgeDocumentDto.fromEntity(doc, chunkCount);
        }

        KnowledgeDocument doc = new KnowledgeDocument();
        doc.setTitle(request.getTitle());
        doc.setSource(request.getSource());
        doc.setSourceUrl(request.getSourceUrl());
        doc.setDocumentType(request.getDocumentType());
        doc.setVersion(request.getVersion() != null ? request.getVersion() : "1.0");
        doc.setContent(request.getContent());
        doc.setContentHash(contentHash);
        doc.setRetrievedAt(OffsetDateTime.now());
        doc.setStatus("ACTIVE");

        doc = documentRepository.save(doc);

        List<String> chunks = chunkText(request.getContent(), 1000);
        int index = 0;
        for (String chunkContent : chunks) {
            KnowledgeChunk chunk = new KnowledgeChunk();
            chunk.setDocument(doc);
            chunk.setChunkIndex(index++);
            chunk.setContent(chunkContent);
            chunk.setTokenCount(chunkContent.split("\\s+").length);

            float[] vec = embeddingProvider.embed(chunkContent);
            chunk.setEmbedding(Arrays.toString(vec));

            Map<String, String> meta = Map.of(
                "title", doc.getTitle(),
                "source", doc.getSource(),
                "documentType", doc.getDocumentType()
            );
            try {
                chunk.setMetadata(objectMapper.writeValueAsString(meta));
            } catch (Exception e) {
                chunk.setMetadata("{}");
            }

            chunkRepository.save(chunk);
        }

        return KnowledgeDocumentDto.fromEntity(doc, chunks.size());
    }

    @Transactional(readOnly = true)
    public List<KnowledgeDocumentDto> getAllDocuments() {
        return documentRepository.findAll().stream().map(doc -> {
            int chunkCount = chunkRepository.findByDocumentIdOrderByChunkIndexAsc(doc.getId()).size();
            return KnowledgeDocumentDto.fromEntity(doc, chunkCount);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<KnowledgeDocumentDto> getDocumentByUuid(UUID uuid) {
        return documentRepository.findByUuid(uuid).map(doc -> {
            int chunkCount = chunkRepository.findByDocumentIdOrderByChunkIndexAsc(doc.getId()).size();
            return KnowledgeDocumentDto.fromEntity(doc, chunkCount);
        });
    }

    @Transactional(readOnly = true)
    public List<KnowledgeSearchResult> searchKnowledge(String query, String sourceFilter, String typeFilter, int limit) {
        if (query == null || query.isBlank()) {
            query = "security";
        }
        int maxResults = limit > 0 ? limit : 10;

        List<KnowledgeChunk> candidateChunks;
        String[] keywords = query.toLowerCase().split("\\s+");

        Set<KnowledgeChunk> matchSet = new HashSet<>();
        for (String kw : keywords) {
            if (kw.length() > 2) {
                matchSet.addAll(chunkRepository.findByKeyword(kw));
            }
        }

        if (matchSet.isEmpty()) {
            candidateChunks = chunkRepository.findAll();
        } else {
            candidateChunks = new ArrayList<>(matchSet);
        }

        float[] queryEmbedding = embeddingProvider.embed(query);

        List<KnowledgeSearchResult> results = new ArrayList<>();
        for (KnowledgeChunk chunk : candidateChunks) {
            KnowledgeDocument doc = chunk.getDocument();

            if (sourceFilter != null && !sourceFilter.isBlank() && !doc.getSource().equalsIgnoreCase(sourceFilter)) {
                continue;
            }
            if (typeFilter != null && !typeFilter.isBlank() && !doc.getDocumentType().equalsIgnoreCase(typeFilter)) {
                continue;
            }

            double similarity = calculateCosineSimilarity(queryEmbedding, parseEmbedding(chunk.getEmbedding()));

            String contentLower = chunk.getContent().toLowerCase();
            String queryLower = query.toLowerCase();
            if (contentLower.contains(queryLower)) {
                similarity += 0.3;
            }

            KnowledgeSearchResult res = new KnowledgeSearchResult();
            res.setDocumentId(doc.getId());
            res.setDocumentUuid(doc.getUuid());
            res.setTitle(doc.getTitle());
            res.setSource(doc.getSource());
            res.setSourceUrl(doc.getSourceUrl());
            res.setDocumentType(doc.getDocumentType());
            res.setChunkId(chunk.getId());
            res.setChunkUuid(chunk.getUuid());
            res.setContentExcerpt(chunk.getContent().length() > 300 ? chunk.getContent().substring(0, 300) + "..." : chunk.getContent());
            res.setRelevanceScore(Math.min(1.0, Math.max(0.0, similarity)));
            results.add(res);
        }

        results.sort((a, b) -> Double.compare(b.getRelevanceScore(), a.getRelevanceScore()));
        return results.stream().limit(maxResults).collect(Collectors.toList());
    }

    private String computeHash(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
    }

    private List<String> chunkText(String text, int maxChunkLength) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) return chunks;

        int length = text.length();
        for (int i = 0; i < length; i += maxChunkLength) {
            chunks.add(text.substring(i, Math.min(length, i + maxChunkLength)));
        }
        return chunks;
    }

    private float[] parseEmbedding(String str) {
        if (str == null || !str.startsWith("[")) {
            return new float[embeddingProvider.getDimension()];
        }
        try {
            String[] parts = str.substring(1, str.length() - 1).split(",");
            float[] vec = new float[parts.length];
            for (int i = 0; i < parts.length; i++) {
                vec[i] = Float.parseFloat(parts[i].trim());
            }
            return vec;
        } catch (Exception e) {
            return new float[embeddingProvider.getDimension()];
        }
    }

    private double calculateCosineSimilarity(float[] v1, float[] v2) {
        if (v1 == null || v2 == null || v1.length != v2.length || v1.length == 0) return 0.0;
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < v1.length; i++) {
            dotProduct += v1[i] * v2[i];
            normA += v1[i] * v1[i];
            normB += v2[i] * v2[i];
        }
        if (normA == 0.0 || normB == 0.0) return 0.0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    @Transactional
    public void seedAuthoritativeKnowledge() {
        if (documentRepository.count() > 0) return;

        log.info("Seeding authoritative security knowledge base (OWASP, CWE, TLS)...");

        KnowledgeIngestRequest sqli = new KnowledgeIngestRequest();
        sqli.setTitle("CWE-89: Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection')");
        sqli.setSource("CWE / MITRE");
        sqli.setSourceUrl("https://cwe.mitre.org/data/definitions/89.html");
        sqli.setDocumentType("VULNERABILITY_GUIDANCE");
        sqli.setVersion("4.13");
        sqli.setContent("SQL Injection occurs when software constructs all or part of an SQL command using externally-influenced input, without neutralizing special elements. Attackers can execute arbitrary SQL commands to breach database confidentiality, alter data, or execute administrative operations. Remediation requires parameterized queries (PreparedStatements) and strict input validation.");
        ingestDocument(sqli);

        KnowledgeIngestRequest owaspInjection = new KnowledgeIngestRequest();
        owaspInjection.setTitle("OWASP Top 10 A03:2021 - Injection");
        owaspInjection.setSource("OWASP Foundation");
        owaspInjection.setSourceUrl("https://owasp.org/Top10/A03_2021-Injection/");
        owaspInjection.setDocumentType("SECURITY_STANDARD");
        owaspInjection.setVersion("2021");
        owaspInjection.setContent("Injection vulnerabilities occur when untrusted user input is supplied to an interpreter as part of a command or query. Common types include SQL, NoSQL, OS Command, and LDAP injection. Prevention strategies: 1. Use secure APIs that avoid interpreters. 2. Use positive/allow-list server-side input validation. 3. Escape special characters.");
        ingestDocument(owaspInjection);

        KnowledgeIngestRequest xss = new KnowledgeIngestRequest();
        xss.setTitle("CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')");
        xss.setSource("CWE / MITRE");
        xss.setSourceUrl("https://cwe.mitre.org/data/definitions/79.html");
        xss.setDocumentType("VULNERABILITY_GUIDANCE");
        xss.setVersion("4.13");
        xss.setContent("Cross-site Scripting (XSS) occurs when an application includes untrusted data in a web page without proper validation or escaping. Attackers can execute arbitrary scripts in victim browsers to steal session cookies, deface sites, or redirect users. Remediation: Context-aware output encoding, Content Security Policy (CSP), and HTTPOnly cookies.");
        ingestDocument(xss);

        KnowledgeIngestRequest csrf = new KnowledgeIngestRequest();
        csrf.setTitle("CWE-352: Cross-Site Request Forgery (CSRF)");
        csrf.setSource("CWE / MITRE");
        csrf.setSourceUrl("https://cwe.mitre.org/data/definitions/352.html");
        csrf.setDocumentType("VULNERABILITY_GUIDANCE");
        csrf.setVersion("4.13");
        csrf.setContent("Cross-Site Request Forgery occurs when a web application executes unintended actions on behalf of an authenticated user. Defense involves anti-CSRF anti-forgery tokens (synchronizer token pattern), SameSite cookie attributes (Strict/Lax), and re-authentication for sensitive actions.");
        ingestDocument(csrf);

        KnowledgeIngestRequest creds = new KnowledgeIngestRequest();
        creds.setTitle("CWE-798: Use of Hard-coded Credentials");
        creds.setSource("CWE / MITRE");
        creds.setSourceUrl("https://cwe.mitre.org/data/definitions/798.html");
        creds.setDocumentType("VULNERABILITY_GUIDANCE");
        creds.setVersion("4.13");
        creds.setContent("Hard-coded credentials such as embedded passwords, API keys, or secret tokens expose applications to unauthorized access if decompiled, inspected, or leaked via repository commits. Externalize secrets to environment variables, vaults, or key management services.");
        ingestDocument(creds);

        KnowledgeIngestRequest headers = new KnowledgeIngestRequest();
        headers.setTitle("OWASP HTTP Security Response Headers Guidance");
        headers.setSource("OWASP Foundation");
        headers.setSourceUrl("https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html");
        headers.setDocumentType("HARDENING_GUIDANCE");
        headers.setVersion("2024");
        headers.setContent("Secure HTTP response headers mitigate web attacks. Recommended headers include: Content-Security-Policy, Strict-Transport-Security (HSTS), X-Frame-Options (DENY/SAMEORIGIN), X-Content-Type-Options (nosniff), and Referrer-Policy (strict-origin-when-cross-origin).");
        ingestDocument(headers);
    }
}
