export type ThreatVerdict = 'MALICIOUS' | 'SUSPICIOUS' | 'LIKELY_SAFE' | 'UNKNOWN';

export interface UrlHeuristic {
  protocol?: string;
  host?: string;
  pathname?: string;
  search?: string;
  tld?: string;
  isSuspiciousTld?: boolean;
  isIpHost?: boolean;
  detectedBrands?: string[];
  matchedKeywords?: string[];
  hasAtSymbol?: boolean;
  isExcessiveSubdomains?: boolean;
  error?: string;
  rawUrl?: string;
}

export interface UrlAnalysisResult {
  verdict: ThreatVerdict;
  riskScore: number;
  threatCategory: string;
  targetedEntity: string;
  detectedTactics: string[];
  domainAnalysis: {
    rootDomain: string;
    isSpoofed: boolean;
    tldReputation: string;
    structureFlags: string;
  };
  immediateAdvice: string[];
  technicalExplanation: string;
}

export interface MessageAnalysisResult {
  verdict: 'HIGH_RISK_SCAM' | 'SUSPICIOUS' | 'LIKELY_SAFE';
  riskScore: number;
  scamName: string;
  impersonatedParty: string;
  psychologicalTriggers: string[];
  redFlags: string[];
  extractedUrlsOrNumbers: string[];
  safeResponseRecommendation: 'DO_NOT_REPLY_AND_BLOCK' | 'VERIFY_OUT_OF_BAND' | 'SAFE_TO_CONTINUE';
  suggestedAction: string;
  whatIfAlreadyResponded: string[];
  summary: string;
}

export interface ContainmentStep {
  priority: 'URGENT' | 'TODAY' | 'ONGOING' | string;
  action: string;
  detail: string;
}

export interface ReportingAgency {
  agency: string;
  url: string;
  purpose: string;
  whatToReport: string;
}

export interface InvestigationResult {
  incidentSeverity: 'CRITICAL' | 'ELEVATED' | 'SUSPICIOUS' | 'LOW_RISK' | string;
  schemeClassification: string;
  confidenceLevel: string;
  threatActorPlaybook: string[];
  currentPhase: string;
  immediateContainmentPlan: ContainmentStep[];
  criticalWarnings: string[];
  officialReportingChannels: ReportingAgency[];
  evidencePreservationChecklist: string[];
  executiveSummary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  imageBase64?: string;
  mimeType?: string;
  imagePreview?: string;
}

export interface ThreatSampleUrl {
  title: string;
  url: string;
  type: string;
}

export interface ThreatSampleMessage {
  title: string;
  platform: string;
  sender: string;
  text: string;
}

export interface ThreatSampleInteraction {
  title: string;
  platform: string;
  personaClaimed: string;
  requestMade: string;
  financialExposure: string;
  credentialsExposed: string;
  timeframe: string;
}

export interface ThreatSamplesData {
  urls: ThreatSampleUrl[];
  messages: ThreatSampleMessage[];
  interactions: ThreatSampleInteraction[];
}
