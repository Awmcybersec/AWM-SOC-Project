// AWM Cyber AI Enterprise - Universal AI Provider Interface
// Abstraction layer supporting Online Agents, Offline Local AI, Hybrid Routing, & Enterprise Private Models

export type ModelType = "ONLINE_AGENT" | "OFFLINE_LOCAL" | "ENTERPRISE_PRIVATE" | "HYBRID";
export type AIMode = "OFFLINE_ONLY" | "ONLINE_ONLY" | "HYBRID" | "ENTERPRISE_PRIVATE";

export interface ModelHealth {
  providerId: string;
  name: string;
  type: ModelType;
  status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  latencyMs: number;
  lastChecked: string;
  errorRate: number; // percentage 0-100
  version: string;
  isOfflineCapable: boolean;
  details?: string;
}

export interface ThreatAnalysisInput {
  alertId?: string;
  title: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sourceIp?: string;
  targetIp?: string;
  domain?: string;
  fileHash?: string;
  device?: string;
  user?: string;
  rawLogs?: string[];
}

export interface ThreatAnalysis {
  threatScore: number; // 0-100
  confidenceScore: number; // 0-100
  verdict: "BENIGN" | "SUSPICIOUS" | "MALICIOUS";
  threatActor?: string;
  mitreTactic: string;
  mitreTechnique: string;
  mitreTechniqueId: string;
  summary: string;
  evidence: string[];
  providerUsed: string;
  modelUsed: string;
  executionMode: ModelType;
}

export interface AIExplanationInput {
  decisionId: string;
  action: string;
  target: string;
  threatScore: number;
  confidenceScore: number;
  assetCriticality: string;
  mitreTechniqueId?: string;
}

export interface AIExplanation {
  explanationId: string;
  naturalLanguageSummary: string;
  reasoning: string;
  riskAssessment: string;
  alternativeSuggestion: string;
  mitreSummary: string;
  confidencePercentage: string;
  providerUsed: string;
}

export interface ResponseRecommendationInput {
  alertId: string;
  title: string;
  severity: string;
  targetAsset: string;
  affectedUser?: string;
}

export interface ResponseRecommendation {
  recommendedAction: string;
  alternativeActions: string[];
  blastRadiusAssessment: string;
  automationTier: "CRITICAL_AUTOMATION" | "HUMAN_APPROVAL" | "MONITOR_MODE";
  providerUsed: string;
}

export interface LogAnalysisInput {
  logType: string;
  logs: string[];
  correlationScope?: string;
}

export interface AnalysisResult {
  anomaliesDetected: number;
  summary: string;
  indicators: Array<{ type: string; value: string; severity: string }>;
  recommendedPlaybooks: string[];
  providerUsed: string;
}

export interface AIProvider {
  id: string;
  name: string;
  type: ModelType;
  version: string;
  isOffline: boolean;
  costPer1kInputTokens?: number;
  costPer1kOutputTokens?: number;

  analyzeThreat(event: ThreatAnalysisInput): Promise<ThreatAnalysis>;
  explainDecision(input: AIExplanationInput): Promise<AIExplanation>;
  generateResponse(alert: ResponseRecommendationInput): Promise<ResponseRecommendation>;
  analyzeLogs(input: LogAnalysisInput): Promise<AnalysisResult>;
  generateChatResponse?(prompt: string, history?: Array<{ sender: string; text: string }>, context?: any): Promise<string>;
  streamChatResponse?(
    prompt: string,
    onChunk: (chunk: string) => void,
    history?: Array<{ sender: string; text: string }>,
    context?: any
  ): Promise<void>;
  healthCheck(): Promise<ModelHealth>;
}
