import { EventEmitter } from 'events';
import { GoogleGenAI } from '@google/genai';
import { edrEngine } from './edrEngine.js';
import { siemEngine } from './siemEngine.js';
import { uebaEngine } from './uebaEngine.js';

export interface SoarPlaybookStep {
  step: number;
  name: string;
  action: 'BLOCK_IP' | 'ISOLATE_HOST' | 'DISABLE_USER' | 'REVOKE_SESSION' | 'QUARANTINE_FILE' | 'CREATE_TICKET' | 'REQUEST_APPROVAL';
  target: string;
  require_approval?: boolean;
}

export interface SoarPlaybook {
  id: string;
  name: string;
  description: string;
  trigger_type: 'SIEM_ALERT' | 'EDR_DETECTION' | 'NDR_FLOW' | 'UEBA_ANOMALY' | 'MANUAL_TRIGGER' | 'SCHEDULED';
  triggerCategory?: string;
  is_active: boolean;
  total_runs: number;
  success_rate: number;
  steps: SoarPlaybookStep[];
  created_at: string;
}

export interface SoarIncident {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'TRIAGED' | 'IN_PROGRESS' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
  source_module: 'SIEM' | 'EDR' | 'NDR' | 'UEBA' | 'MANUAL';
  source_alert_id?: string;
  assigned_analyst: string;
  timeline: Array<{ timestamp: string; event: string; actor: string }>;
  evidence: Array<{ key: string; value: string }>;
  created_at: string;
}

export interface SoarExecution {
  id: string;
  playbook_id: string;
  playbook_name: string;
  incident_id?: string;
  status: 'PENDING' | 'RUNNING' | 'AWAITING_APPROVAL' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  started_at: string;
  completed_at?: string;
  current_step: number;
  step_results: Array<{
    step: number;
    name: string;
    action: string;
    target: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING_APPROVAL';
    details: string;
    timestamp: string;
  }>;
  triggered_by: string;
}

export interface SoarApproval {
  id: string;
  execution_id: string;
  playbook_name: string;
  step_name: string;
  action: string;
  target: string;
  required_role: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
}

class SoarEngine extends EventEmitter {
  private playbooks: Map<string, SoarPlaybook> = new Map();
  private incidents: Map<string, SoarIncident> = new Map();
  private executions: SoarExecution[] = [];
  private approvals: SoarApproval[] = [];
  private blockedIps: Set<string> = new Set();
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    super();
    this.initGeminiAI();
    this.seedInitialPlaybooksAndIncidents();
  }

  private initGeminiAI() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.aiClient = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (err) {
        console.warn('SOAR Engine: Gemini API init skipped:', err);
      }
    }
  }

  private seedInitialPlaybooksAndIncidents() {
    const defaultPlaybooks: SoarPlaybook[] = [
      {
        id: 'PB-EDR-RANSOMWARE-01',
        name: 'Automated Ransomware Containment & Host Isolation',
        description: 'Immediately isolates host endpoint from network, terminates process tree, quarantines .locked file extension, and generates SOC case ticket.',
        trigger_type: 'EDR_DETECTION',
        triggerCategory: 'EDR Endpoint Threat',
        is_active: true,
        total_runs: 42,
        success_rate: 100.0,
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        steps: [
          { step: 1, name: 'Isolate Host Endpoint Network', action: 'ISOLATE_HOST', target: 'EP-WIN-DC01', require_approval: false },
          { step: 2, name: 'Quarantine Malicious Ransomware Process', action: 'QUARANTINE_FILE', target: 'C:\\Users\\Admin\\svchost_fake.exe', require_approval: false },
          { step: 3, name: 'Escalate Incident Case Ticket to SOC', action: 'CREATE_TICKET', target: 'INC-2026-9042', require_approval: false },
        ],
      },
      {
        id: 'PB-UEBA-IMPOSSIBLE-TRAVEL',
        name: 'Credential Compromise & Token Revocation',
        description: 'Revokes SAML tokens, resets user credentials, and blocks IP on firewall for impossible travel violations.',
        trigger_type: 'UEBA_ANOMALY',
        triggerCategory: 'UEBA Identity Threat',
        is_active: true,
        total_runs: 28,
        success_rate: 96.4,
        created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
        steps: [
          { step: 1, name: 'Revoke User Active OAuth/SAML Tokens', action: 'REVOKE_SESSION', target: 'USR-ADMIN-01', require_approval: false },
          { step: 2, name: 'Block Malicious Source Tor IP at Edge', action: 'BLOCK_IP', target: '185.220.101.5', require_approval: false },
          { step: 3, name: 'Approval Gate: Disable Domain Admin Account', action: 'REQUEST_APPROVAL', target: 'USR-ADMIN-01', require_approval: true },
        ],
      },
      {
        id: 'PB-NDR-C2-CONTAINMENT',
        name: 'NDR Botnet C2 Beaconing IP Blacklist',
        description: 'Correlates C2 beaconing activity, adds malicious destination IP to firewall blacklist, and isolates originating subnet.',
        trigger_type: 'NDR_FLOW',
        triggerCategory: 'NDR Network Threat',
        is_active: true,
        total_runs: 64,
        success_rate: 100.0,
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        steps: [
          { step: 1, name: 'Edge Firewall C2 IP Blacklist', action: 'BLOCK_IP', target: '198.51.100.22', require_approval: false },
          { step: 2, name: 'Generate Threat Intel Indicator Ticket', action: 'CREATE_TICKET', target: 'THREAT_INTEL_BOARD', require_approval: false },
        ],
      },
    ];

    defaultPlaybooks.forEach((p) => this.playbooks.set(p.id, p));

    // Seed Initial Incidents
    const initialIncidents: SoarIncident[] = [
      {
        id: 'INC-2026-9042',
        title: 'Ransomware Outbreak on Domain Controller EP-WIN-DC01',
        severity: 'CRITICAL',
        status: 'CONTAINED',
        source_module: 'EDR',
        source_alert_id: 'EDR-ALERT-001',
        assigned_analyst: 'SOAR_AUTO_PILOT',
        timeline: [
          { timestamp: new Date(Date.now() - 1800000).toISOString(), event: 'Ransomware extension .locked detected', actor: 'EDR-Kernel-Agent' },
          { timestamp: new Date(Date.now() - 1750000).toISOString(), event: 'Host EP-WIN-DC01 isolated from network via SOAR Playbook PB-EDR-RANSOMWARE-01', actor: 'SOAR_ENGINE' },
          { timestamp: new Date(Date.now() - 1700000).toISOString(), event: 'Incident marked CONTAINED', actor: 'SOC_ANALYST_01' },
        ],
        evidence: [
          { key: 'Target Host', value: 'EP-WIN-DC01 (10.0.1.5)' },
          { key: 'Malicious Hash', value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
        ],
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'INC-2026-9043',
        title: 'Impossible Travel & Domain Admin Hijack (admin01)',
        severity: 'HIGH',
        status: 'IN_PROGRESS',
        source_module: 'UEBA',
        source_alert_id: 'ANO-001',
        assigned_analyst: 'SOAR_AUTO_PILOT',
        timeline: [
          { timestamp: new Date(Date.now() - 600000).toISOString(), event: 'Impossible Travel anomaly triggered (USA -> Moscow in 25m)', actor: 'UEBA_ENGINE' },
          { timestamp: new Date(Date.now() - 580000).toISOString(), event: 'OAuth Tokens revoked for admin01', actor: 'SOAR_ENGINE' },
          { timestamp: new Date(Date.now() - 550000).toISOString(), event: 'IP 185.220.101.5 added to Edge Firewall Blacklist', actor: 'SOAR_ENGINE' },
        ],
        evidence: [
          { key: 'Target User', value: 'USR-ADMIN-01 (admin01)' },
          { key: 'Suspicious IP', value: '185.220.101.5 (Moscow, RU)' },
        ],
        created_at: new Date(Date.now() - 600000).toISOString(),
      },
    ];

    initialIncidents.forEach((inc) => this.incidents.set(inc.id, inc));
  }

  // --- API Methods ---
  public getPlaybooks(): SoarPlaybook[] {
    return Array.from(this.playbooks.values());
  }

  public getPlaybookById(id: string): SoarPlaybook | undefined {
    return this.playbooks.get(id);
  }

  public getIncidents(): SoarIncident[] {
    return Array.from(this.incidents.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getExecutions(): SoarExecution[] {
    return this.executions;
  }

  public getApprovals(): SoarApproval[] {
    return this.approvals.filter((a) => a.status === 'PENDING');
  }

  public getBlockedIps(): string[] {
    return Array.from(this.blockedIps.values());
  }

  // --- Playbook Creation & Execution ---
  public createPlaybook(pb: Partial<SoarPlaybook>): SoarPlaybook {
    const id = pb.id || `PB-CUSTOM-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newPb: SoarPlaybook = {
      id,
      name: pb.name || 'Custom Security Response Playbook',
      description: pb.description || 'Custom automated incident response workflow.',
      trigger_type: pb.trigger_type || 'MANUAL_TRIGGER',
      triggerCategory: pb.triggerCategory || 'Custom Trigger',
      is_active: pb.is_active ?? true,
      total_runs: 0,
      success_rate: 100.0,
      steps: pb.steps || [],
      created_at: new Date().toISOString(),
    };

    this.playbooks.set(id, newPb);
    this.emit('playbook_created', newPb);
    return newPb;
  }

  public async runPlaybook(playbookId: string, customParams?: { hostId?: string; ip?: string; userId?: string }): Promise<SoarExecution> {
    const playbook = this.playbooks.get(playbookId);
    if (!playbook) {
      throw new Error(`Playbook ${playbookId} not found`);
    }

    const executionId = `EXEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const execution: SoarExecution = {
      id: executionId,
      playbook_id: playbook.id,
      playbook_name: playbook.name,
      status: 'RUNNING',
      started_at: new Date().toISOString(),
      current_step: 1,
      step_results: [],
      triggered_by: 'MANUAL_OR_AUTO_TRIGGER',
    };

    this.executions.unshift(execution);
    playbook.total_runs += 1;
    this.playbooks.set(playbook.id, playbook);

    // Execute steps sequentially
    for (const step of playbook.steps) {
      const target = this.resolveTarget(step.target, customParams);

      if (step.require_approval) {
        // Create approval gate
        const approvalId = `APP-${Date.now()}-${step.step}`;
        const approval: SoarApproval = {
          id: approvalId,
          execution_id: execution.id,
          playbook_name: playbook.name,
          step_name: step.name,
          action: step.action,
          target,
          required_role: 'SOC_LEAD_ANALYST',
          status: 'PENDING',
          requested_at: new Date().toISOString(),
        };

        this.approvals.unshift(approval);
        execution.status = 'AWAITING_APPROVAL';
        execution.step_results.push({
          step: step.step,
          name: step.name,
          action: step.action,
          target,
          status: 'PENDING_APPROVAL',
          details: `Step paused. Approval request ${approvalId} routed to SOC Lead Analyst.`,
          timestamp: new Date().toISOString(),
        });

        this.emit('execution_update', execution);
        this.emit('approval_required', approval);
        return execution;
      }

      // Execute Action
      const stepResult = await this.executeAction(step.action, target);
      execution.step_results.push({
        step: step.step,
        name: step.name,
        action: step.action,
        target,
        status: stepResult.success ? 'SUCCESS' : 'FAILED',
        details: stepResult.message,
        timestamp: new Date().toISOString(),
      });
    }

    execution.status = 'COMPLETED';
    execution.completed_at = new Date().toISOString();
    this.emit('execution_update', execution);

    return execution;
  }

  // --- Decision on Approval Gates ---
  public async decideApproval(approvalId: string, decision: 'APPROVED' | 'REJECTED', approver: string = 'SOC_LEAD_ANALYST'): Promise<SoarExecution> {
    const approval = this.approvals.find((a) => a.id === approvalId);
    if (!approval) {
      throw new Error(`Approval gate ${approvalId} not found`);
    }

    approval.status = decision;
    approval.approved_at = new Date().toISOString();
    approval.approved_by = approver;

    const execution = this.executions.find((e) => e.id === approval.execution_id);
    if (!execution) {
      throw new Error(`Execution ${approval.execution_id} associated with approval not found`);
    }

    if (decision === 'APPROVED') {
      const stepResult = await this.executeAction(approval.action as any, approval.target);
      execution.step_results.push({
        step: execution.step_results.length + 1,
        name: approval.step_name,
        action: approval.action,
        target: approval.target,
        status: stepResult.success ? 'SUCCESS' : 'FAILED',
        details: `[Approved by ${approver}] ${stepResult.message}`,
        timestamp: new Date().toISOString(),
      });
      execution.status = 'COMPLETED';
      execution.completed_at = new Date().toISOString();
    } else {
      execution.status = 'CANCELLED';
      execution.step_results.push({
        step: execution.step_results.length + 1,
        name: approval.step_name,
        action: approval.action,
        target: approval.target,
        status: 'FAILED',
        details: `Action rejected by ${approver}. Execution halted.`,
        timestamp: new Date().toISOString(),
      });
    }

    this.emit('approval_decided', approval);
    this.emit('execution_update', execution);
    return execution;
  }

  // --- Internal Containment Executor ---
  private resolveTarget(target: string, customParams?: { hostId?: string; ip?: string; userId?: string }): string {
    if (customParams) {
      if (target === 'ENDPOINT_ID' && customParams.hostId) return customParams.hostId;
      if (target === 'SOURCE_IP' && customParams.ip) return customParams.ip;
      if (target === 'DEST_C2_IP' && customParams.ip) return customParams.ip;
      if (target === 'USER_ID' && customParams.userId) return customParams.userId;
    }
    return target;
  }

  private async executeAction(
    action: SoarPlaybookStep['action'],
    target: string
  ): Promise<{ success: boolean; message: string }> {
    switch (action) {
      case 'ISOLATE_HOST': {
        try {
          edrEngine.isolateHost(target);
          return { success: true, message: `Successfully isolated host ${target} from local subnet & gateway.` };
        } catch (err: any) {
          return { success: false, message: `Host isolation failed: ${err.message}` };
        }
      }

      case 'BLOCK_IP': {
        this.blockedIps.add(target);
        try {
          siemEngine.ingestRawLog({
            sourceIp: target,
            destinationIp: '0.0.0.0',
            level: 'CRITICAL',
            serviceName: 'SOAR-Firewall-Blocker',
            message: `[SOAR_FIREWALL_BLOCK] IP ${target} added to Edge Firewall drop rules.`,
          });
        } catch (err) {}
        return { success: true, message: `Blacklisted IP ${target} on Edge Firewall and ingress routers.` };
      }

      case 'REVOKE_SESSION':
      case 'DISABLE_USER': {
        const user = uebaEngine.getUserById(target) || uebaEngine.getUsers()[0];
        if (user) {
          user.risk_score = 100;
          user.risk_level = 'CRITICAL';
        }
        return { success: true, message: `Revoked all Active Azure OAuth tokens and disabled domain login for ${target}.` };
      }

      case 'QUARANTINE_FILE': {
        return { success: true, message: `Quarantined malicious payload '${target}' into encrypted vault.` };
      }

      case 'CREATE_TICKET': {
        const incidentId = `INC-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
        const incident: SoarIncident = {
          id: incidentId,
          title: `SOAR Incident Ticket for Target: ${target}`,
          severity: 'HIGH',
          status: 'IN_PROGRESS',
          source_module: 'SIEM',
          assigned_analyst: 'SOAR_AUTO_PILOT',
          timeline: [
            { timestamp: new Date().toISOString(), event: `Automated incident created by SOAR Engine`, actor: 'SOAR_ENGINE' },
          ],
          evidence: [{ key: 'Target Asset', value: target }],
          created_at: new Date().toISOString(),
        };
        this.incidents.set(incidentId, incident);
        return { success: true, message: `Created incident case ${incidentId} in SOAR Case Management.` };
      }

      default:
        return { success: true, message: `Executed containment step for ${target}.` };
    }
  }

  // --- AI Synthesis with Gemini ---
  public async generatePlaybookWithAI(threatScenario: string, targetAsset: string = 'Enterprise Infrastructure'): Promise<{
    name: string;
    description: string;
    trigger: string;
    steps: Array<{ step: number; name: string; action: string; description: string }>;
  }> {
    if (this.aiClient) {
      try {
        const prompt = `You are AWM Cyber AI's SOAR Automation Engineer. Generate an automated response playbook for threat scenario: '${threatScenario}' targeting asset '${targetAsset}'.

Provide a valid JSON response with keys:
{
  "name": "Playbook Name",
  "description": "Comprehensive response description",
  "trigger": "SIEM_ALERT / EDR_DETECTION / NDR_FLOW / UEBA_ANOMALY",
  "steps": [
    { "step": 1, "name": "Step Title", "action": "BLOCK_IP / ISOLATE_HOST / REVOKE_SESSION / QUARANTINE_FILE / CREATE_TICKET", "description": "Specific containment step details" }
  ]
}`;

        const response = await this.aiClient.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return parsed;
        }
      } catch (err) {
        console.warn('SOAR AI Playbook Generation fallback:', err);
      }
    }

    // High Quality Fallback
    return {
      name: `AI Playbook: ${threatScenario} Autonomous Containment`,
      description: `AWM AI synthesized defense workflow targeting ${targetAsset} against ${threatScenario}.`,
      trigger: 'SIEM_ALERT',
      steps: [
        { step: 1, name: 'Isolate Target Endpoint', action: 'ISOLATE_HOST', description: 'Network isolation of compromised node.' },
        { step: 2, name: 'Revoke User Active SAML Tokens', action: 'REVOKE_SESSION', description: 'Invalidate credential sessions.' },
        { step: 3, name: 'Add Attacker IP to Edge Blacklist', action: 'BLOCK_IP', description: 'Drop ingress packets at perimeter firewall.' },
      ],
    };
  }

  // --- Statistics ---
  public getStats() {
    const playbooksCount = this.playbooks.size;
    const incidentsCount = this.incidents.size;
    const pendingApprovals = this.approvals.filter((a) => a.status === 'PENDING').length;
    const totalExecutions = this.executions.length;

    return {
      playbooksCount,
      incidentsCount,
      pendingApprovals,
      totalExecutions,
      blockedIpsCount: this.blockedIps.size,
      successRate: 100.0,
    };
  }
}

export const soarEngine = new SoarEngine();
