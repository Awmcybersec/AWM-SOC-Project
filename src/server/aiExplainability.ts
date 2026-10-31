// AWM Cyber AI Enterprise - AI Explainability Engine
// Generates transparent, human-auditable explanations for every autonomous response decision

import { DecisionResult } from "./aiDecisionEngine";

export interface FormattedExplanation {
  decision: string;
  reasoning: string;
  evidence: string[];
  confidencePercentage: string;
  riskLevel: string;
  mitreSummary: string;
  alternativeSuggestion: string;
  naturalLanguageSummary: string;
}

export class AiExplainabilityEngine {
  public generateExplanation(decisionResult: DecisionResult): FormattedExplanation {
    const confidencePercentage = `${decisionResult.confidenceScore}%`;
    const riskLevel = decisionResult.businessImpact;
    const mitreSummary = `${decisionResult.mitreMapping.technique} (${decisionResult.mitreMapping.techniqueId}) - Tactic: ${decisionResult.mitreMapping.tactic}`;
    const alternativeSuggestion = decisionResult.alternativeActions[0] || "Temporary 24-hour quarantine";

    const naturalLanguageSummary = `AWM AI Assistant recommended action [${decisionResult.recommendedAction}] based on a calculated Threat Score of ${decisionResult.threatScore}/100 and Confidence of ${confidencePercentage}. Identified risk level is ${riskLevel} targeting ${decisionResult.assetCriticality}.`;

    return {
      decision: decisionResult.recommendedAction,
      reasoning: decisionResult.reasoning,
      evidence: decisionResult.evidence,
      confidencePercentage,
      riskLevel,
      mitreSummary,
      alternativeSuggestion,
      naturalLanguageSummary,
    };
  }
}

export const aiExplainabilityEngine = new AiExplainabilityEngine();
