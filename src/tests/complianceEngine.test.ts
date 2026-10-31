import { describe, it, expect } from 'vitest';
import { complianceEngine } from '../server/complianceEngine.js';

describe('AWM Cyber AI Compliance & Governance (GRC) Engine Test Suite', () => {
  it('1. Verify Seeded Compliance Frameworks Registry', () => {
    const frameworks = complianceEngine.getFrameworks();
    expect(frameworks.length).toBeGreaterThanOrEqual(5);

    const iso = frameworks.find((f) => f.id === 'ISO_27001');
    expect(iso).toBeDefined();
    expect(iso?.name).toContain('ISO/IEC 27001');

    const soc2 = frameworks.find((f) => f.id === 'SOC2_TYPE2');
    expect(soc2).toBeDefined();
    expect(soc2?.compliance_score).toBeGreaterThan(0);
  });

  it('2. Control Library Retrieval & Filtering', () => {
    const allControls = complianceEngine.getControls();
    expect(allControls.length).toBeGreaterThan(0);

    const nistControls = complianceEngine.getControls('NIST_800_53');
    expect(nistControls.length).toBeGreaterThan(0);
    expect(nistControls[0].framework_id).toBe('NIST_800_53');
  });

  it('3. Automated Compliance Assessment & Telemetry Evidence Ingestion', async () => {
    const initialEvidenceCount = complianceEngine.getEvidence().length;
    const assessmentResult = await complianceEngine.assessCompliance('SOC2_TYPE2');

    expect(assessmentResult.frameworkId).toBe('SOC2_TYPE2');
    expect(typeof assessmentResult.overallScore).toBe('number');
    expect(assessmentResult.assessedControlsCount).toBeGreaterThan(0);
    expect(complianceEngine.getEvidence().length).toBeGreaterThan(initialEvidenceCount);
  });

  it('4. Audit Management Workflow Execution', () => {
    const initialAudits = complianceEngine.getAudits().length;
    const newAudit = complianceEngine.createAuditSession(
      'ISO 27001 Annual Recertification Audit',
      'ISO_27001',
      'BSI Group Lead Auditor',
      'Enterprise Kubernetes Clusters and API Gateways'
    );

    expect(newAudit.id).toBeDefined();
    expect(newAudit.status).toBe('IN_PROGRESS');
    expect(complianceEngine.getAudits().length).toBe(initialAudits + 1);
  });

  it('5. Audit Findings & Risk Register Scoring', () => {
    const findings = complianceEngine.getFindings();
    expect(findings.length).toBeGreaterThan(0);

    const risks = complianceEngine.getRisks();
    expect(risks.length).toBeGreaterThan(0);
    expect(risks[0].inherent_risk_score).toBe(risks[0].likelihood * risks[0].impact);
  });

  it('6. AI Executive Compliance Report Generation', async () => {
    const report = await complianceEngine.generateComplianceReport('SOC2_TYPE2');
    expect(report.id).toBeDefined();
    expect(report.executive_summary.length).toBeGreaterThan(10);
    expect(report.gap_analysis.length).toBeGreaterThan(0);
    expect(report.policy_recommendations.length).toBeGreaterThan(0);

    const reportsList = complianceEngine.getReports();
    expect(reportsList.some((r) => r.id === report.id)).toBe(true);
  });

  it('7. AI Control Gap Explanation Service', async () => {
    const gapExplanation = await complianceEngine.explainControlGap('CTRL-NIST-SI-2');
    expect(gapExplanation.controlId).toBe('CTRL-NIST-SI-2');
    expect(gapExplanation.gapAnalysis).toBeDefined();
    expect(gapExplanation.remediationGuide.length).toBeGreaterThan(0);
  });

  it('8. Enterprise GRC High-Level Statistics', () => {
    const stats = complianceEngine.getStats();
    expect(stats.totalFrameworksCount).toBeGreaterThanOrEqual(5);
    expect(stats.totalControlsCount).toBeGreaterThan(0);
    expect(stats.evidenceRecordsCount).toBeGreaterThan(0);
    expect(stats.averageComplianceScore).toBeGreaterThan(0);
  });
});
