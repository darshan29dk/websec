-- ============================================================
-- GLOBALSHIELD: V15 Expand Security Tool Registry (Complete 25-Tool Ecosystem)
-- PostgreSQL & Supabase Compatible
-- ============================================================

-- 1. Extend security_tools_status table
ALTER TABLE security_tools_status ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE security_tools_status ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE security_tools_status ADD COLUMN IF NOT EXISTS integration_type VARCHAR(50);
ALTER TABLE security_tools_status ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE security_tools_status ADD COLUMN IF NOT EXISTS authorization_required BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE security_tools_status ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE security_tools_status ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE security_tools_status ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Extend tool_executions table
ALTER TABLE tool_executions ADD COLUMN IF NOT EXISTS tool_id UUID REFERENCES security_tools_status(id) ON DELETE SET NULL;
ALTER TABLE tool_executions ADD COLUMN IF NOT EXISTS stdout_reference VARCHAR(512);
ALTER TABLE tool_executions ADD COLUMN IF NOT EXISTS stderr_reference VARCHAR(512);
ALTER TABLE tool_executions ADD COLUMN IF NOT EXISTS scope_reference VARCHAR(512);
ALTER TABLE tool_executions ADD COLUMN IF NOT EXISTS authorization_reference VARCHAR(512);

-- Update status check constraint for tool_executions to allow all required lifecycle statuses
ALTER TABLE tool_executions DROP CONSTRAINT IF EXISTS tool_executions_status_check;
ALTER TABLE tool_executions ADD CONSTRAINT tool_executions_status_check 
    CHECK (status IN ('QUEUED', 'VALIDATING', 'RUNNING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED', 'NOT_AVAILABLE', 'BLOCKED'));

-- 3. Extend security_events table for normalized external SIEM/IDS telemetry
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS source_system VARCHAR(100);
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'INFO';
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS user_identifier_if_available VARCHAR(255);
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS asset_id UUID;

-- 4. Extend forensic_evidence table for full chain of custody and file hashing
ALTER TABLE forensic_evidence ADD COLUMN IF NOT EXISTS file_reference VARCHAR(512);
ALTER TABLE forensic_evidence ADD COLUMN IF NOT EXISTS hash_algorithm VARCHAR(32) DEFAULT 'SHA-256';
ALTER TABLE forensic_evidence ADD COLUMN IF NOT EXISTS acquisition_method VARCHAR(128);
ALTER TABLE forensic_evidence ADD COLUMN IF NOT EXISTS chain_of_custody_reference VARCHAR(255);
ALTER TABLE forensic_evidence ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(32) DEFAULT 'PENDING';

-- 5. Extend security_telemetry_sources for SIEM connectors
ALTER TABLE security_telemetry_sources ADD COLUMN IF NOT EXISTS connection_status VARCHAR(50) DEFAULT 'NOT_CONFIGURED';
ALTER TABLE security_telemetry_sources ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE security_telemetry_sources ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE security_telemetry_sources ADD COLUMN IF NOT EXISTS tenant_identifier VARCHAR(255);
ALTER TABLE security_telemetry_sources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 6. Upsert the Complete 25-Tool Registry
-- Category A: RECONNAISSANCE / ATTACK SURFACE
INSERT INTO security_tools_status (tool_name, display_name, category, integration_type, description, supported_operations, authorization_required, status, configuration_status)
VALUES 
('Nmap', 'Nmap Network Scanner', 'RECONNAISSANCE', 'EXECUTABLE_SCANNER', 
 'Industry standard network mapper and port discovery tool for determining open ports and running service banners.', 
 'Port scanning, service version detection, OS identification, conservative timing profiles', TRUE, 'NOT_CONFIGURED', 'Requires Nmap executable on system PATH (NMAP_PATH)'),
('Amass', 'OWASP Amass', 'RECONNAISSANCE', 'EXECUTABLE_SCANNER', 
 'In-depth attack surface mapping and external asset discovery utilizing open source information gathering and active data sources.', 
 'Subdomain enumeration, DNS asset mapping, ASN discovery, network range enumeration', TRUE, 'NOT_CONFIGURED', 'Requires Amass executable on system PATH (AMASS_PATH)'),
('Subfinder', 'Subfinder', 'RECONNAISSANCE', 'EXECUTABLE_SCANNER', 
 'Fast passive subdomain discovery tool that harvests valid subdomains using passive online sources.', 
 'Passive subdomain discovery, recursive DNS enumeration, target scope asset discovery', TRUE, 'NOT_CONFIGURED', 'Requires Subfinder executable on system PATH (SUBFINDER_PATH)'),
('theHarvester', 'theHarvester OSINT', 'RECONNAISSANCE', 'EXECUTABLE_SCANNER', 
 'Open source intelligence tool for gathering emails, subdomains, hosts, employee names, and open ports from public sources.', 
 'Passive domain intelligence gathering, email harvesting, employee discovery, host indexing', TRUE, 'NOT_CONFIGURED', 'Requires theHarvester executable on system PATH (THEHARVESTER_PATH)'),
('Shodan', 'Shodan Intelligence', 'RECONNAISSANCE', 'EXTERNAL_API', 
 'Search engine for Internet-connected devices providing external intelligence on target host banners and known exposures.', 
 'External intelligence lookup, IP banner query, CVE exposure correlation, open port verification', TRUE, 'NOT_CONFIGURED', 'Requires Shodan API Key configured server-side (SHODAN_API_KEY)')
ON CONFLICT (tool_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    category = EXCLUDED.category,
    integration_type = EXCLUDED.integration_type,
    description = EXCLUDED.description,
    supported_operations = EXCLUDED.supported_operations,
    authorization_required = EXCLUDED.authorization_required;

-- Category B: WEB SECURITY
INSERT INTO security_tools_status (tool_name, display_name, category, integration_type, description, supported_operations, authorization_required, status, configuration_status)
VALUES 
('Burp Suite', 'PortSwigger Burp Suite', 'WEB_SECURITY', 'MANAGED_SECURITY_PLATFORM', 
 'Enterprise web application security platform for controlled automated scanning, crawling, and API testing.', 
 'REST API scan triggering, crawler orchestration, enterprise issue synchronization', TRUE, 'NOT_CONFIGURED', 'Requires Burp REST API / Enterprise endpoint configured (BURP_API_URL)'),
('OWASP ZAP', 'OWASP Zed Attack Proxy', 'WEB_SECURITY', 'EXECUTABLE_SCANNER', 
 'Open source web application security scanner for passive analysis, spidering, and controlled vulnerability scanning.', 
 'Passive HTTP traffic analysis, web spidering, controlled active scanning, OWASP Top 10 rule verification', TRUE, 'NOT_CONFIGURED', 'Requires OWASP ZAP executable or CLI in PATH (ZAP_PATH)'),
('Nikto', 'Nikto Web Server Scanner', 'WEB_SECURITY', 'EXECUTABLE_SCANNER', 
 'Comprehensive web server scanner for detecting dangerous files, outdated server software, and misconfigurations.', 
 'Web server configuration auditing, outdated program checks, dangerous file detection, header checks', TRUE, 'NOT_CONFIGURED', 'Requires Nikto executable on system PATH (NIKTO_PATH)'),
('Gobuster', 'Gobuster Directory Scanner', 'WEB_SECURITY', 'EXECUTABLE_SCANNER', 
 'High-speed content discovery tool used to enumerate hidden directories, files, and virtual hosts within authorized scope.', 
 'URI path discovery, directory enumeration, DNS virtual host discovery, file extension auditing', TRUE, 'NOT_CONFIGURED', 'Requires Gobuster executable on system PATH (GOBUSTER_PATH)'),
('SQLmap', 'SQLmap Injection Assessor', 'WEB_SECURITY', 'EXECUTABLE_SCANNER', 
 'Automated tool for detecting SQL injection vulnerabilities in target applications. High-risk tool strictly gated by authorization.', 
 'Controlled blind/error-based/boolean SQL injection testing, DBMS fingerprinting, non-destructive verification', TRUE, 'NOT_CONFIGURED', 'Requires SQLmap executable in PATH (SQLMAP_PATH) and explicit profile confirmation')
ON CONFLICT (tool_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    category = EXCLUDED.category,
    integration_type = EXCLUDED.integration_type,
    description = EXCLUDED.description,
    supported_operations = EXCLUDED.supported_operations,
    authorization_required = EXCLUDED.authorization_required;

-- Category C: NETWORK SECURITY / TELEMETRY / IDS
INSERT INTO security_tools_status (tool_name, display_name, category, integration_type, description, supported_operations, authorization_required, status, configuration_status)
VALUES 
('Wireshark', 'Wireshark / TShark', 'NETWORK_SECURITY', 'PACKET_ANALYSIS', 
 'World standard network packet analyzer used for deep packet inspection and network protocol dissection.', 
 'PCAP packet inspection, TLS handshake dissection, TCP stream reconstruction, protocol statistics', TRUE, 'NOT_CONFIGURED', 'Requires TShark/Wireshark executable on system PATH (WIRESHARK_PATH)'),
('tcpdump', 'tcpdump Packet Capture', 'NETWORK_SECURITY', 'PACKET_ANALYSIS', 
 'Command-line packet analyzer for capturing and filtering network traffic on authorized network interfaces.', 
 'Controlled network traffic capture, Berkeley Packet Filter (BPF) analysis, PCAP dumping', TRUE, 'NOT_CONFIGURED', 'Requires tcpdump executable on system PATH (TCPDUMP_PATH)'),
('Zeek', 'Zeek Network Security Monitor', 'NETWORK_SECURITY', 'TELEMETRY_SOURCE', 
 'Powerful network security monitoring engine that translates packet streams into structured security event telemetry.', 
 'Connection logging, HTTP transaction telemetry, DNS querying logs, SSL/TLS certificate logging, anomaly detection', TRUE, 'NOT_CONFIGURED', 'Requires Zeek engine / log ingestion directory configured (ZEEK_PATH)'),
('Suricata', 'Suricata IDS/IPS Engine', 'NETWORK_SECURITY', 'IDS_ENGINE', 
 'High performance Network IDS, IPS, and Network Security Monitoring engine with multi-threaded rule processing.', 
 'Signature-based intrusion detection, EVE JSON alert ingestion, protocol identification, file extraction', TRUE, 'NOT_CONFIGURED', 'Requires Suricata executable or EVE log ingestion configured (SURICATA_PATH)'),
('Snort', 'Snort Network IDS', 'NETWORK_SECURITY', 'IDS_ENGINE', 
 'Open-source network intrusion detection system capable of performing real-time traffic analysis and packet logging.', 
 'Signature matching, protocol analysis, fast alert log processing, rule-based traffic inspection', TRUE, 'NOT_CONFIGURED', 'Requires Snort engine or alert log ingestion configured (SNORT_PATH)')
ON CONFLICT (tool_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    category = EXCLUDED.category,
    integration_type = EXCLUDED.integration_type,
    description = EXCLUDED.description,
    supported_operations = EXCLUDED.supported_operations,
    authorization_required = EXCLUDED.authorization_required;

-- Category D: BLUE TEAM / SOC / SIEM
INSERT INTO security_tools_status (tool_name, display_name, category, integration_type, description, supported_operations, authorization_required, status, configuration_status)
VALUES 
('Wazuh', 'Wazuh SIEM & XDR', 'BLUE_TEAM_SIEM', 'SIEM_CONNECTOR', 
 'Open source security monitoring platform providing endpoint security, threat intelligence, and compliance monitoring.', 
 'Wazuh manager REST API connectivity, agent status verification, security alert ingestion, rootcheck monitoring', TRUE, 'NOT_CONFIGURED', 'Requires Wazuh API credentials configured server-side (WAZUH_URL, WAZUH_USER, WAZUH_PASSWORD)'),
('Splunk', 'Splunk Enterprise Security', 'BLUE_TEAM_SIEM', 'SIEM_CONNECTOR', 
 'Industry leading security information and event management platform for searching, monitoring, and analyzing security logs.', 
 'Splunk REST API connectivity, saved search query execution, security index event correlation, alert ingestion', TRUE, 'NOT_CONFIGURED', 'Requires Splunk URL and Authentication Token configured server-side (SPLUNK_URL, SPLUNK_TOKEN)'),
('Elastic Security', 'Elastic Security (ELK)', 'BLUE_TEAM_SIEM', 'SIEM_CONNECTOR', 
 'Unified SIEM and endpoint security platform built on Elasticsearch for real-time threat hunting and alert aggregation.', 
 'Elasticsearch REST API connectivity, security detection alert query, index ingestion, ECS event correlation', TRUE, 'NOT_CONFIGURED', 'Requires Elastic URL and API Key configured server-side (ELASTIC_URL, ELASTIC_API_KEY)'),
('Microsoft Sentinel', 'Microsoft Sentinel (Azure)', 'BLUE_TEAM_SIEM', 'SIEM_CONNECTOR', 
 'Cloud-native SIEM and SOAR solution delivering intelligent security analytics and threat intelligence across the enterprise.', 
 'Log Analytics REST API connectivity, KQL alert query ingestion, incident synchronization', TRUE, 'NOT_CONFIGURED', 'Requires Azure Tenant, Client ID and Secret configured server-side (SENTINEL_WORKSPACE_ID)'),
('Security Onion', 'Security Onion SOC Platform', 'BLUE_TEAM_SIEM', 'SIEM_CONNECTOR', 
 'Integrated Linux distribution for threat hunting, enterprise security monitoring, and log management.', 
 'SOC API connectivity, network alert ingestion, hunt dataset synchronization, sensor status verification', TRUE, 'NOT_CONFIGURED', 'Requires Security Onion API endpoint configured server-side (SECURITY_ONION_URL)')
ON CONFLICT (tool_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    category = EXCLUDED.category,
    integration_type = EXCLUDED.integration_type,
    description = EXCLUDED.description,
    supported_operations = EXCLUDED.supported_operations,
    authorization_required = EXCLUDED.authorization_required;

-- Category E: DIGITAL FORENSICS / REVERSE ENGINEERING
INSERT INTO security_tools_status (tool_name, display_name, category, integration_type, description, supported_operations, authorization_required, status, configuration_status)
VALUES 
('Autopsy', 'Autopsy Digital Forensics', 'DIGITAL_FORENSICS', 'FORENSICS_TOOL', 
 'Premier digital forensics platform used to investigate artifacts on digital evidence files and forensic disk images.', 
 'Forensic case metadata inspection, disk image artifact parsing, keyword search, timeline ingestion', TRUE, 'NOT_CONFIGURED', 'Requires Autopsy CLI / Autopsy engine configured (AUTOPSY_PATH)'),
('FTK Imager', 'AccessData FTK Imager', 'DIGITAL_FORENSICS', 'FORENSICS_TOOL', 
 'Data preview and imaging tool used for acquiring evidence without making changes to original evidence.', 
 'Evidence container integrity verification, SHA-256 and MD5 hash computation, forensic image validation', TRUE, 'NOT_CONFIGURED', 'Requires FTK Imager CLI tool configured (FTK_IMAGER_PATH)'),
('Volatility', 'Volatility Memory Forensics', 'DIGITAL_FORENSICS', 'FORENSICS_TOOL', 
 'Advanced memory forensics framework for extraction of digital artifacts from volatile memory (RAM) dumps.', 
 'Memory image inspection, active process tree enumeration (pslist), network socket analysis (netscan), kernel module checks', TRUE, 'NOT_CONFIGURED', 'Requires Volatility 3 executable on system PATH (VOLATILITY_PATH)'),
('Plaso', 'Plaso (log2timeline)', 'DIGITAL_FORENSICS', 'FORENSICS_TOOL', 
 'Python-based engine for extracting timestamps from various files found on typical computer systems to produce a super-timeline.', 
 'Super-timeline generation, timestamp extraction, storage file parsing, event sequence reconstruction', TRUE, 'NOT_CONFIGURED', 'Requires Plaso/log2timeline executable on system PATH (PLASO_PATH)'),
('Ghidra', 'NSA Ghidra SRE Suite', 'DIGITAL_FORENSICS', 'REVERSE_ENGINEERING_TOOL', 
 'Software reverse engineering framework for analyzing compiled binaries, extracting symbols, and inspecting machine code.', 
 'Headless binary analysis, function disassembly, string reference extraction, imported library auditing', TRUE, 'NOT_CONFIGURED', 'Requires Ghidra headless analyzer on system PATH (GHIDRA_PATH)')
ON CONFLICT (tool_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    category = EXCLUDED.category,
    integration_type = EXCLUDED.integration_type,
    description = EXCLUDED.description,
    supported_operations = EXCLUDED.supported_operations,
    authorization_required = EXCLUDED.authorization_required;
