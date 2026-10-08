package com.globalshield;

import com.globalshield.exception.InvalidTargetUrlException;
import com.globalshield.target.UrlValidatorUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UrlValidatorUtilTest {

    @Test
    @DisplayName("Should normalize valid URL with https scheme")
    void testValidHttpsUrl() {
        String input = "https://example.com/path";
        String normalized = UrlValidatorUtil.validateAndNormalizeUrl(input);
        assertEquals("https://example.com/path", normalized);
    }

    @Test
    @DisplayName("Should automatically prepend https:// to bare domain")
    void testBareDomainPrependScheme() {
        String input = "example.com";
        String normalized = UrlValidatorUtil.validateAndNormalizeUrl(input);
        assertEquals("https://example.com/", normalized);
    }

    @Test
    @DisplayName("Should reject disallowed scheme file://")
    void testRejectFileScheme() {
        String input = "file:///etc/passwd";
        InvalidTargetUrlException ex = assertThrows(InvalidTargetUrlException.class,
                () -> UrlValidatorUtil.validateAndNormalizeUrl(input));
        assertTrue(ex.getMessage().contains("Unsupported or unsafe URI scheme"));
    }

    @Test
    @DisplayName("Should reject disallowed scheme javascript:")
    void testRejectJavascriptScheme() {
        String input = "javascript:alert(1)";
        InvalidTargetUrlException ex = assertThrows(InvalidTargetUrlException.class,
                () -> UrlValidatorUtil.validateAndNormalizeUrl(input));
        assertTrue(ex.getMessage().contains("Unsupported or unsafe URI scheme"));
    }

    @Test
    @DisplayName("Should reject disallowed scheme ftp://")
    void testRejectFtpScheme() {
        String input = "ftp://ftp.example.com";
        InvalidTargetUrlException ex = assertThrows(InvalidTargetUrlException.class,
                () -> UrlValidatorUtil.validateAndNormalizeUrl(input));
        assertTrue(ex.getMessage().contains("Unsupported or unsafe URI scheme"));
    }

    @Test
    @DisplayName("Should reject empty or blank URL")
    void testRejectEmptyUrl() {
        assertThrows(InvalidTargetUrlException.class, () -> UrlValidatorUtil.validateAndNormalizeUrl(""));
        assertThrows(InvalidTargetUrlException.class, () -> UrlValidatorUtil.validateAndNormalizeUrl("   "));
    }
}
