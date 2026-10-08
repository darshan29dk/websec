package com.globalshield.finding.repository;

import com.globalshield.finding.entity.FindingComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FindingCommentRepository extends JpaRepository<FindingComment, UUID> {

    List<FindingComment> findByFindingIdOrderByCreatedAtDesc(UUID findingId);
}
