package com.aegis.security.tool.status;

import com.aegis.security.tool.ProcessRunner;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SecurityToolService {

    private static final Logger log = LoggerFactory.getLogger(SecurityToolService.class);

    private final SecurityToolStatusRepository repository;
    private final ProcessRunner processRunner;

    private static final List<String> ALL_SUPPORTED_TOOLS = Arrays.asList(
            "Nmap", "Amass", "Subfinder", "Assetfinder", "DNSRecon", "Fierce", "theHarvester",
            "WhatWeb", "OWASP ZAP", "Nikto", "ffuf", "Gobuster", "Feroxbuster",
            "Nuclei", "testssl.sh", "SearchSploit", "OpenVAS", "HttpSecurity"
    );

    @Transactional(readOnly = true)
    public List<SecurityToolStatus> getAllToolStatuses() {
        List<SecurityToolStatus> existing = repository.findAll();
        if (existing.isEmpty()) {
            return initializeAndCheckAllTools();
        }
        return existing;
    }

    @Transactional
    public List<SecurityToolStatus> initializeAndCheckAllTools() {
        List<SecurityToolStatus> statuses = new ArrayList<>();
        for (String toolName : ALL_SUPPORTED_TOOLS) {
            SecurityToolStatus status = checkToolHealth(toolName);
            statuses.add(status);
        }
        return statuses;
    }

    @Transactional
    public SecurityToolStatus checkToolHealth(String toolName) {
        SecurityToolStatus status = repository.findByToolNameIgnoreCase(toolName)
                .orElse(SecurityToolStatus.builder()
                        .toolName(toolName)
                        .status("NOT_CONFIGURED")
                        .build());

        status.setLastCheckedAt(OffsetDateTime.now());

        if ("HttpSecurity".equalsIgnoreCase(toolName)) {
            status.setStatus("AVAILABLE");
            status.setVersion("Java-21-Builtin");
            status.setExecutablePath("Builtin Spring/Java HTTP Client");
            status.setSupportedOperations("TLS Inspection, Security Headers Analysis, Cookie Security Verification, Redirect Analysis");
            status.setConfigurationStatus("Operational (Builtin Java Client)");
            return repository.save(status);
        }

        String execName = getExecutableName(toolName);
        boolean isAvailable = checkExecutableInPath(execName);

        if (isAvailable) {
            status.setStatus("AVAILABLE");
            status.setExecutablePath("/usr/bin/" + execName);
            status.setVersion("Installed (CLI)");
            status.setSupportedOperations(getSupportedOperations(toolName));
            status.setConfigurationStatus("Available in Kali/Lab environment PATH");
        } else {
            status.setStatus("NOT_AVAILABLE");
            status.setExecutablePath("Not found in system PATH");
            status.setVersion("N/A");
            status.setSupportedOperations(getSupportedOperations(toolName));
            status.setConfigurationStatus("Executable '" + execName + "' not installed or not in PATH");
        }

        return repository.save(status);
    }

    private String getExecutableName(String toolName) {
        switch (toolName.toLowerCase()) {
            case "nmap": return "nmap";
            case "amass": return "amass";
            case "subfinder": return "subfinder";
            case "assetfinder": return "assetfinder";
            case "dnsrecon": return "dnsrecon";
            case "fierce": return "fierce";
            case "theharvester": return "theharvester";
            case "whatweb": return "whatweb";
            case "owasp zap":
            case "zap": return "zap-cli";
            case "nikto": return "nikto";
            case "ffuf": return "ffuf";
            case "gobuster": return "gobuster";
            case "feroxbuster": return "feroxbuster";
            case "nuclei": return "nuclei";
            case "testssl.sh":
            case "testssl": return "testssl.sh";
            case "searchsploit": return "searchsploit";
            case "openvas": return "gvm-cli";
            default: return toolName.toLowerCase();
        }
    }

    private String getSupportedOperations(String toolName) {
        switch (toolName.toLowerCase()) {
            case "nmap": return "Port scanning, service discovery, OS detection";
            case "amass": return "Subdomain enumeration, OSINT asset mapping";
            case "subfinder": return "Passive subdomain discovery";
            case "assetfinder": return "Subdomain discovery from public sources";
            case "dnsrecon": return "DNS record enumeration, Zone transfer checks";
            case "fierce": return "DNS reconnaissance and IP range discovery";
            case "theharvester": return "Emails, subdomains, names OSINT discovery";
            case "whatweb": return "Web technology fingerprinting";
            case "owasp zap":
            case "zap": return "Web application security crawling & active scanning";
            case "nikto": return "Web server misconfiguration & file scanning";
            case "ffuf": return "Controlled fast web directory & parameter fuzzing";
            case "gobuster": return "DNS/URI endpoint directory enumeration";
            case "feroxbuster": return "Recursive content & directory discovery";
            case "nuclei": return "Allowlisted template-based vulnerability scanning";
            case "testssl.sh":
            case "testssl": return "Deep TLS/SSL cipher & protocol vulnerability analysis";
            case "searchsploit": return "Local Exploit-DB vulnerability lookup";
            case "openvas": return "Network vulnerability assessment API integration";
            default: return "Authorized security assessment tool integration";
        }
    }

    private boolean checkExecutableInPath(String execName) {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            List<String> cmd = os.contains("win")
                    ? Arrays.asList("where", execName)
                    : Arrays.asList("which", execName);

            ProcessBuilder pb = new ProcessBuilder(cmd);
            Process process = pb.start();
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            return false;
        }
    }
}
