package com.globalshield.fuzzing.schema;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
public class OpenApiSchemaParser {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Data
    @Builder
    public static class ApiParameter {
        private String name;
        private String in; // path, query, header
        private String type;
        private boolean required;
        private String example;
    }

    @Data
    @Builder
    public static class ApiRequestBodyField {
        private String name;
        private String type;
        private boolean required;
        private String format;
    }

    @Data
    @Builder
    public static class ApiOperation {
        private String path;
        private String httpMethod;
        private String operationId;
        private String summary;
        private List<ApiParameter> parameters;
        private List<ApiRequestBodyField> requestBodyFields;
    }

    public List<ApiOperation> parseSpec(String specContent) {
        List<ApiOperation> operations = new ArrayList<>();
        if (specContent == null || specContent.isBlank()) {
            return operations;
        }

        try {
            JsonNode root = objectMapper.readTree(specContent);
            JsonNode pathsNode = root.get("paths");
            if (pathsNode == null || !pathsNode.isObject()) {
                log.warn("No 'paths' object found in OpenAPI specification.");
                return operations;
            }

            Iterator<Map.Entry<String, JsonNode>> pathFields = pathsNode.fields();
            while (pathFields.hasNext()) {
                Map.Entry<String, JsonNode> pathEntry = pathFields.next();
                String path = pathEntry.getKey();
                JsonNode pathItem = pathEntry.getValue();

                if (!pathItem.isObject()) continue;

                Iterator<Map.Entry<String, JsonNode>> opFields = pathItem.fields();
                while (opFields.hasNext()) {
                    Map.Entry<String, JsonNode> opEntry = opFields.next();
                    String method = opEntry.getKey().toUpperCase();
                    if (!isHttpVerb(method)) continue;

                    JsonNode opNode = opEntry.getValue();
                    String operationId = opNode.has("operationId") ? opNode.get("operationId").asText() : "";
                    String summary = opNode.has("summary") ? opNode.get("summary").asText() : "";

                    List<ApiParameter> params = extractParameters(opNode);
                    List<ApiRequestBodyField> bodyFields = extractRequestBodyFields(opNode);

                    operations.add(ApiOperation.builder()
                            .path(path)
                            .httpMethod(method)
                            .operationId(operationId)
                            .summary(summary)
                            .parameters(params)
                            .requestBodyFields(bodyFields)
                            .build());
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse OpenAPI/Swagger schema content: {}", e.getMessage());
        }

        return operations;
    }

    private boolean isHttpVerb(String verb) {
        return List.of("GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS").contains(verb);
    }

    private List<ApiParameter> extractParameters(JsonNode opNode) {
        List<ApiParameter> list = new ArrayList<>();
        JsonNode paramsNode = opNode.get("parameters");
        if (paramsNode != null && paramsNode.isArray()) {
            for (JsonNode p : paramsNode) {
                String name = p.has("name") ? p.get("name").asText() : "";
                String in = p.has("in") ? p.get("in").asText() : "query";
                boolean req = p.has("required") && p.get("required").asBoolean();
                String type = "string";
                if (p.has("schema") && p.get("schema").has("type")) {
                    type = p.get("schema").get("type").asText();
                } else if (p.has("type")) {
                    type = p.get("type").asText();
                }
                list.add(ApiParameter.builder()
                        .name(name)
                        .in(in)
                        .type(type)
                        .required(req)
                        .build());
            }
        }
        return list;
    }

    private List<ApiRequestBodyField> extractRequestBodyFields(JsonNode opNode) {
        List<ApiRequestBodyField> fields = new ArrayList<>();
        JsonNode requestBody = opNode.get("requestBody");
        if (requestBody != null) {
            JsonNode schema = requestBody.path("content").path("application/json").path("schema");
            if (schema.isMissingNode()) {
                schema = requestBody.path("content").path("*/*").path("schema");
            }
            if (schema.has("properties")) {
                Set<String> requiredSet = new HashSet<>();
                if (schema.has("required") && schema.get("required").isArray()) {
                    for (JsonNode r : schema.get("required")) {
                        requiredSet.add(r.asText());
                    }
                }

                JsonNode props = schema.get("properties");
                Iterator<Map.Entry<String, JsonNode>> propFields = props.fields();
                while (propFields.hasNext()) {
                    Map.Entry<String, JsonNode> prop = propFields.next();
                    String propName = prop.getKey();
                    JsonNode propNode = prop.getValue();
                    String type = propNode.has("type") ? propNode.get("type").asText() : "string";
                    String format = propNode.has("format") ? propNode.get("format").asText() : null;

                    fields.add(ApiRequestBodyField.builder()
                            .name(propName)
                            .type(type)
                            .required(requiredSet.contains(propName))
                            .format(format)
                            .build());
                }
            }
        }
        return fields;
    }
}
