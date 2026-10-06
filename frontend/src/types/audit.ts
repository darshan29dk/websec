export type AuditEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'TARGET_CREATED'
  | 'TARGET_UPDATED'
  | 'TARGET_DISABLED'
  | 'TARGET_ARCHIVED'
  | 'AUTHORIZATION_CREATED'
  | 'AUTHORIZATION_UPDATED'
  | 'ASSESSMENT_CREATED'
  | 'ASSESSMENT_CANCELLED';

export interface AuditEvent {
  id: string;
  actorUserId?: string;
  actorEmail?: string;
  eventType: AuditEventType;
  resourceType: string;
  resourceId?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditFilterParams {
  page?: number;
  size?: number;
  user?: string;
  eventType?: AuditEventType;
  resourceType?: string;
  search?: string;
}
