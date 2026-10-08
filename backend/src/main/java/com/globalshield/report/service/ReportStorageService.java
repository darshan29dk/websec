package com.globalshield.report.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
public class ReportStorageService {

    private final Path storageDir = Paths.get("scratch", "reports").toAbsolutePath().normalize();

    public ReportStorageService() {
        try {
            Files.createDirectories(storageDir);
        } catch (IOException e) {
            log.error("Could not initialize report storage directory", e);
        }
    }

    public String storeReport(String reportUuid, String fileExtension, byte[] content) throws IOException {
        String filename = "report_" + reportUuid + "." + fileExtension.toLowerCase();
        Path targetPath = storageDir.resolve(filename).normalize();

        if (!targetPath.startsWith(storageDir)) {
            throw new SecurityException("Path traversal attempt detected in report storage path");
        }

        Files.write(targetPath, content);
        return targetPath.toString();
    }

    public byte[] loadReport(String storageReference) throws IOException {
        Path path = Paths.get(storageReference).toAbsolutePath().normalize();
        if (!path.startsWith(storageDir)) {
            throw new SecurityException("Path traversal attempt detected reading report file");
        }
        return Files.readAllBytes(path);
    }
}
