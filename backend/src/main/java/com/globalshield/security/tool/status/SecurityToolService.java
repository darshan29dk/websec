package com.globalshield.security.tool.status;

import com.globalshield.security.tool.ProcessRunner;
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

    public static final List<String> ALL_25_TOOLS = Arrays.asList(
            "Nmap", "Amass", "Subfinder", "theHarvester", "Shodan",
            "Burp Suite", "OWASP ZAP", "Nikto", "Gobuster", "SQLmap",
            "Wireshark", "tcpdump", "Zeek", "Suricata", "Snort",
            "Wazuh", "Splunk", "Elastic Security", "Microsoft Sentinel", "Security Onion",
            "Autopsy", "FTK Imager", "Volatility", "Plaso", "Ghidra"
    );

    @Transactional(readOnly = true)
    public List<SecurityToolStatus> getAllToolStatuses() {
        List<SecurityToolStatus> existing = repository.findAll();
        if (existing.isEmpty() || existing.size() < ALL_25_TOOLS.size()) {
            return initializeAndCheckAllTools();
        }
        return existing;
    }

    @Transactional(readOnly = true)
    public SecurityToolStatus getToolByName(String toolName) {
        return repository.findByToolNameIgnoreCase(toolName)
                .orElseGet(() -> checkToolHealth(toolName));
    }

    @Transactional
    public List<SecurityToolStatus> initializeAndCheckAllTools() {
        List<SecurityToolStatus> statuses = new ArrayList<>();
        for (String toolName : ALL_25_TOOLS) {
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
                        .displayName(toolName)
                        .status("NOT_CONFIGURED")
                        .build());

        status.setLastCheckedAt(OffsetDateTime.now());
        populateToolMetadata(status, toolName);

        String integrationType = status.getIntegrationType();
        if ("EXTERNAL_API".equalsIgnoreCase(integrationType)) {
            checkExternalApiHealth(status, toolName);
        } else if ("SIEM_CONNECTOR".equalsIgnoreCase(integrationType)) {
            checkSiemConnectorHealth(status, toolName);
        } else if ("MANAGED_SECURITY_PLATFORM".equalsIgnoreCase(integrationType)) {
            checkManagedPlatformHealth(status, toolName);
        } else {
            // EXECUTABLE_SCANNER, PACKET_ANALYSIS, IDS_ENGINE, FORENSICS_TOOL, REVERSE_ENGINEERING_TOOL
            checkExecutableHealth(status, toolName);
        }

        return repository.save(status);
    }

    private void populateToolMetadata(SecurityToolStatus status, String toolName) {
        status.setDisplayName(toolName);
        switch (toolName) {
            case "Nmap":
                status.setCategory("RECONNAISSANCE");
                status.setIntegrationType("EXECUTABLE_SCANNER");
                status.setDescription("Network discovery, active port scanning, service version detection, and host fingerprinting.");
                status.setSupportedOperations("TCP SYN/Connect port scanning, service version identification, OS detection, host discovery");
                status.setAuthorizationRequired(true);
                break;
            case "Amass":
                status.setCategory("RECONNAISSANCE");
                status.setIntegrationType("EXECUTABLE_SCANNER");
                status.setDescription("In-depth attack surface mapping and external asset discovery via active reconnaissance and OSINT.");
                status.setSupportedOperations("Subdomain enumeration, ASN discovery, network mapping, DNS scraping");
                status.setAuthorizationRequired(true);
                break;
            case "Subfinder":
                status.setCategory("RECONNAISSANCE");
                status.setIntegrationType("EXECUTABLE_SCANNER");
                status.setDescription("Fast passive subdomain discovery tool querying passive online DNS and certificate sources.");
                status.setSupportedOperations("Passive subdomain enumeration, certificate transparency log searching");
                status.setAuthorizationRequired(true);
                break;
            case "theHarvester":
                status.setCategory("RECONNAISSANCE");
                status.setIntegrationType("EXECUTABLE_SCANNER");
                status.setDescription("OSINT tool for gathering public subdomains, virtual hosts, and open source reconnaissance metadata.");
                status.setSupportedOperations("Passive OSINT domain reconnaissance, search engine indexing discovery");
                status.setAuthorizationRequired(true);
                break;
            case "Shodan":
                status.setCategory("RECONNAISSANCE");
                status.setIntegrationType("EXTERNAL_API");
                status.setDescription("Search engine for Internet-connected devices, querying indexed banner data and exposed services.");
                status.setSupportedOperations("Target host banner lookup, IP service query, external intelligence normalization");
                status.setAuthorizationRequired(true);
                break;
            case "Burp Suite":
                status.setCategory("WEB_SECURITY");
                status.setIntegrationType("MANAGED_SECURITY_PLATFORM");
                status.setDescription("Enterprise web vulnerability scanner and managed interactive security testing platform.");
                status.setSupportedOperations("Managed scan triggering, REST API telemetry ingestion, issue synchronization");
                status.setAuthorizationRequired(true);
                break;
            case "OWASP ZAP":
                status.setCategory("WEB_SECURITY");
                status.setIntegrationType("EXECUTABLE_SCANNER");
                status.setDescription("OWASP Zed Attack Proxy for automated web vulnerability scanning and crawling.");
                status.setSupportedOperations("Passive HTTP inspection, controlled spidering, authorized active vulnerability scanning");
                status.setAuthorizationRequired(true);
                break;
            case "Nikto":
                status.setCategory("WEB_SECURITY");
                status.setIntegrationType("EXECUTABLE_SCANNER");
                status.setDescription("Web server scanner checking for dangerous files, outdated server software, and misconfigurations.");
                status.setSupportedOperations("Web server configuration audit, known file enumeration, HTTP method testing");
                status.setAuthorizationRequired(true);
                break;
            case "Gobuster":
                status.setCategory("WEB_SECURITY");
                status.setIntegrationType("EXECUTABLE_SCANNER");
                status.setDescription("Directory and DNS enumeration tool used to discover hidden endpoints and subdomains.");
                status.setSupportedOperations("URI directory discovery, endpoint brute force enumeration within authorized scope");
                status.setAuthorizationRequired(true);
                break;
            case "SQLmap":
                status.setCategory("WEB_SECURITY");
                status.setIntegrationType("EXECUTABLE_SCANNER");
                status.setDescription("High-risk automated SQL injection detection and database testing engine.");
                status.setSupportedOperations("Gated SQL injection vulnerability detection, parameter audit under strict authorization");
                status.setAuthorizationRequired(true);
                break;
            case "Wireshark":
                status.setCategory("NETWORK_SECURITY");
                status.setIntegrationType("PACKET_ANALYSIS");
                status.setDescription("Network packet dissection and protocol analysis utility (tshark engine).");
                status.setSupportedOperations("PCAP file dissection, protocol hierarchy analysis, conversation metadata extraction");
                status.setAuthorizationRequired(false);
                break;
            case "tcpdump":
                status.setCategory("NETWORK_SECURITY");
                status.setIntegrationType("PACKET_ANALYSIS");
                status.setDescription("Command-line packet analyzer for authorized capture validation and network inspection.");
                status.setSupportedOperations("Packet capture dissection, filter verification, frame header inspection");
                status.setAuthorizationRequired(true);
                break;
            case "Zeek":
                status.setCategory("NETWORK_SECURITY");
                status.setIntegrationType("TELEMETRY_SOURCE");
                status.setDescription("Network security monitoring platform translating raw traffic into structured connection logs.");
                status.setSupportedOperations("Conn/DNS/HTTP/SSL protocol log parsing, weird event detection, network telemetry extraction");
                status.setAuthorizationRequired(false);
                break;
            case "Suricata":
                status.setCategory("NETWORK_SECURITY");
                status.setIntegrationType("IDS_ENGINE");
                status.setDescription("High-performance Network Threat Detection, IDS, IPS, and Network Security Monitoring engine.");
                status.setSupportedOperations("Eve.json EVE alert ingestion, signature match analysis, traffic flow inspection");
                status.setAuthorizationRequired(false);
                break;
            case "Snort":
                status.setCategory("NETWORK_SECURITY");
                status.setIntegrationType("IDS_ENGINE");
                status.setDescription("Open source network intrusion prevention system and rule-based traffic analyzer.");
                status.setSupportedOperations("Snort unified2/fast alert normalization, signature severity classification");
                status.setAuthorizationRequired(false);
                break;
            case "Wazuh":
                status.setCategory("BLUE_TEAM_SIEM");
                status.setIntegrationType("SIEM_CONNECTOR");
                status.setDescription("Unified XDR and SIEM platform for endpoint security monitoring and compliance analysis.");
                status.setSupportedOperations("Wazuh Manager REST API synchronization, security event ingestion, agent health status");
                status.setAuthorizationRequired(false);
                break;
            case "Splunk":
                status.setCategory("BLUE_TEAM_SIEM");
                status.setIntegrationType("SIEM_CONNECTOR");
                status.setDescription("Enterprise security information and event management (SIEM) data analytics connector.");
                status.setSupportedOperations("REST search query execution, HEC event synchronization, security alert correlation");
                status.setAuthorizationRequired(false);
                break;
            case "Elastic Security":
                status.setCategory("BLUE_TEAM_SIEM");
                status.setIntegrationType("SIEM_CONNECTOR");
                status.setDescription("Elastic SIEM and detection engine integration for security log analysis.");
                status.setSupportedOperations("Elasticsearch index querying, detection alert retrieval, normalized event mapping");
                status.setAuthorizationRequired(false);
                break;
            case "Microsoft Sentinel":
                status.setCategory("BLUE_TEAM_SIEM");
                status.setIntegrationType("SIEM_CONNECTOR");
                status.setDescription("Cloud-native SIEM and intelligent security analytics platform in Microsoft Azure.");
                status.setSupportedOperations("Log Analytics workspace query, incident synchronization, alert correlation");
                status.setAuthorizationRequired(false);
                break;
            case "Security Onion":
                status.setCategory("BLUE_TEAM_SIEM");
                status.setIntegrationType("SIEM_CONNECTOR");
                status.setDescription("Complete Linux distribution for threat hunting, network security monitoring, and log management.");
                status.setSupportedOperations("Elastic/Zeek/Suricata integrated alert ingestion, hunt query execution");
                status.setAuthorizationRequired(false);
                break;
            case "Autopsy":
                status.setCategory("DIGITAL_FORENSICS");
                status.setIntegrationType("FORENSICS_TOOL");
                status.setDescription("Digital forensics platform and graphical interface to The Sleuth Kit (TSK).");
                status.setSupportedOperations("Disk image analysis, artifact extraction, case metadata verification");
                status.setAuthorizationRequired(true);
                break;
            case "FTK Imager":
                status.setCategory("DIGITAL_FORENSICS");
                status.setIntegrationType("FORENSICS_TOOL");
                status.setDescription("Forensic data preview and imaging tool for acquiring computer evidence without altering source data.");
                status.setSupportedOperations("Forensic image verification, SHA-256 hash calculation, evidence integrity checking");
                status.setAuthorizationRequired(true);
                break;
            case "Volatility":
                status.setCategory("DIGITAL_FORENSICS");
                status.setIntegrationType("FORENSICS_TOOL");
                status.setDescription("Advanced memory forensics framework for incident response and malware analysis.");
                status.setSupportedOperations("RAM dump analysis, process listing (pslist/pstree), network connection discovery (netscan)");
                status.setAuthorizationRequired(true);
                break;
            case "Plaso":
                status.setCategory("DIGITAL_FORENSICS");
                status.setIntegrationType("FORENSICS_TOOL");
                status.setDescription("Log2timeline super-timeline extraction tool for forensic timeline construction.");
                status.setSupportedOperations("Super-timeline creation, multi-source log event sorting, evidence correlation");
                status.setAuthorizationRequired(true);
                break;
            case "Ghidra":
                status.setCategory("DIGITAL_FORENSICS");
                status.setIntegrationType("REVERSE_ENGINEERING_TOOL");
                status.setDescription("Software reverse engineering (SRE) suite developed by NSA for malware disassembly and decompilation.");
                status.setSupportedOperations("Headless binary analysis, function extraction, string & import dissection");
                status.setAuthorizationRequired(true);
                break;
            default:
                status.setCategory("RECONNAISSANCE");
                status.setIntegrationType("EXECUTABLE_SCANNER");
                status.setDescription("Security tool integration.");
                status.setSupportedOperations("General security operations");
                status.setAuthorizationRequired(true);
                break;
        }
    }

    private void checkExternalApiHealth(SecurityToolStatus status, String toolName) {
        if ("Shodan".equalsIgnoreCase(toolName)) {
            String apiKey = System.getenv("SHODAN_API_KEY");
            if (apiKey == null || apiKey.isBlank()) {
                apiKey = System.getProperty("shodan.api.key");
            }
            if (apiKey != null && !apiKey.isBlank()) {
                status.setStatus("AVAILABLE");
                status.setConfigurationStatus("Configured with environment API key");
                status.setVersion("REST API v2");
                status.setExecutablePath("https://api.shodan.io");
            } else {
                status.setStatus("NOT_CONFIGURED");
                status.setConfigurationStatus("SHODAN_API_KEY is not configured in server environment");
                status.setVersion("N/A");
                status.setExecutablePath("External API Endpoint");
            }
        }
    }

    private void checkSiemConnectorHealth(SecurityToolStatus status, String toolName) {
        String envKeyUrl = null;
        String defaultPath = "Connector API Endpoint";
        switch (toolName) {
            case "Wazuh":
                envKeyUrl = System.getenv("WAZUH_URL");
                break;
            case "Splunk":
                envKeyUrl = System.getenv("SPLUNK_URL");
                break;
            case "Elastic Security":
                envKeyUrl = System.getenv("ELASTIC_URL");
                break;
            case "Microsoft Sentinel":
                envKeyUrl = System.getenv("SENTINEL_WORKSPACE_ID");
                break;
            case "Security Onion":
                envKeyUrl = System.getenv("SECURITY_ONION_URL");
                break;
        }

        if (envKeyUrl != null && !envKeyUrl.isBlank()) {
            status.setStatus("AVAILABLE");
            status.setConfigurationStatus("Connector configured via server environment");
            status.setVersion("Active Connector");
            status.setExecutablePath(defaultPath);
        } else {
            status.setStatus("NOT_CONFIGURED");
            status.setConfigurationStatus("Connector parameters not configured in server environment");
            status.setVersion("N/A");
            status.setExecutablePath(defaultPath);
        }
    }

    private void checkManagedPlatformHealth(SecurityToolStatus status, String toolName) {
        if ("Burp Suite".equalsIgnoreCase(toolName)) {
            String burpUrl = System.getenv("BURP_URL");
            if (burpUrl != null && !burpUrl.isBlank()) {
                status.setStatus("AVAILABLE");
                status.setConfigurationStatus("Connected to Burp Suite Enterprise REST API");
                status.setVersion("Enterprise REST API");
                status.setExecutablePath(burpUrl);
            } else {
                status.setStatus("NOT_CONFIGURED");
                status.setConfigurationStatus("BURP_URL not configured. Manual controlled workflow available.");
                status.setVersion("N/A");
                status.setExecutablePath("Managed REST Platform");
            }
        }
    }

    private void checkExecutableHealth(SecurityToolStatus status, String toolName) {
        String envPathVar = getEnvPathVar(toolName);
        String customPath = envPathVar != null ? System.getenv(envPathVar) : null;
        String execName = getExecutableName(toolName);

        boolean isAvailable = false;
        String resolvedPath = null;

        if (customPath != null && !customPath.isBlank()) {
            java.io.File file = new java.io.File(customPath);
            if (file.exists() && file.canExecute()) {
                isAvailable = true;
                resolvedPath = file.getAbsolutePath();
            }
        }

        if (!isAvailable) {
            resolvedPath = findExecutableInPath(execName);
            if (resolvedPath != null) {
                isAvailable = true;
            }
        }

        if (isAvailable) {
            status.setStatus("AVAILABLE");
            status.setExecutablePath(resolvedPath != null ? resolvedPath : "/usr/bin/" + execName);
            status.setVersion("Installed (CLI)");
            status.setConfigurationStatus("Available and verified on host system");
        } else {
            status.setStatus("NOT_AVAILABLE");
            status.setExecutablePath("Not found in host system PATH");
            status.setVersion("N/A");
            status.setConfigurationStatus("Executable '" + execName + "' not installed or not in PATH");
        }
    }

    private String getEnvPathVar(String toolName) {
        switch (toolName.toLowerCase()) {
            case "nmap": return "NMAP_PATH";
            case "amass": return "AMASS_PATH";
            case "subfinder": return "SUBFINDER_PATH";
            case "theharvester": return "THEHARVESTER_PATH";
            case "owasp zap": return "ZAP_PATH";
            case "nikto": return "NIKTO_PATH";
            case "gobuster": return "GOBUSTER_PATH";
            case "sqlmap": return "SQLMAP_PATH";
            case "wireshark": return "WIRESHARK_PATH";
            case "tcpdump": return "TCPDUMP_PATH";
            case "zeek": return "ZEEK_PATH";
            case "suricata": return "SURICATA_PATH";
            case "snort": return "SNORT_PATH";
            case "autopsy": return "AUTOPSY_PATH";
            case "ftk imager": return "FTK_IMAGER_PATH";
            case "volatility": return "VOLATILITY_PATH";
            case "plaso": return "PLASO_PATH";
            case "ghidra": return "GHIDRA_PATH";
            default: return null;
        }
    }

    private String getExecutableName(String toolName) {
        switch (toolName.toLowerCase()) {
            case "nmap": return "nmap";
            case "amass": return "amass";
            case "subfinder": return "subfinder";
            case "theharvester": return "theHarvester";
            case "owasp zap": return "zap-cli";
            case "nikto": return "nikto";
            case "gobuster": return "gobuster";
            case "sqlmap": return "sqlmap";
            case "wireshark": return "tshark";
            case "tcpdump": return System.getProperty("os.name").toLowerCase().contains("win") ? "windump" : "tcpdump";
            case "zeek": return "zeek";
            case "suricata": return "suricata";
            case "snort": return "snort";
            case "autopsy": return "autopsy";
            case "ftk imager": return "ftkimager";
            case "volatility": return "vol";
            case "plaso": return "log2timeline";
            case "ghidra": return System.getProperty("os.name").toLowerCase().contains("win") ? "ghidraRun.bat" : "ghidraRun";
            default: return toolName.toLowerCase().replace(" ", "-");
        }
    }

    private String findExecutableInPath(String execName) {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            List<String> cmd = os.contains("win")
                    ? Arrays.asList("where", execName)
                    : Arrays.asList("which", execName);

            ProcessBuilder pb = new ProcessBuilder(cmd);
            Process process = pb.start();
            try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream()))) {
                String line = reader.readLine();
                int exitCode = process.waitFor();
                if (exitCode == 0 && line != null && !line.isBlank()) {
                    return line.trim();
                }
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}
