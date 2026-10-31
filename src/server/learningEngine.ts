// AWM Cyber AI Enterprise - AI Learning Loop & Feedback Engine
// Continuous model calibration, SOC feedback telemetry, and policy optimization

export interface SocFeedbackRecord {
  feedbackId: string;
  decisionId: string;
  alertId: string;
  threatScore: number;
  confidenceScore: number;
  recommendedAction: string;
  socAction: "APPROVED" | "REJECTED" | "MODIFIED";
  modifiedAction?: string;
  analystComment?: string;
  wasFalsePositive: boolean;
  timestamp: string;
}

export interface ModelAccuracyMetrics {
  totalEvaluations: number;
  approvedCount: number;
  rejectedCount: number;
  modifiedCount: number;
  falsePositiveRate: number; // Percentage
  confidenceCalibrationScore: number; // 0-100
  topRejectedActions: Array<{ action: string; count: number }>;
  recommendedPolicyUpdates: string[];
}

export class LearningEngine {
  private feedbackStore: SocFeedbackRecord[] = [
    {
      feedbackId: "FB-001",
      decisionId: "DEC-8801",
      alertId: "ALT-9001",
      threatScore: 92,
      confidenceScore: 94,
      recommendedAction: "Isolate Endpoint Network (EP-WIN-DC02)",
      socAction: "REJECTED",
      analystComment: "Domain controller active during maintenance window.",
      wasFalsePositive: true,
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      feedbackId: "FB-002",
      decisionId: "DEC-8802",
      alertId: "ALT-9002",
      threatScore: 98,
      confidenceScore: 99,
      recommendedAction: "Block IP 185.220.101.5",
      socAction: "APPROVED",
      wasFalsePositive: false,
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];

  public recordFeedback(feedback: Omit<SocFeedbackRecord, "feedbackId" | "timestamp">): SocFeedbackRecord {
    const record: SocFeedbackRecord = {
      ...feedback,
      feedbackId: `FB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.feedbackStore.push(record);
    return record;
  }

  public calculateMetrics(): ModelAccuracyMetrics {
    const totalEvaluations = this.feedbackStore.length;
    if (totalEvaluations === 0) {
      return {
        totalEvaluations: 0,
        approvedCount: 0,
        rejectedCount: 0,
        modifiedCount: 0,
        falsePositiveRate: 0,
        confidenceCalibrationScore: 100,
        topRejectedActions: [],
        recommendedPolicyUpdates: ["Collect more SOC analyst feedback baseline."],
      };
    }

    const approvedCount = this.feedbackStore.filter((f) => f.socAction === "APPROVED").length;
    const rejectedCount = this.feedbackStore.filter((f) => f.socAction === "REJECTED").length;
    const modifiedCount = this.feedbackStore.filter((f) => f.socAction === "MODIFIED").length;
    const falsePositives = this.feedbackStore.filter((f) => f.wasFalsePositive).length;

    const falsePositiveRate = Math.round((falsePositives / totalEvaluations) * 1000) / 10;
    const accuracyRatio = approvedCount / totalEvaluations;
    const confidenceCalibrationScore = Math.round(accuracyRatio * 95);

    const rejectedMap = new Map<string, number>();
    this.feedbackStore.forEach((f) => {
      if (f.socAction === "REJECTED") {
        rejectedMap.set(f.recommendedAction, (rejectedMap.get(f.recommendedAction) || 0) + 1);
      }
    });

    const topRejectedActions = Array.from(rejectedMap.entries()).map(([action, count]) => ({ action, count }));

    const recommendedPolicyUpdates: string[] = [];
    if (falsePositiveRate > 10) {
      recommendedPolicyUpdates.push("Increase minimum confidence score threshold for critical host isolation from 95% to 97%.");
    }
    if (topRejectedActions.length > 0) {
      recommendedPolicyUpdates.push(`Review SOC rejection patterns on action "${topRejectedActions[0].action}".`);
    }
    if (recommendedPolicyUpdates.length === 0) {
      recommendedPolicyUpdates.push("AI decision calibration optimal. Continue baseline monitoring.");
    }

    return {
      totalEvaluations,
      approvedCount,
      rejectedCount,
      modifiedCount,
      falsePositiveRate,
      confidenceCalibrationScore,
      topRejectedActions,
      recommendedPolicyUpdates,
    };
  }

  public getFeedbackHistory(): SocFeedbackRecord[] {
    return [...this.feedbackStore];
  }
}

export const learningEngine = new LearningEngine();
