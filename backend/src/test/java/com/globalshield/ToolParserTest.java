package com.globalshield;

import com.globalshield.assessment.SecurityAssessment;
import com.globalshield.assessment.result.AssessmentAsset;
import com.globalshield.assessment.result.AssessmentEndpoint;
import com.globalshield.assessment.result.AssessmentObservation;
import com.globalshield.security.tool.parser.*;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ToolParserTest {

    private final SecurityAssessment dummyAssessment = SecurityAssessment.builder().build();

    @Test
    void testWhatWebParser() {
        WhatWebParser parser = new WhatWebParser();
        String json = "[{\"target\":\"http://example.com\",\"http_status\":200,\"plugins\":{\"HTTPServer\":{\"string\":[\"nginx/1.18.0\"]},\"jQuery\":{\"version\":[\"3.5.1\"]}}}]";

        List<AssessmentAsset> assets = parser.parseAssets(dummyAssessment, json);
        List<AssessmentObservation> obs = parser.parseObservations(dummyAssessment, json);

        assertNotNull(assets);
        assertNotNull(obs);
        assertFalse(obs.isEmpty());
        assertTrue(obs.stream().anyMatch(o -> o.getTitle().contains("HTTPServer")));
    }

    @Test
    void testNiktoParser() {
        NiktoParser parser = new NiktoParser();
        String json = "{\"banner\":\"nginx/1.18.0\",\"vulnerabilities\":[{\"id\":\"001\",\"msg\":\"X-Frame-Options header missing\",\"url\":\"/\"}]}";

        List<AssessmentObservation> obs = parser.parseObservations(dummyAssessment, json);
        assertNotNull(obs);
        assertFalse(obs.isEmpty());
        assertEquals("X-Frame-Options header missing", obs.get(0).getDescription());
    }

    @Test
    void testNucleiParser() {
        NucleiParser parser = new NucleiParser();
        String jsonl = "{\"template-id\":\"cve-2021-44228\",\"matched-at\":\"http://example.com\",\"info\":{\"name\":\"Log4j RCE\",\"severity\":\"critical\",\"description\":\"Apache Log4j RCE vulnerability\"}}\n";

        List<AssessmentEndpoint> endpoints = parser.parseEndpoints(dummyAssessment, jsonl);
        List<AssessmentObservation> obs = parser.parseObservations(dummyAssessment, jsonl);

        assertNotNull(endpoints);
        assertEquals(1, endpoints.size());
        assertEquals("http://example.com", endpoints.get(0).getUrl());

        assertNotNull(obs);
        assertEquals(1, obs.size());
        assertEquals("Apache Log4j RCE vulnerability", obs.get(0).getDescription());
    }

    @Test
    void testZapParser() {
        ZapParser parser = new ZapParser();
        String json = "{\"site\":[{\"alerts\":[{\"alert\":\"Cross-Domain Misconfiguration\",\"riskdesc\":\"Medium (High)\",\"url\":\"http://example.com/api\",\"description\":\"CORS headers allows arbitrary origin\"}]}]}";

        List<AssessmentEndpoint> endpoints = parser.parseEndpoints(dummyAssessment, json);
        List<AssessmentObservation> obs = parser.parseObservations(dummyAssessment, json);

        assertNotNull(endpoints);
        assertEquals(1, endpoints.size());
        assertEquals("http://example.com/api", endpoints.get(0).getUrl());

        assertNotNull(obs);
        assertEquals(1, obs.size());
        assertTrue(obs.get(0).getTitle().contains("Cross-Domain Misconfiguration"));
    }
}
