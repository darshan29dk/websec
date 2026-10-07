package com.aegis.retest.repository;

import com.aegis.retest.entity.RetestCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RetestCheckRepository extends JpaRepository<RetestCheck, UUID> {
    Optional<RetestCheck> findByUuid(String uuid);
    List<RetestCheck> findByRetestIdOrderByCreatedAtAsc(UUID retestId);
}
