package com.globalshield.defense.repository;

import com.globalshield.defense.entity.DefenseControl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DefenseControlRepository extends JpaRepository<DefenseControl, UUID> {
    Optional<DefenseControl> findByControlCode(String controlCode);
    List<DefenseControl> findByCategory(String category);
}
