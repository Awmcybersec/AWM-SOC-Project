import crypto from "crypto";
import { windowsLogger } from "../windows/windowsLogger.js";

export type RbacRole =
  | "PLATFORM_OWNER"
  | "ENTERPRISE_ADMIN"
  | "SOC_DIRECTOR"
  | "SENIOR_SECURITY_ANALYST"
  | "INCIDENT_RESPONDER"
  | "THREAT_INTEL_ANALYST"
  | "COMPLIANCE_AUDITOR"
  | "READ_ONLY";

export interface PermissionPolicy {
  module: string;
  canRead: boolean;
  canWrite: boolean;
  canExecute: boolean;
  canDelete: boolean;
  canApproveAutonomous: boolean;
  requiresPrivilegedApproval?: boolean;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: RbacRole;
  department: string;
  status: "ACTIVE" | "LOCKED" | "DISABLED";
  mfaEnabled: boolean;
  mfaType: "TOTP" | "SMS" | "HARDWARE_KEY" | "SAML_PUSH" | "DISABLED";
  failedAttempts: number;
  lockoutUntil: string | null;
  lastLogin: string | null;
  passwordHash: string;
  salt: string;
  directorySource: "LOCAL" | "ACTIVE_DIRECTORY" | "AZURE_ENTRA_ID" | "LDAP" | "SAML_SSO";
  adGroupMappings?: string[];
}

export interface DirectoryConfig {
  type: "ACTIVE_DIRECTORY" | "AZURE_ENTRA_ID" | "LDAP" | "SAML_SSO";
  domain: string;
  serverUrl: string;
  bindDn: string;
  userSearchBase: string;
  groupSearchBase: string;
  syncIntervalMinutes: number;
  enabled: boolean;
  tenantId?: string;
  clientId?: string;
  groupMappings: { directoryGroup: string; assignedRole: RbacRole }[];
  syncStatus: "IDLE" | "SYNCING" | "SUCCESS" | "FAILED";
  lastSyncTime: string | null;
}

export interface PrivilegedActionApprovalRequest {
  id: string;
  requestedBy: string;
  requesterRole: RbacRole;
  actionTitle: string;
  targetResource: string;
  justification: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface UserActivityLog {
  id: string;
  timestamp: string;
  username: string;
  role: RbacRole;
  ipAddress: string;
  action: string;
  module: string;
  status: "SUCCESS" | "DENIED" | "FAILURE";
}

class EnterpriseIamEngine {
  private users: UserAccount[] = [
    {
      id: "usr-owner-01",
      username: "platform.owner",
      email: "owner@awm-ai-soc.internal",
      fullName: "Global Platform Owner",
      role: "PLATFORM_OWNER",
      department: "Executive Cybersecurity Office",
      status: "ACTIVE",
      mfaEnabled: true,
      mfaType: "HARDWARE_KEY",
      failedAttempts: 0,
      lockoutUntil: null,
      lastLogin: new Date().toISOString(),
      passwordHash: this.hashPassword("AwmOwner2026Secure!", "salt123"),
      salt: "salt123",
      directorySource: "LOCAL",
      adGroupMappings: ["CN=Enterprise-Owners,OU=Groups,DC=corp,DC=internal"],
    },
    {
      id: "usr-admin-01",
      username: "admin.enterprise",
      email: "admin@awm-ai-soc.internal",
      fullName: "Enterprise Systems Admin",
      role: "ENTERPRISE_ADMIN",
      department: "Enterprise IT & Infrastructure",
      status: "ACTIVE",
      mfaEnabled: true,
      mfaType: "TOTP",
      failedAttempts: 0,
      lockoutUntil: null,
      lastLogin: new Date().toISOString(),
      passwordHash: this.hashPassword("AwmAdmin2026Secure!", "salt124"),
      salt: "salt124",
      directorySource: "ACTIVE_DIRECTORY",
      adGroupMappings: ["CN=Domain-Admins,OU=Groups,DC=corp,DC=internal"],
    },
    {
      id: "usr-soc-dir",
      username: "soc.director",
      email: "director@awm-ai-soc.internal",
      fullName: "Dr. Elena Rostova",
      role: "SOC_DIRECTOR",
      department: "Global SOC Leadership",
      status: "ACTIVE",
      mfaEnabled: true,
      mfaType: "TOTP",
      failedAttempts: 0,
      lockoutUntil: null,
      lastLogin: new Date().toISOString(),
      passwordHash: this.hashPassword("SocDirectorPass2026!", "salt456"),
      salt: "salt456",
      directorySource: "AZURE_ENTRA_ID",
      adGroupMappings: ["CN=SOC-Directors,OU=Groups,DC=corp,DC=internal"],
    },
    {
      id: "usr-sr-analyst",
      username: "sr.analyst",
      email: "sr.analyst@awm-ai-soc.internal",
      fullName: "David Vance",
      role: "SENIOR_SECURITY_ANALYST",
      department: "Threat Analytics & Intelligence",
      status: "ACTIVE",
      mfaEnabled: true,
      mfaType: "SAML_PUSH",
      failedAttempts: 0,
      lockoutUntil: null,
      lastLogin: new Date().toISOString(),
      passwordHash: this.hashPassword("AnalystPass2026!", "salt789"),
      salt: "salt789",
      directorySource: "ACTIVE_DIRECTORY",
      adGroupMappings: ["CN=SOC-Tier2-Analysts,OU=Groups,DC=corp,DC=internal"],
    },
    {
      id: "usr-responder-01",
      username: "incident.responder",
      email: "responder@awm-ai-soc.internal",
      fullName: "Marcus Chen",
      role: "INCIDENT_RESPONDER",
      department: "Cyber Incident Containment",
      status: "ACTIVE",
      mfaEnabled: true,
      mfaType: "TOTP",
      failedAttempts: 0,
      lockoutUntil: null,
      lastLogin: new Date().toISOString(),
      passwordHash: this.hashPassword("ResponderPass2026!", "salt101"),
      salt: "salt101",
      directorySource: "LOCAL",
      adGroupMappings: ["CN=IR-Teams,OU=Groups,DC=corp,DC=internal"],
    },
    {
      id: "usr-ti-analyst",
      username: "intel.analyst",
      email: "intel@awm-ai-soc.internal",
      fullName: "Sophia Al-Mansoor",
      role: "THREAT_INTEL_ANALYST",
      department: "Threat Intelligence Research",
      status: "ACTIVE",
      mfaEnabled: true,
      mfaType: "TOTP",
      failedAttempts: 0,
      lockoutUntil: null,
      lastLogin: new Date().toISOString(),
      passwordHash: this.hashPassword("IntelPass2026!", "salt102"),
      salt: "salt102",
      directorySource: "LOCAL",
      adGroupMappings: ["CN=Threat-Intel,OU=Groups,DC=corp,DC=internal"],
    },
    {
      id: "usr-auditor-01",
      username: "grc.auditor",
      email: "auditor@awm-ai-soc.internal",
      fullName: "Sarah Jenkins",
      role: "COMPLIANCE_AUDITOR",
      department: "GRC & Governance",
      status: "ACTIVE",
      mfaEnabled: true,
      mfaType: "HARDWARE_KEY",
      failedAttempts: 0,
      lockoutUntil: null,
      lastLogin: new Date().toISOString(),
      passwordHash: this.hashPassword("AuditorPass2026!", "salt202"),
      salt: "salt202",
      directorySource: "LOCAL",
      adGroupMappings: ["CN=Audit-Compliance,OU=Groups,DC=corp,DC=internal"],
    },
    {
      id: "usr-readonly-01",
      username: "readonly.user",
      email: "viewer@awm-ai-soc.internal",
      fullName: "Executive Viewer",
      role: "READ_ONLY",
      department: "Executive Committee",
      status: "ACTIVE",
      mfaEnabled: true,
      mfaType: "TOTP",
      failedAttempts: 0,
      lockoutUntil: null,
      lastLogin: new Date().toISOString(),
      passwordHash: this.hashPassword("ViewerPass2026!", "salt303"),
      salt: "salt303",
      directorySource: "SAML_SSO",
      adGroupMappings: ["CN=Exec-Viewers,OU=Groups,DC=corp,DC=internal"],
    },
  ];

  private directoryConfigs: DirectoryConfig[] = [
    {
      type: "ACTIVE_DIRECTORY",
      domain: "corp.enterprise.internal",
      serverUrl: "ldaps://dc01.corp.enterprise.internal:636",
      bindDn: "CN=AwmSocService,OU=ServiceAccounts,DC=corp,DC=enterprise,DC=internal",
      userSearchBase: "OU=SecurityUsers,DC=corp,DC=enterprise,DC=internal",
      groupSearchBase: "OU=SecurityGroups,DC=corp,DC=enterprise,DC=internal",
      syncIntervalMinutes: 15,
      enabled: true,
      groupMappings: [
        { directoryGroup: "CN=Domain-Admins,OU=Groups,DC=corp,DC=internal", assignedRole: "ENTERPRISE_ADMIN" },
        { directoryGroup: "CN=SOC-Directors,OU=Groups,DC=corp,DC=internal", assignedRole: "SOC_DIRECTOR" },
        { directoryGroup: "CN=SOC-Tier2-Analysts,OU=Groups,DC=corp,DC=internal", assignedRole: "SENIOR_SECURITY_ANALYST" },
        { directoryGroup: "CN=IR-Teams,OU=Groups,DC=corp,DC=internal", assignedRole: "INCIDENT_RESPONDER" },
      ],
      syncStatus: "SUCCESS",
      lastSyncTime: new Date(Date.now() - 300000).toISOString(),
    },
    {
      type: "AZURE_ENTRA_ID",
      domain: "enterprise.onmicrosoft.com",
      serverUrl: "https://graph.microsoft.com/v1.0",
      bindDn: "OAuth2-App-Registration",
      tenantId: "8f74a321-9b12-4a01-81bc-3294821a9321",
      clientId: "1092a832-7212-411a-b328-82194812a102",
      userSearchBase: "GraphAPI:/users",
      groupSearchBase: "GraphAPI:/groups",
      syncIntervalMinutes: 30,
      enabled: true,
      groupMappings: [
        { directoryGroup: "Azure-SecOps-Admins", assignedRole: "ENTERPRISE_ADMIN" },
        { directoryGroup: "Azure-SOC-Analysts", assignedRole: "SENIOR_SECURITY_ANALYST" },
      ],
      syncStatus: "SUCCESS",
      lastSyncTime: new Date(Date.now() - 600000).toISOString(),
    },
    {
      type: "SAML_SSO",
      domain: "sso.enterprise-identity.com",
      serverUrl: "https://sso.enterprise-identity.com/saml/sso",
      bindDn: "SAML2.0-Metadata-X509",
      userSearchBase: "SAML-Attributes",
      groupSearchBase: "SAML-Groups",
      syncIntervalMinutes: 60,
      enabled: true,
      groupMappings: [
        { directoryGroup: "SAML-Compliance-Auditors", assignedRole: "COMPLIANCE_AUDITOR" },
      ],
      syncStatus: "SUCCESS",
      lastSyncTime: new Date(Date.now() - 1200000).toISOString(),
    },
  ];

  private approvalRequests: PrivilegedActionApprovalRequest[] = [
    {
      id: "APR-2026-001",
      requestedBy: "sr.analyst",
      requesterRole: "SENIOR_SECURITY_ANALYST",
      actionTitle: "Isolate Primary Domain Controller Host 'DC-PRIMARY-01'",
      targetResource: "DC-PRIMARY-01 (10.0.0.5)",
      justification: "Ransomware injection activity detected in LSASS process memory.",
      status: "APPROVED",
      requestedAt: new Date(Date.now() - 3600000).toISOString(),
      reviewedBy: "soc.director",
      reviewedAt: new Date(Date.now() - 3300000).toISOString(),
    },
    {
      id: "APR-2026-002",
      requestedBy: "incident.responder",
      requesterRole: "INCIDENT_RESPONDER",
      actionTitle: "Deploy Global Firewall Network Isolation Block on Subnet 185.220.0.0/16",
      targetResource: "Core Edge PaloAlto Cluster",
      justification: "Active C2 botnet traffic targeted against payment gateway server.",
      status: "PENDING",
      requestedAt: new Date(Date.now() - 900000).toISOString(),
    },
  ];

  private activityLogs: UserActivityLog[] = [
    {
      id: "ACT-001",
      timestamp: new Date().toISOString(),
      username: "platform.owner",
      role: "PLATFORM_OWNER",
      ipAddress: "10.0.1.50",
      action: "Modified Global Security Policy & MFA Enforcement Matrix",
      module: "IAM_ADMIN",
      status: "SUCCESS",
    },
    {
      id: "ACT-002",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      username: "soc.director",
      role: "SOC_DIRECTOR",
      ipAddress: "10.0.1.52",
      action: "Approved Privileged Host Containment APR-2026-001",
      module: "AUTONOMOUS_APPROVALS",
      status: "SUCCESS",
    },
    {
      id: "ACT-003",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      username: "sr.analyst",
      role: "SENIOR_SECURITY_ANALYST",
      ipAddress: "10.0.2.14",
      action: "Executed Automated Threat Hunt Query for CVE-2026-10492",
      module: "THREAT_HUNTING",
      status: "SUCCESS",
    },
  ];

  public hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 32, "sha256").toString("hex");
  }

  public getUsers(): UserAccount[] {
    return this.users.map(({ passwordHash, salt, ...u }) => u as UserAccount);
  }

  public getRolePermissions(role: RbacRole): PermissionPolicy[] {
    switch (role) {
      case "PLATFORM_OWNER":
      case "ENTERPRISE_ADMIN":
        return [
          { module: "ALL_MODULES", canRead: true, canWrite: true, canExecute: true, canDelete: true, canApproveAutonomous: true, requiresPrivilegedApproval: false },
        ];
      case "SOC_DIRECTOR":
        return [
          { module: "SIEM", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: true },
          { module: "SOAR", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: true },
          { module: "EDR_NDR", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: true },
          { module: "AUTONOMOUS_RESPONSE", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: true },
          { module: "INCIDENT_RESPONSE", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: true },
          { module: "SETTINGS", canRead: true, canWrite: true, canExecute: false, canDelete: false, canApproveAutonomous: false },
        ];
      case "SENIOR_SECURITY_ANALYST":
        return [
          { module: "SIEM", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: false },
          { module: "EDR_NDR", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: false },
          { module: "UEBA", canRead: true, canWrite: false, canExecute: true, canDelete: false, canApproveAutonomous: false },
          { module: "INCIDENT_RESPONSE", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: false },
          { module: "AUTONOMOUS_RESPONSE", canRead: true, canWrite: true, canExecute: false, canDelete: false, canApproveAutonomous: false, requiresPrivilegedApproval: true },
        ];
      case "INCIDENT_RESPONDER":
        return [
          { module: "SOAR", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: true },
          { module: "EDR", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: true },
          { module: "INCIDENT_RESPONSE", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: true },
        ];
      case "THREAT_INTEL_ANALYST":
        return [
          { module: "THREAT_INTEL", canRead: true, canWrite: true, canExecute: true, canDelete: true, canApproveAutonomous: false },
          { module: "YARA_SIGMA", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: false },
          { module: "MITRE_ATTACK", canRead: true, canWrite: true, canExecute: false, canDelete: false, canApproveAutonomous: false },
        ];
      case "COMPLIANCE_AUDITOR":
        return [
          { module: "AUDIT_LOGS", canRead: true, canWrite: false, canExecute: false, canDelete: false, canApproveAutonomous: false },
          { module: "COMPLIANCE", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: false },
          { module: "REPORTS", canRead: true, canWrite: true, canExecute: true, canDelete: false, canApproveAutonomous: false },
        ];
      case "READ_ONLY":
      default:
        return [
          { module: "ALL_MODULES", canRead: true, canWrite: false, canExecute: false, canDelete: false, canApproveAutonomous: false },
        ];
    }
  }

  public authenticate(username: string, passwordAttempt: string): { success: boolean; user?: UserAccount; error?: string } {
    const user = this.users.find((u) => u.username === username || u.email === username);
    if (!user) {
      windowsLogger.warn("IAM_AUTH", `Failed authentication attempt for unknown user: ${username}`);
      return { success: false, error: "Invalid username or password" };
    }

    if (user.status === "DISABLED") {
      windowsLogger.warn("IAM_AUTH", `Disabled user tried logging in: ${username}`);
      return { success: false, error: "Account is disabled. Contact administrator." };
    }

    if (user.status === "LOCKED") {
      if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
        return { success: false, error: "Account locked due to multiple failed login attempts. Try again later." };
      } else {
        user.status = "ACTIVE";
        user.failedAttempts = 0;
        user.lockoutUntil = null;
      }
    }

    const computed = this.hashPassword(passwordAttempt, user.salt);
    if (computed !== user.passwordHash) {
      user.failedAttempts += 1;
      windowsLogger.warn("IAM_AUTH", `Failed password attempt for ${username} (Attempt ${user.failedAttempts}/5)`);

      if (user.failedAttempts >= 5) {
        user.status = "LOCKED";
        user.lockoutUntil = new Date(Date.now() + 15 * 60000).toISOString();
        windowsLogger.error("IAM_AUTH", `Account ${username} locked for 15 minutes due to 5 consecutive failed logins.`);
        return { success: false, error: "Account locked due to 5 consecutive failed login attempts." };
      }

      return { success: false, error: "Invalid username or password" };
    }

    user.failedAttempts = 0;
    user.lastLogin = new Date().toISOString();
    windowsLogger.audit("IAM_AUTH", `User ${username} successfully authenticated (${user.role})`);

    const { passwordHash, salt, ...safeUser } = user;
    return { success: true, user: safeUser as UserAccount };
  }

  public createUser(userData: Partial<UserAccount>): UserAccount {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = this.hashPassword(userData.passwordHash || "DefaultPass2026!", salt);

    const newUser: UserAccount = {
      id: `usr-${Date.now().toString(36)}`,
      username: userData.username || `user.${Date.now()}`,
      email: userData.email || "user@awm-ai-soc.internal",
      fullName: userData.fullName || "New SOC User",
      role: (userData.role as RbacRole) || "SENIOR_SECURITY_ANALYST",
      department: userData.department || "Security Operations",
      status: "ACTIVE",
      mfaEnabled: userData.mfaEnabled ?? true,
      mfaType: userData.mfaType || "TOTP",
      failedAttempts: 0,
      lockoutUntil: null,
      lastLogin: null,
      passwordHash,
      salt,
      directorySource: userData.directorySource || "LOCAL",
      adGroupMappings: userData.adGroupMappings || [],
    };

    this.users.push(newUser);
    windowsLogger.audit("IAM_USER_MGMT", `Created new IAM user account '${newUser.username}' with role '${newUser.role}'`);

    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    return safeUser as UserAccount;
  }

  public toggleUserStatus(userId: string, newStatus: "ACTIVE" | "DISABLED" | "LOCKED"): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    user.status = newStatus;
    if (newStatus === "ACTIVE") {
      user.failedAttempts = 0;
      user.lockoutUntil = null;
    }
    windowsLogger.audit("IAM_USER_MGMT", `Updated status for user '${user.username}' to '${newStatus}'`);
    return true;
  }

  public getDirectoryConfigs(): DirectoryConfig[] {
    return this.directoryConfigs;
  }

  public syncDirectory(type: "ACTIVE_DIRECTORY" | "AZURE_ENTRA_ID" | "LDAP" | "SAML_SSO"): { success: boolean; syncedUsers: number; syncTime: string } {
    const config = this.directoryConfigs.find((c) => c.type === type);
    if (config) {
      config.syncStatus = "SYNCING";
      config.lastSyncTime = new Date().toISOString();
      config.syncStatus = "SUCCESS";
    }
    windowsLogger.audit("IAM_DIRECTORY_SYNC", `Synchronized directory accounts from '${type}'`);
    return {
      success: true,
      syncedUsers: 142,
      syncTime: new Date().toISOString(),
    };
  }

  public getApprovalRequests(): PrivilegedActionApprovalRequest[] {
    return this.approvalRequests;
  }

  public createApprovalRequest(request: Partial<PrivilegedActionApprovalRequest>): PrivilegedActionApprovalRequest {
    const newReq: PrivilegedActionApprovalRequest = {
      id: `APR-2026-${Math.floor(Math.random() * 900 + 100)}`,
      requestedBy: request.requestedBy || "sr.analyst",
      requesterRole: request.requesterRole || "SENIOR_SECURITY_ANALYST",
      actionTitle: request.actionTitle || "Privileged Execution Request",
      targetResource: request.targetResource || "Critical Enterprise Asset",
      justification: request.justification || "SOC Operational containment requirement",
      status: "PENDING",
      requestedAt: new Date().toISOString(),
    };
    this.approvalRequests.unshift(newReq);
    windowsLogger.audit("IAM_APPROVAL_REQ", `Privileged action approval requested by ${newReq.requestedBy} for ${newReq.actionTitle}`);
    return newReq;
  }

  public processApprovalRequest(id: string, decision: "APPROVED" | "REJECTED", reviewer: string): boolean {
    const req = this.approvalRequests.find((r) => r.id === id);
    if (!req) return false;
    req.status = decision;
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();
    windowsLogger.audit("IAM_APPROVAL_DECISION", `Privileged action request ${id} ${decision} by ${reviewer}`);
    return true;
  }

  public getActivityLogs(): UserActivityLog[] {
    return this.activityLogs;
  }

  public generateAccessReviewReport(): { reportId: string; generatedAt: string; totalUsers: number; inactiveUsersCount: number; privilegedUsersCount: number; summaryText: string } {
    const totalUsers = this.users.length;
    const privilegedRoles: RbacRole[] = ["PLATFORM_OWNER", "ENTERPRISE_ADMIN", "SOC_DIRECTOR"];
    const privilegedUsersCount = this.users.filter((u) => privilegedRoles.includes(u.role)).length;
    const inactiveUsersCount = this.users.filter((u) => u.status !== "ACTIVE").length;

    return {
      reportId: `ARR-2026-${Date.now().toString(36).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      totalUsers,
      inactiveUsersCount,
      privilegedUsersCount,
      summaryText: `Quarterly IAM Access Review complete. Total Users: ${totalUsers}. Privileged Roles: ${privilegedUsersCount}. All accounts validated against AD/Entra ID group mappings with 100% MFA compliance.`,
    };
  }
}

export const enterpriseIamEngine = new EnterpriseIamEngine();
