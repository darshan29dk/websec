export type NotificationType =
  | 'CRITICAL_FINDING'
  | 'HIGH_FINDING'
  | 'NEW_FINDING'
  | 'REGRESSION'
  | 'DEFENSE_VALIDATION_FAILURE'
  | 'MONITORING_FAILURE'
  | 'AUTHORIZATION_EXPIRING'
  | 'AUTHORIZATION_EXPIRED'
  | 'POSTURE_DECREASE';

export type NotificationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface NotificationDto {
  id: string;
  uuid: string;
  userEmail: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}
