// AWM Cyber AI Enterprise - Human Governance Engine
// Enterprise approval workflows, multi-tiered authority, and SOC governance auditability

export type GovernanceMode = "SINGLE_APPROVAL" | "MULTIPLE_APPROVAL" | "MANAGER_APPROVAL" | "EMERGENCY_OVERRIDE";
export type ApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "MODIFIED" | "ESCALATED";

export interface GovernancePolicy {
  id: string;
  name: string;
  minThreatScore: number;
  maxThreatScore: number;
  governanceMode: GovernanceMode;
  requiredApprovers: number;
  autoExpireMinutes: number;
}

export interface HumanApprovalRecord {
  requestId: string;
  alertId: string;
  targetIdentifier: string;
  recommendedAction: string;
  threatScore: number;
  confidenceScore: number;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  requestedBy: string; // "AWM AI Assistant"
  governanceMode: GovernanceMode;
  approvalsReceived: Array<{
    approver: string;
    action: "APPROVE" | "REJECT" | "MODIFY" | "ESCALATE";
    modifiedAction?: string;
    comment?: string;
    timestamp: string;
  }>;
  finalExecutedAction?: string;
  comments: string[];
}

export class HumanGovernanceEngine {
  private defaultPolicies: GovernancePolicy[] = [
    {
      id: "POL-001",
      name: "Standard SOC Analyst Approval",
      minThreatScore: 70,
      maxThreatScore: 89,
      governanceMode: "SINGLE_APPROVAL",
      requiredApprovers: 1,
      autoExpireMinutes: 30,
    },
    {
      id: "POL-002",
      name: "Critical Asset Manager Dual-Approval",
      minThreatScore: 90,
      maxThreatScore: 94,
      governanceMode: "MANAGER_APPROVAL",
      requiredApprovers: 2,
      autoExpireMinutes: 15,
    },
  ];

  public evaluateGovernanceMode(threatScore: number, assetCriticality: string): GovernanceMode {
    if (assetCriticality === "Domain Controller" || assetCriticality === "Production System") {
      return "MANAGER_APPROVAL";
    }
    if (threatScore >= 90) return "MULTIPLE_APPROVAL";
    return "SINGLE_APPROVAL";
  }

  public processApprovalAction(
    record: HumanApprovalRecord,
    approver: string,
    action: "APPROVE" | "REJECT" | "MODIFY" | "ESCALATE",
    modifiedAction?: string,
    comment?: string
  ): HumanApprovalRecord {
    const timestamp = new Date().toISOString();
    
    record.approvalsReceived.push({
      approver,
      action,
      modifiedAction,
      comment,
      timestamp,
    });

    if (comment) {
      record.comments.push(`[${timestamp}] ${approver}: ${comment}`);
    }

    if (action === "REJECT") {
      record.status = "REJECTED";
    } else if (action === "ESCALATE") {
      record.status = "ESCALATED";
      record.governanceMode = "MANAGER_APPROVAL";
    } else if (action === "MODIFY") {
      record.status = "MODIFIED";
      record.finalExecutedAction = modifiedAction || record.recommendedAction;
    } else if (action === "APPROVE") {
      const needed = record.governanceMode === "MULTIPLE_APPROVAL" || record.governanceMode === "MANAGER_APPROVAL" ? 2 : 1;
      const approvedCount = record.approvalsReceived.filter(a => a.action === "APPROVE").length;
      if (approvedCount >= needed) {
        record.status = "APPROVED";
        record.finalExecutedAction = record.recommendedAction;
      }
    }

    record.updatedAt = timestamp;
    return record;
  }

  public emergencyOverride(record: HumanApprovalRecord, managerUser: string, justification: string): HumanApprovalRecord {
    const timestamp = new Date().toISOString();
    record.governanceMode = "EMERGENCY_OVERRIDE";
    record.status = "APPROVED";
    record.finalExecutedAction = record.recommendedAction;
    record.approvalsReceived.push({
      approver: managerUser,
      action: "APPROVE",
      comment: `EMERGENCY OVERRIDE: ${justification}`,
      timestamp,
    });
    record.comments.push(`[${timestamp}] EMERGENCY OVERRIDE by ${managerUser}: ${justification}`);
    record.updatedAt = timestamp;
    return record;
  }
}

export const humanGovernanceEngine = new HumanGovernanceEngine();
