package com.globalshield.notification.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuditableLogEmailProvider implements EmailNotificationProvider {

    @Override
    public String getProviderName() {
        return "CONSOLE_AUDIT_LOG";
    }

    @Override
    public boolean sendEmail(String recipient, String subject, String bodyHtml, String bodyText) {
        log.info("========== [GLOBALSHIELD AUDIT NOTIFICATION] ==========\n" +
                "TO: {}\nSUBJECT: {}\nBODY:\n{}\n" +
                "======================================================",
                recipient, subject, bodyText != null ? bodyText : bodyHtml);
        return true;
    }
}
