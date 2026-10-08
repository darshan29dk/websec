package com.globalshield.attacksurface.repository;

import com.globalshield.attacksurface.entity.ParameterLocation;
import com.globalshield.attacksurface.entity.WebEndpointParameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WebEndpointParameterRepository extends JpaRepository<WebEndpointParameter, UUID> {

    List<WebEndpointParameter> findByEndpointId(UUID endpointId);

    Optional<WebEndpointParameter> findByEndpointIdAndNameAndLocation(UUID endpointId, String name, ParameterLocation location);
}
