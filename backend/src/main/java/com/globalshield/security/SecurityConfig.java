package com.globalshield.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {}) // Uses CorsFilter/CorsConfigurationSource bean from CorsConfig
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                )
                .authorizeHttpRequests(auth -> auth
                        // Public auth endpoints
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Health and OpenAPI
                        .requestMatchers("/api/v1/health", "/actuator/health", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        // Pre-flight CORS OPTIONS requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Role restricted audit logs
                        .requestMatchers("/api/v1/audit/**").hasAnyRole("ADMIN", "ANALYST")
                        // Target endpoints
                        .requestMatchers(HttpMethod.GET, "/api/v1/targets/**").hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/targets/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/targets/**").hasAnyRole("ADMIN", "ANALYST")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/targets/**").hasAnyRole("ADMIN", "ANALYST")
                        // Assessment endpoints
                        .requestMatchers(HttpMethod.GET, "/api/v1/assessments/**", "/api/v1/assessment-profiles").hasAnyRole("ADMIN", "ANALYST", "VIEWER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/assessments/**").hasAnyRole("ADMIN", "ANALYST")
                        // All other endpoints require authentication
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
