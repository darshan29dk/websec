export interface TimelineEventItem {
  eventId: string;
  category: string;
  title: string;
  summary: string;
  severity: string;
  timestamp: string;
  resourceType?: string;
  resourceId?: string;
}

export interface SecurityHistoryTimelineDto {
  targetId: string;
  targetName: string;
  primaryUrl: string;
  currentScore: number;
  currentRiskLevel: string;
  events: TimelineEventItem[];
}
