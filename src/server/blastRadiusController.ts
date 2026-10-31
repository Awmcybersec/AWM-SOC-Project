// AWM Cyber AI Enterprise - Blast Radius Controller
// Enforces staged containment and prevents collateral operational outages

export interface StagedContainmentStep {
  stepNumber: number;
  name: string;
  description: string;
  action: string;
  target: string;
  executed: boolean;
  timestamp?: string;
}

export interface BlastRadiusPlan {
  planId: string;
  targetIdentifier: string;
  targetType: "IDENTITY" | "ENDPOINT" | "NETWORK";
  maxAllowedScope: string;
  stagedSteps: StagedContainmentStep[];
  status: "INITIALIZED" | "IN_PROGRESS" | "COMPLETED" | "HALTED";
  createdTimestamp: string;
}

export class BlastRadiusController {
  public generateStagedPlan(targetIdentifier: string, targetType: "IDENTITY" | "ENDPOINT" | "NETWORK"): BlastRadiusPlan {
    const planId = `BLAST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdTimestamp = new Date().toISOString();

    let stagedSteps: StagedContainmentStep[] = [];

    if (targetType === "IDENTITY") {
      stagedSteps = [
        {
          stepNumber: 1,
          name: "Terminate Active Sessions",
          description: "Instantly invalidate current web app & OAuth sessions without locking account permanently.",
          action: "TERMINATE_SESSIONS",
          target: targetIdentifier,
          executed: false,
        },
        {
          stepNumber: 2,
          name: "Revoke Refresh Tokens & API Keys",
          description: "Revoke OAuth tokens, access tokens, and stored bearer keys in Google Workspace / Okta.",
          action: "REVOKE_TOKENS",
          target: targetIdentifier,
          executed: false,
        },
        {
          stepNumber: 3,
          name: "Force Step-Up MFA Challenge",
          description: "Require immediate multi-factor authentication on next login attempt.",
          action: "REQUIRE_MFA",
          target: targetIdentifier,
          executed: false,
        },
        {
          stepNumber: 4,
          name: "Full Account Disabling",
          description: "Disable Active Directory / LDAP user object only if attack telemetry persists.",
          action: "DISABLE_ACCOUNT",
          target: targetIdentifier,
          executed: false,
        },
      ];
    } else if (targetType === "ENDPOINT") {
      stagedSteps = [
        {
          stepNumber: 1,
          name: "Network Bandwidth Throttling & TCP Restrict",
          description: "Limit host network speeds to 64kbps and restrict high-risk ports.",
          action: "THROTTLE_NETWORK",
          target: targetIdentifier,
          executed: false,
        },
        {
          stepNumber: 2,
          name: "Process Suspension",
          description: "Freeze offending process execution tree using SIGSTOP / Windows Suspend.",
          action: "SUSPEND_PROCESS",
          target: targetIdentifier,
          executed: false,
        },
        {
          stepNumber: 3,
          name: "Selective Firewall Isolation",
          description: "Allow only SOC management IPs while severing lateral intranet access.",
          action: "MANAGEMENT_ONLY_ISOLATION",
          target: targetIdentifier,
          executed: false,
        },
        {
          stepNumber: 4,
          name: "Complete Host Network Isolation",
          description: "Sever all physical & virtual NIC adapters from enterprise switch fabric.",
          action: "ISOLATE_HOST",
          target: targetIdentifier,
          executed: false,
        },
      ];
    } else {
      stagedSteps = [
        {
          stepNumber: 1,
          name: "Temporary 15-Minute Rate Limit",
          description: "Apply temporary rate-limiting firewall rule on ingress gateway.",
          action: "TEMP_RATE_LIMIT",
          target: targetIdentifier,
          executed: false,
        },
        {
          stepNumber: 2,
          name: "Single IP Block",
          description: "Block specific malicious source IP address.",
          action: "BLOCK_IP",
          target: targetIdentifier,
          executed: false,
        },
        {
          stepNumber: 3,
          name: "CIDR / Subnet Block",
          description: "Escalate to blocking full /24 CIDR subnet only if multi-vector attack is confirmed.",
          action: "BLOCK_CIDR",
          target: targetIdentifier,
          executed: false,
        },
      ];
    }

    return {
      planId,
      targetIdentifier,
      targetType,
      maxAllowedScope: targetType === "IDENTITY" ? "Single User Account" : "Single Host Machine",
      stagedSteps,
      status: "INITIALIZED",
      createdTimestamp,
    };
  }

  public executeNextStep(plan: BlastRadiusPlan): StagedContainmentStep | null {
    const nextStep = plan.stagedSteps.find((s) => !s.executed);
    if (!nextStep) {
      plan.status = "COMPLETED";
      return null;
    }
    nextStep.executed = true;
    nextStep.timestamp = new Date().toISOString();
    plan.status = "IN_PROGRESS";
    if (plan.stagedSteps.every((s) => s.executed)) {
      plan.status = "COMPLETED";
    }
    return nextStep;
  }
}

export const blastRadiusController = new BlastRadiusController();
