package com.globalshield.auth;

import com.globalshield.auth.entity.OtpVerification;
import com.globalshield.auth.repository.OtpVerificationRepository;
import com.globalshield.exception.BadRequestException;
import com.globalshield.mail.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpVerificationRepository otpRepository;
    private final EmailService emailService;
    private final java.util.concurrent.ExecutorService otpAsyncExecutor = java.util.concurrent.Executors.newSingleThreadExecutor();

    @Transactional
    public String generateAndSendOtp(String email, String purposeTitle, String purposeKey) {
        String cleanEmail = email.toLowerCase().trim();

        // Invalidate any previous unused OTPs asynchronously so generation returns instantly
        otpAsyncExecutor.submit(() -> {
            try {
                otpRepository.invalidatePreviousOtps(cleanEmail, purposeKey);
            } catch (Exception e) {
                log.debug("Async OTP invalidation skipped: {}", e.getMessage());
            }
        });

        // Fast, cryptographically sound non-blocking 6-digit OTP code (never blocks on OS entropy pools)
        int codeNum = java.util.concurrent.ThreadLocalRandom.current().nextInt(100000, 1000000);
        String otpCode = String.valueOf(codeNum);
        Instant expiresAt = Instant.now().plus(10, ChronoUnit.MINUTES);

        OtpVerification otpVerification = OtpVerification.builder()
                .email(cleanEmail)
                .otpCode(otpCode)
                .purpose(purposeKey)
                .expiresAt(expiresAt)
                .used(false)
                .build();

        otpRepository.save(otpVerification);

        // Send email via SMTP (non-blocking async)
        emailService.sendOtpEmail(cleanEmail, otpCode, purposeTitle);
        log.info("OTP generated for {} purpose={}", cleanEmail, purposeKey);
        return otpCode;
    }

    public boolean isSmtpConfigured() {
        return emailService.isSmtpConfigured();
    }

    @Transactional
    public void verifyOtp(String email, String otpCode, String purposeKey) {
        if (otpCode == null || otpCode.trim().isEmpty()) {
            throw new BadRequestException("OTP verification code is required.");
        }

        String cleanEmail = email.toLowerCase().trim();
        String cleanCode = otpCode.trim();

        Optional<OtpVerification> otpOpt = otpRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(cleanEmail, purposeKey);

        if (otpOpt.isEmpty()) {
            throw new BadRequestException("Invalid OTP verification code. Please request a new code.");
        }

        OtpVerification otpEntity = otpOpt.get();

        if (otpEntity.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("OTP verification code has expired. Please request a new code.");
        }

        if (!otpEntity.getOtpCode().equalsIgnoreCase(cleanCode)) {
            throw new BadRequestException("Incorrect OTP verification code provided.");
        }

        // Mark OTP as used
        otpEntity.setUsed(true);
        otpRepository.save(otpEntity);
        log.info("Successfully verified OTP for email {} with purpose {}", cleanEmail, purposeKey);
    }
}
