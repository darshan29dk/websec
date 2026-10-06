# AEGIS Phase 3: Attack Surface Model & Asset Correlation

## 1. Asset Inventory Model
The attack surface model creates persistent, normalized representations of target infrastructure derived strictly from Phase 2 tool evidence.

### Supported Asset Types (`asset_type`)
- `DOMAIN` & `SUBDOMAIN`: Target domains parsed from HTTP headers and ZAP/WhatWeb output.
- `HOST` & `IP_ADDRESS`: Resolved IP addresses and hostnames.
- `PORT`: Discovered open network ports (TCP/UDP).
- `SERVICE`: Protocol services (HTTPS, HTTP, SSH, MySQL, etc.) with detected products and versions.
- `TECHNOLOGY`: Web application frameworks, web servers, CMS, JavaScript libraries, and runtimes (e.g., Nginx, React, Express, PHP).
- `WEB_APPLICATION`: Discovered web application root base URLs.
- `ENDPOINT` & `API`: Discovered HTTP paths, REST API endpoints (`/api/`, `/v1/`, JSON content-types), and GraphQL endpoints.
- `PARAMETER`: Query, path, header, cookie, and request body parameters parsed safely.
- `TLS_ENDPOINT`: TLS/SSL endpoints with observed protocol versions and certificate details.

## 2. Asset Normalization Rules
1. **Host & IP Normalization**: Strips schemes (`http://`, `https://`), trailing slashes, default ports (`80`, `443`), converts to lowercase, and validates IPv4/IPv6 structure.
2. **URL Normalization**: Normalizes query parameters, method verb uppercase formatting, and path slashes.
3. **Evidence-backed Relationships**: Assets are linked via strict relationship types:
   - `RESOLVES_TO`: Domain -> IP Address
   - `HOSTS`: IP Address -> Port
   - `EXPOSES`: Port -> Service
   - `SERVES`: Service -> Web Application
   - `USES`: Web Application -> Technology
   - `CONTAINS`: Web Application -> Endpoint
