import { EventEmitter } from 'events';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED' | 'DELETED';
  tier: 'COMMUNITY' | 'PRO' | 'ENTERPRISE' | 'GOVERNMENT';
  max_agents: number;
  max_users: number;
  data_retention_days: number;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  tenant_id: string;
  sso_enabled: boolean;
  sso_provider: 'OIDC' | 'SAML' | 'NONE';
  sso_domain?: string;
  mfa_enforced: boolean;
  ip_whitelist: string[];
  session_timeout_minutes: number;
  alert_email_notifications: boolean;
  theme_preference: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  roles: string[]; // e.g. ['TENANT_ADMIN', 'SOC_MANAGER']
  status: 'ACTIVE' | 'DISABLED' | 'PENDING_MFA' | 'LOCKED';
  mfa_enabled: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system_role: boolean;
}

export interface License {
  id: string;
  tenant_id: string;
  license_key: string;
  plan_tier: string;
  max_endpoints: number;
  max_log_ingestion_gb_day: number;
  status: 'VALID' | 'EXPIRED' | 'REVOKED';
  starts_at: string;
  expires_at: string;
}

export interface TenantAuditLog {
  id: string;
  tenant_id: string;
  actor_user_id: string;
  action: string;
  resource_type: string;
  details: Record<string, any>;
  ip_address: string;
  timestamp: string;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  tenantId: string;
  token: string;
  mfaVerified: boolean;
  expiresAt: string;
}

class TenantEngine extends EventEmitter {
  private tenants: Map<string, Tenant> = new Map();
  private settings: Map<string, TenantSettings> = new Map();
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private licenses: Map<string, License> = new Map();
  private auditLogs: TenantAuditLog[] = [];
  private activeSessions: Map<string, AuthSession> = new Map();

  constructor() {
    super();
    this.seedSystemRoles();
    this.seedInitialTenants();
  }

  private seedSystemRoles() {
    const defaultRoles: Role[] = [
      {
        id: 'SUPER_ADMIN',
        name: 'Platform Super Admin',
        description: 'Full unrestricted platform management across all enterprise tenants.',
        permissions: ['*'],
        is_system_role: true,
      },
      {
        id: 'TENANT_ADMIN',
        name: 'Tenant Administrator',
        description: 'Full administrative access within specific organization tenant.',
        permissions: ['tenant:*', 'user:*', 'license:*', 'siem:*', 'edr:*', 'soar:*'],
        is_system_role: true,
      },
      {
        id: 'CISO',
        name: 'Chief Information Security Officer',
        description: 'Executive view, compliance oversight, risk heatmap reporting.',
        permissions: ['compliance:*', 'reports:*', 'dashboards:view', 'audit:read'],
        is_system_role: true,
      },
      {
        id: 'SOC_MANAGER',
        name: 'SOC Manager',
        description: 'Incident triage oversight, playbook approvals, team resource allocation.',
        permissions: ['siem:*', 'edr:*', 'ndr:*', 'soar:approve', 'reports:read'],
        is_system_role: true,
      },
      {
        id: 'SECURITY_ANALYST',
        name: 'Security Analyst',
        description: 'Alert triage, threat hunting, query engine access, intelligence lookup.',
        permissions: ['siem:read', 'siem:investigate', 'edr:read', 'intel:read'],
        is_system_role: true,
      },
      {
        id: 'INCIDENT_RESPONDER',
        name: 'Incident Responder',
        description: 'EDR host isolation, active threat containment, SOAR execution.',
        permissions: ['edr:isolate', 'soar:execute', 'siem:write'],
        is_system_role: true,
      },
      {
        id: 'AUDITOR',
        name: 'Auditor',
        description: 'Read-only access to compliance evidence, control records, and audit logs.',
        permissions: ['compliance:read', 'evidence:read', 'audit:read'],
        is_system_role: true,
      },
      {
        id: 'READ_ONLY',
        name: 'Read Only User',
        description: 'View-only dashboards and metrics across security views.',
        permissions: ['*:read'],
        is_system_role: true,
      },
    ];

    defaultRoles.forEach((r) => this.roles.set(r.id, r));
  }

  private seedInitialTenants() {
    // Demo Tenant 1: Acme Financial Corp
    const tenant1: Tenant = {
      id: 'TNT-ACME-CORP',
      name: 'Acme Financial Global',
      domain: 'acmefinancial.com',
      status: 'ACTIVE',
      tier: 'ENTERPRISE',
      max_agents: 2500,
      max_users: 100,
      data_retention_days: 180,
      created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.tenants.set(tenant1.id, tenant1);

    this.settings.set(tenant1.id, {
      tenant_id: tenant1.id,
      sso_enabled: true,
      sso_provider: 'OIDC',
      sso_domain: 'sso.acmefinancial.com',
      mfa_enforced: true,
      ip_whitelist: ['198.51.100.0/24', '203.0.113.10'],
      session_timeout_minutes: 30,
      alert_email_notifications: true,
      theme_preference: 'DARK_CYBER',
    });

    // Users for Tenant 1
    const users1: User[] = [
      {
        id: 'USR-ACME-01',
        tenant_id: tenant1.id,
        email: 'ciso@acmefinancial.com',
        full_name: 'Elena Rostova',
        roles: ['TENANT_ADMIN', 'CISO'],
        status: 'ACTIVE',
        mfa_enabled: true,
        last_login_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 80).toISOString(),
      },
      {
        id: 'USR-ACME-02',
        tenant_id: tenant1.id,
        email: 'soc-lead@acmefinancial.com',
        full_name: 'Marcus Vance',
        roles: ['SOC_MANAGER', 'INCIDENT_RESPONDER'],
        status: 'ACTIVE',
        mfa_enabled: true,
        last_login_at: new Date(Date.now() - 1800000).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      },
    ];
    users1.forEach((u) => this.users.set(u.id, u));

    // License for Tenant 1
    const license1: License = {
      id: 'LIC-ACME-2026',
      tenant_id: tenant1.id,
      license_key: 'SN-ENT-ACME-8849-2026-XDR',
      plan_tier: 'ENTERPRISE_XDR_UNLIMITED',
      max_endpoints: 2500,
      max_log_ingestion_gb_day: 1000,
      status: 'VALID',
      starts_at: new Date(Date.now() - 86400000 * 90).toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 275).toISOString(),
    };
    this.licenses.set(license1.id, license1);

    // Demo Tenant 2: CyberDefense Defense Solutions
    const tenant2: Tenant = {
      id: 'TNT-CYBERDEF-INC',
      name: 'CyberDefense Managed Services',
      domain: 'cyberdefense-mssp.io',
      status: 'ACTIVE',
      tier: 'PRO',
      max_agents: 500,
      max_users: 25,
      data_retention_days: 90,
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.tenants.set(tenant2.id, tenant2);

    this.settings.set(tenant2.id, {
      tenant_id: tenant2.id,
      sso_enabled: false,
      sso_provider: 'NONE',
      mfa_enforced: true,
      ip_whitelist: [],
      session_timeout_minutes: 60,
      alert_email_notifications: true,
      theme_preference: 'DARK_CYBER',
    });

    const license2: License = {
      id: 'LIC-CYBERDEF-2026',
      tenant_id: tenant2.id,
      license_key: 'SN-PRO-CYBER-3312-2026-XDR',
      plan_tier: 'PRO_XDR',
      max_endpoints: 500,
      max_log_ingestion_gb_day: 250,
      status: 'VALID',
      starts_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 335).toISOString(),
    };
    this.licenses.set(license2.id, license2);

    // Initial Audit Logs
    this.auditLogs.push({
      id: 'AUD-LOG-001',
      tenant_id: tenant1.id,
      actor_user_id: 'USR-ACME-01',
      action: 'TENANT_PROVISIONED',
      resource_type: 'TENANT',
      details: { tier: 'ENTERPRISE', allocated_agents: 2500 },
      ip_address: '198.51.100.12',
      timestamp: new Date(Date.now() - 86400000 * 90).toISOString(),
    });
  }

  // --- Tenants Management ---
  public getTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  public getTenantById(tenantId: string): Tenant | undefined {
    return this.tenants.get(tenantId);
  }

  public createTenant(
    name: string,
    domain: string,
    tier: 'COMMUNITY' | 'PRO' | 'ENTERPRISE' | 'GOVERNMENT' = 'ENTERPRISE',
    maxAgents: number = 1000,
    maxUsers: number = 50
  ): { tenant: Tenant; license: License } {
    const tenantId = `TNT-${name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8)}-${Math.floor(Math.random() * 900 + 100)}`;
    const newTenant: Tenant = {
      id: tenantId,
      name,
      domain,
      status: 'ACTIVE',
      tier,
      max_agents: maxAgents,
      max_users: maxUsers,
      data_retention_days: tier === 'ENTERPRISE' ? 180 : 90,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.tenants.set(tenantId, newTenant);

    // Create default settings
    this.settings.set(tenantId, {
      tenant_id: tenantId,
      sso_enabled: false,
      sso_provider: 'NONE',
      mfa_enforced: true,
      ip_whitelist: [],
      session_timeout_minutes: 60,
      alert_email_notifications: true,
      theme_preference: 'DARK_CYBER',
    });

    // Create default license
    const licenseId = `LIC-${tenantId}`;
    const newLicense: License = {
      id: licenseId,
      tenant_id: tenantId,
      license_key: `SN-${tier}-${Math.floor(Math.random() * 89999 + 10000)}-2026`,
      plan_tier: `${tier}_XDR`,
      max_endpoints: maxAgents,
      max_log_ingestion_gb_day: tier === 'ENTERPRISE' ? 1000 : 250,
      status: 'VALID',
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000 * 365).toISOString(),
    };
    this.licenses.set(licenseId, newLicense);

    this.logAudit(tenantId, 'SYSTEM_ADMIN', 'CREATE_TENANT', 'TENANT', { name, domain, tier });
    this.emit('tenant_created', newTenant);

    return { tenant: newTenant, license: newLicense };
  }

  public updateTenant(tenantId: string, updates: Partial<Tenant>): Tenant {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error(`Tenant '${tenantId}' not found`);

    const updated = { ...tenant, ...updates, updated_at: new Date().toISOString() };
    this.tenants.set(tenantId, updated);
    this.logAudit(tenantId, 'SYSTEM_ADMIN', 'UPDATE_TENANT', 'TENANT', updates);
    return updated;
  }

  // --- Users & RBAC ---
  public getUsers(tenantId?: string): User[] {
    const list = Array.from(this.users.values());
    if (tenantId) {
      return list.filter((u) => u.tenant_id === tenantId);
    }
    return list;
  }

  public createUser(tenantId: string, email: string, fullName: string, roles: string[] = ['SECURITY_ANALYST']): User {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error(`Tenant '${tenantId}' not found`);

    const tenantUsersCount = this.getUsers(tenantId).length;
    if (tenantUsersCount >= tenant.max_users) {
      throw new Error(`User creation limit reached for tenant '${tenant.name}' (Max: ${tenant.max_users})`);
    }

    const userId = `USR-${Math.floor(Math.random() * 900000 + 100000)}`;
    const newUser: User = {
      id: userId,
      tenant_id: tenantId,
      email,
      full_name: fullName,
      roles,
      status: 'ACTIVE',
      mfa_enabled: true,
      created_at: new Date().toISOString(),
    };

    this.users.set(userId, newUser);
    this.logAudit(tenantId, 'ADMIN', 'CREATE_USER', 'USER', { userId, email, roles });
    this.emit('user_created', newUser);
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<User>): User {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User '${userId}' not found`);

    const updated = { ...user, ...updates };
    this.users.set(userId, updated);
    this.logAudit(user.tenant_id, 'ADMIN', 'UPDATE_USER', 'USER', updates);
    return updated;
  }

  public getRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  public createCustomRole(name: string, description: string, permissions: string[]): Role {
    const roleId = `ROLE-CUSTOM-${name.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
    const role: Role = {
      id: roleId,
      name,
      description,
      permissions,
      is_system_role: false,
    };
    this.roles.set(roleId, role);
    return role;
  }

  public checkPermission(userRoles: string[], requiredPermission: string): boolean {
    for (const roleId of userRoles) {
      const role = this.roles.get(roleId);
      if (!role) continue;
      if (role.permissions.includes('*') || role.permissions.includes(requiredPermission)) {
        return true;
      }
      // Check prefix wildcard like 'siem:*'
      const prefix = requiredPermission.split(':')[0];
      if (role.permissions.includes(`${prefix}:*`)) {
        return true;
      }
    }
    return false;
  }

  // --- Enterprise Authentication & Sessions ---
  public login(email: string, tenantId: string): AuthSession {
    const user = Array.from(this.users.values()).find((u) => u.email === email && u.tenant_id === tenantId);
    if (!user) {
      throw new Error(`Invalid credentials or user not registered in tenant '${tenantId}'`);
    }

    if (user.status === 'DISABLED') {
      throw new Error('User account is disabled. Contact your Tenant Administrator.');
    }

    const sessionId = `SES-${Math.floor(Math.random() * 9000000 + 1000000)}`;
    const session: AuthSession = {
      sessionId,
      userId: user.id,
      tenantId: user.tenant_id,
      token: `jwt.sentinel.${btoa(JSON.stringify({ sub: user.id, tenant: user.tenant_id }))}.sig`,
      mfaVerified: !user.mfa_enabled, // requires MFA if enabled
      expiresAt: new Date(Date.now() + 3600000 * 8).toISOString(),
    };

    this.activeSessions.set(sessionId, session);
    user.last_login_at = new Date().toISOString();
    this.users.set(user.id, user);

    this.logAudit(tenantId, user.id, 'USER_LOGIN_ATTEMPT', 'AUTH', { mfaVerified: session.mfaVerified });
    return session;
  }

  public verifyMfa(sessionId: string, code: string): AuthSession {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Invalid or expired session');

    if (code !== '123456' && code.length !== 6) {
      throw new Error('Invalid MFA verification code');
    }

    session.mfaVerified = true;
    this.activeSessions.set(sessionId, session);
    this.logAudit(session.tenantId, session.userId, 'MFA_VERIFIED', 'AUTH', { sessionId });
    return session;
  }

  public logout(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }

  // --- Licensing ---
  public getLicenses(tenantId?: string): License[] {
    const list = Array.from(this.licenses.values());
    if (tenantId) {
      return list.filter((l) => l.tenant_id === tenantId);
    }
    return list;
  }

  public validateLicenseKey(licenseKey: string): { isValid: boolean; license?: License; reason?: string } {
    const license = Array.from(this.licenses.values()).find((l) => l.license_key === licenseKey);
    if (!license) {
      return { isValid: false, reason: 'License key not found in AWM Cyber AI Global Licensing Authority' };
    }

    if (license.status !== 'VALID') {
      return { isValid: false, license, reason: `License status is ${license.status}` };
    }

    if (new Date(license.expires_at).getTime() < Date.now()) {
      license.status = 'EXPIRED';
      this.licenses.set(license.id, license);
      return { isValid: false, license, reason: 'License key expired' };
    }

    return { isValid: true, license };
  }

  // --- Audit Logging ---
  public logAudit(tenantId: string, actorUserId: string, action: string, resourceType: string, details: Record<string, any>) {
    const audit: TenantAuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenant_id: tenantId,
      actor_user_id: actorUserId,
      action,
      resource_type: resourceType,
      details,
      ip_address: '127.0.0.1',
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(audit);
    this.emit('audit_log', audit);
  }

  public getAuditLogs(tenantId?: string): TenantAuditLog[] {
    if (tenantId) {
      return this.auditLogs.filter((a) => a.tenant_id === tenantId);
    }
    return this.auditLogs;
  }

  // --- Platform Usage Analytics ---
  public getStats() {
    const tenantsList = Array.from(this.tenants.values());
    const usersList = Array.from(this.users.values());
    const licensesList = Array.from(this.licenses.values());

    return {
      totalTenants: tenantsList.length,
      activeTenants: tenantsList.filter((t) => t.status === 'ACTIVE').length,
      totalUsers: usersList.length,
      activeUsers: usersList.filter((u) => u.status === 'ACTIVE').length,
      validLicenses: licensesList.filter((l) => l.status === 'VALID').length,
      activeSessionsCount: this.activeSessions.size,
      totalAuditLogsCount: this.auditLogs.length,
    };
  }
}

export const tenantEngine = new TenantEngine();
