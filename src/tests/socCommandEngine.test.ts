import { describe, it, expect } from 'vitest';
import { socCommandEngine } from '../server/socCommandEngine.js';

describe('AWM Cyber AI Final Enterprise XDR SOC Command Engine Test Suite', () => {
  it('1. SOC Dashboard & Global Threat Risk Score Calculation', () => {
    const dashboard = socCommandEngine.getDashboardData();
    expect(dashboard.globalThreatScore).toBeGreaterThanOrEqual(0);
    expect(dashboard.globalThreatScore).toBeLessThanOrEqual(100);
    expect(dashboard.activeIncidents.length).toBeGreaterThan(0);
    expect(dashboard.criticalAlerts.length).toBeGreaterThan(0);
    expect(dashboard.socKpis.events24h).toBeGreaterThan(100000);
  });

  it('2. Incident Management & Status Workflow', () => {
    const incidents = socCommandEngine.getIncidents();
    expect(incidents.length).toBeGreaterThan(0);

    const inc01 = incidents[0];
    expect(inc01.id).toBe('INC-2026-XDR-001');
    expect(inc01.severity).toBe('CRITICAL');

    // Update status
    const updated = socCommandEngine.updateIncidentStatus(inc01.id, 'CONTAINED', 'Marcus Vance (SOC Manager)');
    expect(updated.status).toBe('CONTAINED');
    expect(updated.assignedAnalyst).toBe('Marcus Vance (SOC Manager)');
  });

  it('3. Dynamic Incident Creation & Alert Correlation', () => {
    const initialCount = socCommandEngine.getIncidents().length;
    const newInc = socCommandEngine.createIncident(
      'Suspicious Supply Chain Dependency Tampering',
      'HIGH',
      ['BUILD-NODE-04'],
      ['svc-cicd-runner'],
      'Package checksum mismatch detected on internal npm artifact repository during CI/CD build step.'
    );

    expect(newInc.id).toContain('INC-2026-XDR-');
    expect(socCommandEngine.getIncidents().length).toBe(initialCount + 1);
  });

  it('4. Attack Timeline Reconstruction', () => {
    const timeline = socCommandEngine.getTimeline('INC-2026-XDR-001');
    expect(timeline.length).toBeGreaterThanOrEqual(4);
    expect(timeline[0].stageOrder).toBe(1);
    expect(timeline[0].moduleSource).toBe('UEBA');
  });

  it('5. AWM AI Assistant SOC Incident Investigation & Fallback', async () => {
    const report = await socCommandEngine.investigateIncidentWithAI('INC-2026-XDR-001');
    expect(report.incidentId).toBe('INC-2026-XDR-001');
    expect(report.aiExecutiveSummary).toBeDefined();
    expect(report.recommendedPlaybooks.length).toBeGreaterThan(0);
    expect(report.mitreTacticsExplained.length).toBeGreaterThan(0);
  }, 15000);

  it('6. Cross-Module Metrics Aggregation', () => {
    const metrics = socCommandEngine.getMetrics();
    expect(metrics.siem).toBeDefined();
    expect(metrics.ndr).toBeDefined();
    expect(metrics.edr).toBeDefined();
    expect(metrics.ueba).toBeDefined();
    expect(metrics.soar).toBeDefined();
    expect(metrics.tip).toBeDefined();
    expect(metrics.vm).toBeDefined();
    expect(metrics.grc).toBeDefined();
    expect(metrics.tenants).toBeDefined();
  });
});
