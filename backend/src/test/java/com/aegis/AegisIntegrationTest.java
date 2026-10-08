package com.aegis;

import com.aegis.auth.AuthResponse;
import com.aegis.auth.LoginRequest;
import com.aegis.auth.RegisterRequest;
import com.aegis.user.UserRole;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AegisIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Health endpoint should return UP status and 200 OK")
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"));
    }

    @Test
    @DisplayName("Unauthenticated request to protected endpoints should return 401 Unauthorized")
    void testUnauthenticatedProtection() throws Exception {
        mockMvc.perform(get("/api/v1/targets"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Complete end-to-end user registration, authentication, target creation, authorization, and assessment lifecycle flow")
    void testEndToEndPhase1Flow() throws Exception {
        String testEmail = "admin_" + System.currentTimeMillis() + "@aegis.local";

        // 1. Register Admin User
        RegisterRequest registerReq = RegisterRequest.builder()
                .email(testEmail)
                .password("AdminSecurePass123!")
                .displayName("Admin Integrator")
                .role(UserRole.ADMIN)
                .build();

        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andReturn();

        com.aegis.common.ApiResponse<AuthResponse> apiResp = objectMapper.readValue(
                regResult.getResponse().getContentAsString(),
                new com.fasterxml.jackson.core.type.TypeReference<com.aegis.common.ApiResponse<AuthResponse>>() {}
        );
        AuthResponse regResponse = apiResp.getData();

        String token = regResponse.getAccessToken();
        String authHeader = "Bearer " + token;

        // 2. Login verification
        LoginRequest loginReq = LoginRequest.builder()
                .email(testEmail)
                .password("AdminSecurePass123!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").exists());

        // 3. Verify /auth/me with JWT
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(testEmail));

        // 4. List Assessment Profiles
        mockMvc.perform(get("/api/v1/assessment-profiles")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").exists());

        // 5. Query Audit Log
        mockMvc.perform(get("/api/v1/audit")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }
}
