import { describe, it, expect, beforeEach } from 'vitest';
import { soarEngine } from '../server/soarEngine.js';

describe('SOAR Engine - Automated Orchestration & Playbook Suite', () => {
  it('should initialize default enterprise playbooks and incidents', () => {
    const playbooks = soarEngine.getPlaybooks();
    const incidents = soarEngine.getIncidents();

    expect(playbooks.length).toBeGreaterThan(0);
    expect(incidents.length).toBeGreaterThan(0);

    const ransomwarePb = playbooks.find((p) => p.id === 'PB-EDR-RANSOMWARE-01');
    expect(ransomwarePb).toBeDefined();
    expect(ransomwarePb?.steps.length).toBeGreaterThan(0);
  });

  it('should execute automated host isolation and firewall IP blacklisting playbook', async () => {
    const execution = await soarEngine.runPlaybook('PB-EDR-RANSOMWARE-01', {
      hostId: 'EP-TEST-NODE01',
      ip: '198.51.100.99',
    });

    expect(execution).toBeDefined();
    expect(execution.status).toBe('COMPLETED');
    expect(execution.step_results.length).toBe(3);

    const step1 = execution.step_results[0];
    expect(step1.action).toBe('ISOLATE_HOST');
    expect(step1.status).toBe('SUCCESS');
  });

  it('should pause on Human-in-the-Loop Approval Gate and resume upon approval', async () => {
    const execution = await soarEngine.runPlaybook('PB-UEBA-IMPOSSIBLE-TRAVEL', {
      userId: 'USR-ADMIN-VIP',
      ip: '185.220.101.99',
    });

    expect(execution.status).toBe('AWAITING_APPROVAL');

    const pendingApprovals = soarEngine.getApprovals();
    expect(pendingApprovals.length).toBeGreaterThan(0);

    const currentApproval = pendingApprovals[0];
    expect(currentApproval.action).toBe('REQUEST_APPROVAL');

    // Approve the gate
    const updatedExecution = await soarEngine.decideApproval(currentApproval.id, 'APPROVED', 'CHIEF_CISO');
    expect(updatedExecution.status).toBe('COMPLETED');
  });

  it('should cancel playbook execution if approval gate is rejected', async () => {
    const execution = await soarEngine.runPlaybook('PB-UEBA-IMPOSSIBLE-TRAVEL', {
      userId: 'USR-DEV-01',
    });

    expect(execution.status).toBe('AWAITING_APPROVAL');

    const pendingApprovals = soarEngine.getApprovals();
    const currentApproval = pendingApprovals[pendingApprovals.length - 1];

    const updatedExecution = await soarEngine.decideApproval(currentApproval.id, 'REJECTED', 'SOC_LEAD_ANALYST');
    expect(updatedExecution.status).toBe('CANCELLED');
  });

  it('should synthesize an AI playbook using Gemini AI fallback or model', async () => {
    const aiPlaybook = await soarEngine.generatePlaybookWithAI(
      'S3 Bucket Public Exfiltration',
      'AWS S3 Customer Records Bucket'
    );

    expect(aiPlaybook).toBeDefined();
    expect(aiPlaybook.name).toBeDefined();
    expect(aiPlaybook.steps.length).toBeGreaterThan(0);
  }, 15000);
});
