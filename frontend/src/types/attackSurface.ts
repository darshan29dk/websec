export type AssetType = 
  | 'DOMAIN'
  | 'SUBDOMAIN'
  | 'HOST'
  | 'IP_ADDRESS'
  | 'PORT'
  | 'SERVICE'
  | 'WEB_APPLICATION'
  | 'TECHNOLOGY'
  | 'API'
  | 'ENDPOINT'
  | 'PARAMETER'
  | 'TLS_ENDPOINT';

export type RelationshipType = 
  | 'RESOLVES_TO'
  | 'HOSTS'
  | 'EXPOSES'
  | 'RUNS'
  | 'USES'
  | 'SERVES'
  | 'CONTAINS'
  | 'LINKS_TO'
  | 'CALLS'
  | 'REDIRECTS_TO'
  | 'PROTECTED_BY'
  | 'ASSOCIATED_WITH';

export type EndpointType = 'WEB' | 'API' | 'GRAPHQL' | 'UNKNOWN';

export interface AttackSurfaceSummary {
  assessmentId: string;
  totalAssets: number;
  totalTechnologies: number;
  totalWebApplications: number;
  totalEndpoints: number;
  totalApiEndpoints: number;
  totalRelationships: number;
}

export interface AttackSurfaceAsset {
  id: string;
  uuid: string;
  assessmentId: string;
  assetType: AssetType;
  assetValue: string;
  normalizedValue: string;
  parentAssetId?: string;
  status: string;
  confidence: string;
  source: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface AttackSurfaceRelationship {
  id: string;
  uuid: string;
  assessmentId: string;
  sourceAssetId: string;
  sourceAssetValue: string;
  relationshipType: RelationshipType;
  targetAssetId: string;
  targetAssetValue: string;
  confidence: string;
  source: string;
  createdAt: string;
}

export interface Technology {
  id: string;
  assessmentId: string;
  name: string;
  category: string;
  version?: string;
  confidence: string;
  source: string;
  evidence?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface WebEndpoint {
  id: string;
  assessmentId: string;
  url: string;
  normalizedUrl: string;
  path: string;
  method: string;
  endpointType: EndpointType;
  statusCode?: number;
  contentType?: string;
  parametersPresent: boolean;
  authenticationObserved: boolean;
  source: string;
  confidence: string;
  firstSeenAt: string;
  lastSeenAt: string;
}
