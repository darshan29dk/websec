package com.globalshield.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new PasswordEncoder() {
            @Override
            public String encode(CharSequence rawPassword) {
                if (rawPassword == null) {
                    throw new IllegalArgumentException("rawPassword cannot be null");
                }
                return hashSha512(rawPassword.toString());
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                if (rawPassword == null || encodedPassword == null) {
                    return false;
                }
                String hashedRaw = hashSha512(rawPassword.toString());
                return MessageDigest.isEqual(
                    hashedRaw.getBytes(StandardCharsets.UTF_8),
                    encodedPassword.getBytes(StandardCharsets.UTF_8)
                );
            }

            private String hashSha512(String input) {
                try {
                    MessageDigest md = MessageDigest.getInstance("SHA-512");
                    byte[] bytes = md.digest(input.getBytes(StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder();
                    for (byte b : bytes) {
                        sb.append(String.format("%02x", b));
                    }
                    return sb.toString();
                } catch (NoSuchAlgorithmException e) {
                    throw new IllegalStateException("SHA-512 hashing algorithm not available", e);
                }
            }
        };
    }
}
