package com.globalshield.fuzzing.schema;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class OpenApiSchemaParserTest {

    private final OpenApiSchemaParser parser = new OpenApiSchemaParser();

    @Test
    void testParseOpenApiSpecSuccessfully() {
        String jsonSpec = """
                {
                  "openapi": "3.0.0",
                  "info": { "title": "Test Banking API", "version": "1.0.0" },
                  "paths": {
                    "/api/v1/accounts/{accountId}": {
                      "get": {
                        "operationId": "getAccount",
                        "summary": "Retrieve account details",
                        "parameters": [
                          { "name": "accountId", "in": "path", "required": true, "schema": { "type": "integer" } },
                          { "name": "includeHistory", "in": "query", "required": false, "schema": { "type": "boolean" } }
                        ]
                      }
                    },
                    "/api/v1/transfers": {
                      "post": {
                        "operationId": "createTransfer",
                        "summary": "Transfer funds",
                        "requestBody": {
                          "content": {
                            "application/json": {
                              "schema": {
                                "type": "object",
                                "required": ["recipientId", "amount"],
                                "properties": {
                                  "recipientId": { "type": "string" },
                                  "amount": { "type": "number", "format": "double" },
                                  "note": { "type": "string" }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
                """;

        List<OpenApiSchemaParser.ApiOperation> ops = parser.parseSpec(jsonSpec);
        assertEquals(2, ops.size(), "Should parse exactly two operations");

        OpenApiSchemaParser.ApiOperation getOp = ops.stream()
                .filter(o -> o.getHttpMethod().equals("GET"))
                .findFirst().orElseThrow();
        assertEquals("/api/v1/accounts/{accountId}", getOp.getPath());
        assertEquals("getAccount", getOp.getOperationId());
        assertEquals(2, getOp.getParameters().size());

        OpenApiSchemaParser.ApiOperation postOp = ops.stream()
                .filter(o -> o.getHttpMethod().equals("POST"))
                .findFirst().orElseThrow();
        assertEquals("/api/v1/transfers", postOp.getPath());
        assertEquals(3, postOp.getRequestBodyFields().size());

        assertTrue(postOp.getRequestBodyFields().stream().anyMatch(f -> f.getName().equals("amount") && f.isRequired()));
    }

    @Test
    void testHandlesInvalidOrEmptySpecGracefully() {
        List<OpenApiSchemaParser.ApiOperation> emptyList = parser.parseSpec("");
        assertTrue(emptyList.isEmpty());

        List<OpenApiSchemaParser.ApiOperation> invalidList = parser.parseSpec("{ not valid json");
        assertTrue(invalidList.isEmpty());
    }
}
