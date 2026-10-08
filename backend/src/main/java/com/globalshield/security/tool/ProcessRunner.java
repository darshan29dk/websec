package com.globalshield.security.tool;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.*;

@Component
public class ProcessRunner {

    private static final Logger log = LoggerFactory.getLogger(ProcessRunner.class);
    private static final int MAX_OUTPUT_BYTES = 1_048_576; // 1 MB max output per stream

    public ProcessRunnerResult runProcess(List<String> command, Duration timeout) {
        if (command == null || command.isEmpty()) {
            throw new IllegalArgumentException("Command list cannot be empty");
        }

        log.info("Executing process: {}", String.join(" ", command));

        Instant startTime = Instant.now();
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(false);

        Process process = null;
        ExecutorService streamReadExecutor = Executors.newFixedThreadPool(2);

        try {
            process = processBuilder.start();

            Process finalProcess = process;
            Future<String> stdoutFuture = streamReadExecutor.submit(() -> readStream(finalProcess.getInputStream()));
            Future<String> stderrFuture = streamReadExecutor.submit(() -> readStream(finalProcess.getErrorStream()));

            boolean completed = process.waitFor(timeout.toSeconds(), TimeUnit.SECONDS);

            Instant endTime = Instant.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();

            if (!completed) {
                log.warn("Process timed out after {} seconds: {}", timeout.toSeconds(), command.get(0));
                process.destroyForcibly();
                streamReadExecutor.shutdownNow();
                return ProcessRunnerResult.builder()
                        .exitCode(-1)
                        .stdout(getFutureResultOrEmpty(stdoutFuture))
                        .stderr(getFutureResultOrEmpty(stderrFuture))
                        .errorMessage("Execution timed out after " + timeout.toSeconds() + " seconds")
                        .durationMs(durationMs)
                        .timedOut(true)
                        .build();
            }

            int exitCode = process.exitValue();
            String stdout = stdoutFuture.get(5, TimeUnit.SECONDS);
            String stderr = stderrFuture.get(5, TimeUnit.SECONDS);

            return ProcessRunnerResult.builder()
                    .exitCode(exitCode)
                    .stdout(stdout)
                    .stderr(stderr)
                    .errorMessage(exitCode != 0 ? "Process exited with code " + exitCode : null)
                    .durationMs(durationMs)
                    .timedOut(false)
                    .build();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            if (process != null) process.destroyForcibly();
            return ProcessRunnerResult.builder()
                    .exitCode(-1)
                    .errorMessage("Execution interrupted: " + e.getMessage())
                    .durationMs(Duration.between(startTime, Instant.now()).toMillis())
                    .timedOut(false)
                    .build();
        } catch (Exception e) {
            log.error("Failed to execute process {}: {}", command.get(0), e.getMessage());
            if (process != null) process.destroyForcibly();
            return ProcessRunnerResult.builder()
                    .exitCode(-1)
                    .errorMessage("Process execution error: " + e.getMessage())
                    .durationMs(Duration.between(startTime, Instant.now()).toMillis())
                    .timedOut(false)
                    .build();
        } finally {
            streamReadExecutor.shutdownNow();
        }
    }

    private String readStream(InputStream inputStream) {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            char[] buffer = new char[4096];
            int numRead;
            int totalBytes = 0;
            while ((numRead = reader.read(buffer)) != -1) {
                if (totalBytes + numRead > MAX_OUTPUT_BYTES) {
                    sb.append(buffer, 0, MAX_OUTPUT_BYTES - totalBytes);
                    sb.append("\n[OUTPUT TRUNCATED: Exceeded 1MB limit]");
                    break;
                }
                sb.append(buffer, 0, numRead);
                totalBytes += numRead;
            }
        } catch (Exception e) {
            sb.append("\n[Stream read error: ").append(e.getMessage()).append("]");
        }
        return sb.toString();
    }

    private String getFutureResultOrEmpty(Future<String> future) {
        try {
            return future.get(1, TimeUnit.SECONDS);
        } catch (Exception e) {
            return "";
        }
    }

    @lombok.Data
    @lombok.Builder
    public static class ProcessRunnerResult {
        private int exitCode;
        private String stdout;
        private String stderr;
        private String errorMessage;
        private long durationMs;
        private boolean timedOut;
    }
}
