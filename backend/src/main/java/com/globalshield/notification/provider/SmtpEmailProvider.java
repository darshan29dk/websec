package com.globalshield.notification.provider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SmtpEmailProvider implements EmailNotificationProvider {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:security-alerts@globalshield.internal}")
    private String fromEmail;

    @Override
    public String getProviderName() {
        return "SMTP";
    }

    @Override
    public boolean sendEmail(String recipient, String subject, String bodyHtml, String bodyText) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(recipient);
            msg.setSubject(subject);
            msg.setText(bodyText != null ? bodyText : bodyHtml);

            mailSender.send(msg);
            log.info("Notification successfully dispatched to {} via SMTP", recipient);
            return true;
        } catch (Exception e) {
            log.warn("SMTP delivery attempt to {} encountered an error: {}. Falling back to audit record.", recipient, e.getMessage());
            return false;
        }
    }
}
