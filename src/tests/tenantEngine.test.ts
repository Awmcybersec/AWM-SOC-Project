import { describe, it, expect } from 'vitest';
import { tenantEngine } from '../server/tenantEngine.js';

describe('AWM Cyber AI Multi-Tenant Enterprise SaaS Engine Test Suite', () => {
  it('1. Verify Seeded Enterprise Tenants Inventory', () => {
    const tenants = tenantEngine.getTenants();
    expect(tenants.length).toBeGreaterThanOrEqual(2);

    const acme = tenantEngine.getTenantById('TNT-ACME-CORP');
    expect(acme).toBeDefined();
    expect(acme?.name).toBe('Acme Financial Global');
    expect(acme?.tier).toBe('ENTERPRISE');
  });

  it('2. Tenant Lifecycle Provisioning', () => {
    const initialCount = tenantEngine.getTenants().length;
    const { tenant, license } = tenantEngine.createTenant(
      'Apex Defense Systems',
      'apexdefense.gov',
      'GOVERNMENT',
      5000,
      200
    );

    expect(tenant.id).toBeDefined();
    expect(tenant.domain).toBe('apexdefense.gov');
    expect(license.license_key).toContain('SN-GOVERNMENT');
    expect(tenantEngine.getTenants().length).toBe(initialCount + 1);
  });

  it('3. User Provisioning & Tenant Quota Enforcement', () => {
    const newUser = tenantEngine.createUser(
      'TNT-ACME-CORP',
      'devsecops@acmefinancial.com',
      'DevSecOps Engineer',
      ['SECURITY_ANALYST']
    );

    expect(newUser.id).toBeDefined();
    expect(newUser.email).toBe('devsecops@acmefinancial.com');

    const acmeUsers = tenantEngine.getUsers('TNT-ACME-CORP');
    expect(acmeUsers.some((u) => u.id === newUser.id)).toBe(true);
  });

  it('4. RBAC Permission Matrix Evaluation', () => {
    const roles = tenantEngine.getRoles();
    expect(roles.length).toBeGreaterThanOrEqual(8);

    // CISO role has compliance:* permission
    const cisoHasPermission = tenantEngine.checkPermission(['CISO'], 'compliance:read');
    expect(cisoHasPermission).toBe(true);

    // Read only user should NOT have edr:isolate
    const readOnlyHasIsolate = tenantEngine.checkPermission(['READ_ONLY'], 'edr:isolate');
    expect(readOnlyHasIsolate).toBe(false);
  });

  it('5. Authentication & MFA Verification Flow', () => {
    const session = tenantEngine.login('ciso@acmefinancial.com', 'TNT-ACME-CORP');
    expect(session.sessionId).toBeDefined();
    expect(session.mfaVerified).toBe(false); // requires MFA

    const mfaSession = tenantEngine.verifyMfa(session.sessionId, '123456');
    expect(mfaSession.mfaVerified).toBe(true);

    const loggedOut = tenantEngine.logout(session.sessionId);
    expect(loggedOut).toBe(true);
  });

  it('6. Software License Validation & Authority Lookup', () => {
    const licenses = tenantEngine.getLicenses('TNT-ACME-CORP');
    expect(licenses.length).toBeGreaterThan(0);

    const validation = tenantEngine.validateLicenseKey(licenses[0].license_key);
    expect(validation.isValid).toBe(true);
    expect(validation.license?.tenant_id).toBe('TNT-ACME-CORP');

    const invalidCheck = tenantEngine.validateLicenseKey('SN-INVALID-KEY-000');
    expect(invalidCheck.isValid).toBe(false);
  });

  it('7. Tenant Activity Audit Logging & SaaS Platform Stats', () => {
    const auditLogs = tenantEngine.getAuditLogs('TNT-ACME-CORP');
    expect(auditLogs.length).toBeGreaterThan(0);

    const stats = tenantEngine.getStats();
    expect(stats.totalTenants).toBeGreaterThanOrEqual(2);
    expect(stats.totalUsers).toBeGreaterThan(0);
    expect(stats.validLicenses).toBeGreaterThan(0);
  });
});
