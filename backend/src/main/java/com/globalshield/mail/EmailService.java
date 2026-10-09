package com.globalshield.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:darshanreddy5822@gmail.com}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    public boolean isSmtpConfigured() {
        return mailPassword != null && !mailPassword.trim().isEmpty();
    }

    public void sendOtpEmail(String recipientEmail, String otpCode, String title) {
        log.info(">>>>> [GLOBALSHIELD OTP] Code for {} ({}): [{}] <<<<<", recipientEmail, title, otpCode);

        // If SMTP password is not provided, skip external socket attempt to prevent thread blocking / lag
        if (!isSmtpConfigured()) {
            log.info("SPRING_MAIL_PASSWORD is not configured. External SMTP delivery skipped. OTP is active and verified via database.");
            return;
        }

        // Asynchronously dispatch SMTP email so HTTP request returns instantly (0ms latency to client)
        CompletableFuture.runAsync(() -> {
            try {
                String subject = "GlobalShield Security — " + title + " OTP Verification";
                String body = String.format(
                        "Hello,\n\nYour GlobalShield %s OTP verification code is: %s\n\n" +
                        "This code will expire in 10 minutes.\n" +
                        "If you did not request this, please ignore this email.\n\n" +
                        "Regards,\nGlobalShield Security Operations Team\n(Sent via %s)",
                        title, otpCode, fromEmail
                );

                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(recipientEmail);
                message.setSubject(subject);
                message.setText(body);

                mailSender.send(message);
                log.info("OTP verification email successfully sent to {} via SMTP", recipientEmail);
            } catch (Exception ex) {
                log.warn("Could not dispatch SMTP email to {}: {}. OTP Code in log: [{}]", recipientEmail, ex.getMessage(), otpCode);
            }
        });
    }
}
