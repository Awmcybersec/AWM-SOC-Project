import { describe, it, expect } from 'vitest';
import { edrEngine } from '../server/edrEngine.js';

describe('EDR Engine Test Suite', () => {
  it('1. Verify Seed Endpoints Inventory', () => {
    const endpoints = edrEngine.getEndpoints();
    expect(endpoints.length).toBeGreaterThanOrEqual(3);

    const winEp = edrEngine.getEndpointById('EP-WIN-DC01');
    expect(winEp).toBeDefined();
    expect(winEp?.platform).toBe('WINDOWS');
  });

  it('2. Ingest Suspicious Process & Alert Generation', () => {
    const initialAlertCount = edrEngine.getAlerts().length;
    const injectedProc = edrEngine.ingestProcessEvent({
      endpoint_id: 'EP-WIN-DC01',
      process_name: 'powershell.exe',
      command_line: 'powershell.exe -e SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQ...',
      user_account: 'CORP\\Administrator',
    });

    expect(injectedProc.is_suspicious).toBe(true);
    const newAlertCount = edrEngine.getAlerts().length;
    expect(newAlertCount).toBeGreaterThan(initialAlertCount);
  });

  it('3. Network Host Isolation Action & Restore', () => {
    const winEp = edrEngine.getEndpointById('EP-WIN-DC01');
    expect(winEp?.is_isolated).toBe(false);
    
    edrEngine.isolateEndpoint('EP-WIN-DC01', true);
    const isolatedEp = edrEngine.getEndpointById('EP-WIN-DC01');
    expect(isolatedEp?.is_isolated).toBe(true);
    expect(isolatedEp?.status).toBe('ISOLATED');

    edrEngine.isolateEndpoint('EP-WIN-DC01', false);
    expect(edrEngine.getEndpointById('EP-WIN-DC01')?.is_isolated).toBe(false);
  });

  it('4. File Integrity & Behavioral Ransomware Ingestion', () => {
    const initialFiles = edrEngine.getFileEvents().length;
    const ransomwareFile = edrEngine.ingestFileEvent({
      endpoint_id: 'EP-WIN-DC01',
      file_path: 'C:\\Users\\Admin\\Documents\\Report.pdf.locked',
      event_type: 'MODIFY',
    });

    expect(ransomwareFile.is_ransomware_activity).toBe(true);
    expect(edrEngine.getFileEvents().length).toBe(initialFiles + 1);
  });

  it('5. Registry Persistence Events Ingestion', () => {
    const regEvent = edrEngine.ingestRegistryEvent({
      endpoint_id: 'EP-WIN-DC01',
      hive: 'HKLM',
      key_path: 'Software\\Microsoft\\Windows\\CurrentVersion\\Run',
      value_name: 'BackdoorRunKey',
      value_data: 'C:\\ProgramData\\backdoor.exe',
    });
    expect(regEvent.is_persistence_mechanism).toBe(true);
  });

  it('6. AI Behavior Investigation Analysis (Fallback/SDK Test)', async () => {
    const aiAnalysis = await edrEngine.analyzeEndpointBehaviorWithAI('EP-WIN-DC01');
    expect(typeof aiAnalysis.calculated_threat_score).toBe('number');
    expect(aiAnalysis.recommended_soar_actions.length).toBeGreaterThan(0);
  });

  it('7. High level Statistics', () => {
    const stats = edrEngine.getStats();
    expect(stats.totalEndpoints).toBeGreaterThanOrEqual(3);
    expect(stats.totalProcessesTracked).toBeGreaterThan(0);
  });
});
