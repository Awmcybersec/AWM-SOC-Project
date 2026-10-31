import { describe, it, expect } from 'vitest';
import { autonomousResponseEngine } from '../server/autonomousResponseEngine.js';

describe('AWM Cyber AI Enterprise Autonomous Response & Human Approval Engine Test Suite', () => {
  it('1. Automatic IP Blocking for Critical High-Confidence Threats (Score >= 95 & Confidence >= 95)', async () => {
    const criticalAlert = {
      title: 'APT28 C2 Encrypted Beaconing to Known Malicious Exit Node',
      severity: 'Critical' as const,
      sourceIp: '185.220.101.99',
      score: 98,
      confidence: 96,
      mitreTactic: 'Command and Control',
      mitreTechniqueId: 'T1071.001',
    };

    const result = await autonomousResponseEngine.evaluateAlert(criticalAlert);

    expect(result.status).toBe('AUTO_EXECUTED');
    expect(result.threat_score).toBe(98);
    expect(result.confidence_score).toBe(96);
    expect(result.decided_by).toContain('AWM Autonomous Engine');

    const blocked = autonomousResponseEngine.getBlockedEntities();
    expect(blocked.some((b) => b.entity_value === '185.220.101.99' && b.status === 'ACTIVE')).toBe(true);
  });

  it('2. Human Approval Request Generation for Mid-High Risk Threats (Score 70-94)', async () => {
    const midAlert = {
      title: 'Suspicious PowerShell Script Spawned from WinWord',
      severity: 'High' as const,
      device: 'EP-WIN-DC02',
      score: 85,
      confidence: 90,
      mitreTactic: 'Execution',
      mitreTechniqueId: 'T1059.001',
    };

    const result = await autonomousResponseEngine.evaluateAlert(midAlert);

    expect(result.status).toBe('PENDING_APPROVAL');
    expect(result.recommended_action).toContain('EP-WIN-DC02');

    const pendingList = autonomousResponseEngine.getPendingApprovals();
    expect(pendingList.some((p) => p.id === result.id)).toBe(true);
  });

  it('3. Human Approval Workflow Execution (Approve Request)', async () => {
    const pendingList = autonomousResponseEngine.getPendingApprovals();
    const targetReq = pendingList[0];
    expect(targetReq).toBeDefined();

    const approvedReq = await autonomousResponseEngine.approveRequest(targetReq.id, 'Senior SOC Analyst');

    expect(approvedReq.status).toBe('APPROVED');
    expect(approvedReq.decided_by).toBe('Senior SOC Analyst');

    // Confirm pending list decreased
    const updatedPending = autonomousResponseEngine.getPendingApprovals();
    expect(updatedPending.some((p) => p.id === targetReq.id)).toBe(false);
  });

  it('4. Human Approval Workflow Execution (Reject Request)', async () => {
    const newAlert = {
      title: 'Unusual Developer Admin Activity Outside Working Hours',
      severity: 'High' as const,
      user: 'usr-dev-lead',
      score: 75,
      confidence: 75,
    };

    const req = await autonomousResponseEngine.evaluateAlert(newAlert);
    expect(req.status).toBe('PENDING_APPROVAL');

    const rejected = await autonomousResponseEngine.rejectRequest(req.id, 'SOC Lead', 'Authorized maintenance window');
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.decided_by).toBe('SOC Lead');
  });

  it('5. Human Approval Workflow Execution (Modify Action)', async () => {
    const newAlert = {
      title: 'Potential Kerberoasting Credential Theft Attempt',
      severity: 'High' as const,
      user: 'usr-svc-sql',
      score: 80,
      confidence: 85,
    };

    const req = await autonomousResponseEngine.evaluateAlert(newAlert);
    expect(req.status).toBe('PENDING_APPROVAL');

    const modified = await autonomousResponseEngine.modifyRequest(req.id, 'Incident Commander', 'Force MFA & Rotate Kerberos Ticket');
    expect(modified.status).toBe('MODIFIED');
    expect(modified.modified_action).toBe('Force MFA & Rotate Kerberos Ticket');
  });

  it('6. Firewall Multi-Driver Integration (Windows, iptables, Palo Alto, Fortinet)', async () => {
    const drivers = autonomousResponseEngine.getFirewallDrivers();
    expect(drivers.length).toBeGreaterThanOrEqual(8);

    const winDriver = drivers.find((d) => d.type === 'WINDOWS_FIREWALL');
    expect(winDriver).toBeDefined();

    const res = await winDriver?.blockIp('198.51.100.42', 'Threat Intel Blacklist');
    expect(res?.success).toBe(true);
    expect(res?.command).toContain('netsh advfirewall');
  });

  it('7. Endpoint Host Isolation & Restoration', async () => {
    const entity = autonomousResponseEngine.addBlockedEntity({
      entity_type: 'ENDPOINT',
      entity_value: 'EP-WORKSTATION-99',
      reason: 'Ransomware Containment',
      blocked_by: 'MANUAL',
    });

    expect(entity.status).toBe('ACTIVE');

    const unblocked = await autonomousResponseEngine.unblockEntity(entity.id, 'SecOps Admin');
    expect(unblocked.status).toBe('UNBLOCKED');
  });

  it('8. IOC Hash Blacklisting & Account Disabling', async () => {
    const hashEntity = autonomousResponseEngine.addBlockedEntity({
      entity_type: 'SHA256',
      entity_value: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      reason: 'Emotet Trojan Downloader Payload',
      blocked_by: 'AUTO',
    });

    expect(hashEntity.entity_type).toBe('SHA256');

    const userEntity = autonomousResponseEngine.addBlockedEntity({
      entity_type: 'USER',
      entity_value: 'usr-compromised-admin',
      reason: 'Privilege Escalation & Unauthorized Token Creation',
      blocked_by: 'HUMAN_APPROVAL',
    });

    expect(userEntity.entity_type).toBe('USER');
  });

  it('9. Threat Scoring & Low-Risk Monitoring Threshold (< 70)', async () => {
    const lowAlert = {
      title: 'Routine Port Scan from External IP',
      severity: 'Low' as const,
      sourceIp: '203.0.113.50',
      score: 40,
      confidence: 70,
    };

    const req = await autonomousResponseEngine.evaluateAlert(lowAlert);
    expect(req.status).toBe('MONITORED');
    expect(req.recommended_action).toBe('Monitor & Log Telemetry');

    // Confirm it did not add to pending list
    const pendingList = autonomousResponseEngine.getPendingApprovals();
    expect(pendingList.some((p) => p.id === req.id)).toBe(false);
  });

  it('10. Audit Logging & High-Throughput Statistics', () => {
    const stats = autonomousResponseEngine.getStatistics();
    expect(stats.totalEvaluations).toBeGreaterThan(0);
    expect(stats.firewallDriversConnected).toBe(8);

    const history = autonomousResponseEngine.getHistory();
    expect(history.auditLogs.length).toBeGreaterThan(0);
    expect(history.auditLogs[0].hash).toBeDefined();
  });

  it('11. AI Decision Engine & AI Explainability Output Verification', async () => {
    const { aiDecisionEngine } = await import('../server/aiDecisionEngine.js');
    const { aiExplainabilityEngine } = await import('../server/aiExplainability.js');

    const decision = aiDecisionEngine.evaluateThreat({
      title: 'APT28 Ransomware Executable Execution',
      category: 'EDR Alert',
      severity: 'CRITICAL',
      sourceIp: '185.220.101.5',
      assetCriticality: 'Domain Controller',
    });

    expect(decision.threatScore).toBeGreaterThanOrEqual(95);
    expect(decision.assetCriticality).toBe('Domain Controller');
    expect(decision.businessImpact).toBe('CRITICAL');

    const explanation = aiExplainabilityEngine.generateExplanation(decision);
    expect(explanation.confidencePercentage).toBeDefined();
    expect(explanation.naturalLanguageSummary).toContain('AWM AI Assistant');
  });

  it('12. Response Simulation Engine Impact Prediction', async () => {
    const { responseSimulationEngine } = await import('../server/responseSimulationEngine.js');

    const sim = responseSimulationEngine.simulate({
      action: 'ISOLATE_SERVER',
      target: 'DC-WIN-PROD01',
    });

    expect(sim.businessImpact).toBe('CRITICAL');
    expect(sim.affectedUsersCount).toBeGreaterThan(100);
    expect(sim.requiresHighLevelConfirmation).toBe(true);
  });

  it('13. Blast Radius Controller Multi-Step Containment', async () => {
    const { blastRadiusController } = await import('../server/blastRadiusController.js');

    const plan = blastRadiusController.generateStagedPlan('usr-finance-lead', 'IDENTITY');
    expect(plan.stagedSteps.length).toBe(4);
    expect(plan.stagedSteps[0].action).toBe('TERMINATE_SESSIONS');
    expect(plan.stagedSteps[3].action).toBe('DISABLE_ACCOUNT');

    const step1 = blastRadiusController.executeNextStep(plan);
    expect(step1?.executed).toBe(true);
    expect(plan.status).toBe('IN_PROGRESS');
  });

  it('14. AI Learning Engine Feedback Telemetry & Metrics', async () => {
    const { learningEngine } = await import('../server/learningEngine.js');

    learningEngine.recordFeedback({
      decisionId: 'DEC-999',
      alertId: 'ALT-999',
      threatScore: 90,
      confidenceScore: 92,
      recommendedAction: 'Block IP 198.51.100.1',
      socAction: 'APPROVED',
      wasFalsePositive: false,
    });

    const metrics = learningEngine.calculateMetrics();
    expect(metrics.totalEvaluations).toBeGreaterThan(0);
    expect(metrics.confidenceCalibrationScore).toBeGreaterThan(0);
  });
});
