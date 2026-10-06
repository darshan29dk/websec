export type TargetType = 'WEB_URL';
export type TargetStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
export type ScopeType = 'DOMAIN' | 'URL' | 'IP' | 'PATH';
export type AuthorizationType = 'OWNER' | 'WRITTEN_PERMISSION' | 'LAB' | 'OTHER';

export interface TargetScope {
  id: string;
  targetId: string;
  scopeType: ScopeType;
  scopeValue: string;
  included: boolean;
  createdAt: string;
}

export interface TargetAuthorization {
  id: string;
  targetId: string;
  authorizationType: AuthorizationType;
  authorizationStatement: string;
  authorizedById: string;
  authorizedByName: string;
  authorizationDate: string;
  expirationDate: string;
  active: boolean;
  createdAt: string;
}

export interface Target {
  id: string;
  name: string;
  targetType: TargetType;
  primaryUrl: string;
  description?: string;
  status: TargetStatus;
  createdById: string;
  createdByName: string;
  authorized: boolean;
  authorizationExpirationDate?: string;
  scopes: TargetScope[];
  authorizations: TargetAuthorization[];
  createdAt: string;
  updatedAt: string;
}

export interface TargetRequest {
  name: string;
  primaryUrl: string;
  description?: string;
}

export interface TargetAuthorizationRequest {
  authorizationType: AuthorizationType;
  authorizationStatement: string;
  authorizationDate: string;
  expirationDate: string;
}

export interface TargetScopeRequest {
  scopeType: ScopeType;
  scopeValue: string;
  included?: boolean;
}
