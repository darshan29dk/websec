package com.globalshield.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:darshanreddy5822@gmail.com}")
    private String fromEmail;

    public void sendOtpEmail(String recipientEmail, String otpCode, String title) {
        String subject = "GlobalShield Security — " + title + " OTP Verification";
        String body = String.format(
                "Hello,\n\nYour GlobalShield %s OTP verification code is: %s\n\n" +
                "This code will expire in 10 minutes.\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "Regards,\nGlobalShield Security Operations Team\n(Sent via %s)",
                title, otpCode, fromEmail
        );

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(recipientEmail);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            log.info("OTP verification email successfully sent to {} via SMTP sender {}", recipientEmail, fromEmail);
        } catch (Exception ex) {
            log.warn("Could not dispatch SMTP email to {}: {}. OTP Code for testing: [{}]", recipientEmail, ex.getMessage(), otpCode);
        }
    }
}
