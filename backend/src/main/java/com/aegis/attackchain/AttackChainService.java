package com.aegis.attackchain;

import com.aegis.detection.DetectionConfidence;
import com.aegis.investigation.TimelineEvent;
import com.aegis.investigation.TimelineEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AttackChainService {

    private final AttackChainRepository chainRepository;
    private final AttackChainNodeRepository nodeRepository;
    private final AttackChainEdgeRepository edgeRepository;
    private final TimelineEventRepository timelineEventRepository;

    public AttackChainService(AttackChainRepository chainRepository,
                             AttackChainNodeRepository nodeRepository,
                             AttackChainEdgeRepository edgeRepository,
                             TimelineEventRepository timelineEventRepository) {
        this.chainRepository = chainRepository;
        this.nodeRepository = nodeRepository;
        this.edgeRepository = edgeRepository;
        this.timelineEventRepository = timelineEventRepository;
    }

    public AttackChain getOrCreateAttackChain(UUID investigationId) {
        Optional<AttackChain> existing = chainRepository.findByInvestigationId(investigationId);
        if (existing.isPresent()) {
            return existing.get();
        }
        return rebuildAttackChain(investigationId);
    }

    @Transactional
    public AttackChain rebuildAttackChain(UUID investigationId) {
        AttackChain chain = chainRepository.findByInvestigationId(investigationId)
                .orElseGet(() -> {
                    AttackChain ac = new AttackChain();
                    ac.setInvestigationId(investigationId);
                    ac.setTitle("Evidence-Driven Attack Chain");
                    ac.setConfidence(DetectionConfidence.MEDIUM);
                    return chainRepository.save(ac);
                });

        // Clear existing nodes and edges for rebuild
        List<AttackChainEdge> existingEdges = edgeRepository.findByAttackChainId(chain.getId());
        edgeRepository.deleteAll(existingEdges);
        List<AttackChainNode> existingNodes = nodeRepository.findByAttackChainIdOrderByEventTimeAsc(chain.getId());
        nodeRepository.deleteAll(existingNodes);

        List<TimelineEvent> timeline = timelineEventRepository.findByInvestigationIdOrderByEventTimeAsc(investigationId);

        if (timeline.isEmpty()) {
            // Default baseline node
            AttackChainNode baseNode = new AttackChainNode();
            baseNode.setAttackChainId(chain.getId());
            baseNode.setNodeType(AttackNodeType.RECONNAISSANCE);
            baseNode.setLabel("Initial Suspicious Activity Observed");
            baseNode.setEventTime(OffsetDateTime.now());
            baseNode.setConfidence(DetectionConfidence.MEDIUM);
            nodeRepository.save(baseNode);
            return chain;
        }

        List<AttackChainNode> createdNodes = new ArrayList<>();
        for (int i = 0; i < timeline.size(); i++) {
            TimelineEvent te = timeline.get(i);
            AttackChainNode node = new AttackChainNode();
            node.setAttackChainId(chain.getId());
            node.setEventTime(te.getEventTime());
            node.setLabel(te.getTitle());
            node.setConfidence(te.getConfidence());

            if (i == 0) {
                node.setNodeType(AttackNodeType.RECONNAISSANCE);
            } else if (te.getEventType().contains("PROBE") || te.getEventType().contains("REQUEST")) {
                node.setNodeType(AttackNodeType.PROBE);
            } else if (te.getEventType().contains("SQL") || te.getEventType().contains("XSS") || te.getEventType().contains("COMMAND")) {
                node.setNodeType(AttackNodeType.EXPLOIT_ATTEMPT);
            } else {
                node.setNodeType(AttackNodeType.UNKNOWN);
            }
            createdNodes.add(nodeRepository.save(node));
        }

        // Add Potential Impact node
        AttackChainNode impactNode = new AttackChainNode();
        impactNode.setAttackChainId(chain.getId());
        impactNode.setNodeType(AttackNodeType.IMPACT);
        impactNode.setLabel("POTENTIAL_IMPACT (Under Investigation)");
        impactNode.setEventTime(createdNodes.get(createdNodes.size() - 1).getEventTime().plusSeconds(1));
        impactNode.setConfidence(DetectionConfidence.LOW);
        createdNodes.add(nodeRepository.save(impactNode));

        // Create edges connecting sequence
        for (int i = 0; i < createdNodes.size() - 1; i++) {
            AttackChainNode from = createdNodes.get(i);
            AttackChainNode to = createdNodes.get(i + 1);

            AttackChainEdge edge = new AttackChainEdge();
            edge.setAttackChainId(chain.getId());
            edge.setFromNodeId(from.getId());
            edge.setToNodeId(to.getId());

            if (to.getNodeType() == AttackNodeType.IMPACT) {
                edge.setRelationship(AttackEdgeRelationship.POTENTIALLY_LEADS_TO);
            } else {
                edge.setRelationship(AttackEdgeRelationship.PRECEDES);
            }
            edge.setConfidence(DetectionConfidence.MEDIUM);
            edgeRepository.save(edge);
        }

        return chain;
    }

    public List<AttackChainNode> getNodes(UUID attackChainId) {
        return nodeRepository.findByAttackChainIdOrderByEventTimeAsc(attackChainId);
    }

    public List<AttackChainEdge> getEdges(UUID attackChainId) {
        return edgeRepository.findByAttackChainId(attackChainId);
    }
}
