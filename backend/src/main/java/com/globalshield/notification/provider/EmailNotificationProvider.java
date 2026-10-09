package com.globalshield.notification.provider;

public interface EmailNotificationProvider {
    boolean sendEmail(String recipient, String subject, String bodyHtml, String bodyText);
    String getProviderName();
}
