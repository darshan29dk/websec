package com.globalshield.forensics.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "network_forensic_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NetworkForensicEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private ForensicCase forensicCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id")
    private ForensicEvidence evidence;

    @Column(name = "event_time", nullable = false)
    private Instant eventTime;

    @Column(name = "source_ip", length = 64)
    private String sourceIp;

    @Column(name = "source_port")
    private Integer sourcePort;

    @Column(name = "destination_ip", length = 64)
    private String destinationIp;

    @Column(name = "destination_port")
    private Integer destinationPort;

    @Column(nullable = false, length = 32)
    private String protocol;

    @Column(length = 32)
    private String direction;

    @Column(name = "connection_state", length = 64)
    private String connectionState;

    @Column(name = "bytes_in")
    private Long bytesIn;

    @Column(name = "bytes_out")
    private Long bytesOut;

    @Column(name = "sensor_source")
    private String sensorSource;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
