import { describe, it, expect } from 'vitest';
import { uebaEngine } from '../server/uebaEngine.js';

describe('AWM Cyber AI UEBA Engine Automated Test Suite', () => {
  it('1. Monitored Users & Profiling Retrieval', () => {
    const users = uebaEngine.getUsers();
    expect(users.length).toBeGreaterThanOrEqual(4);

    const admin = uebaEngine.getUserById('USR-ADMIN-01');
    expect(admin).toBeDefined();
    expect(admin?.username).toBe('admin01');
  });

  it('2. Ingest Normal Login Event', () => {
    const normalLogin = uebaEngine.ingestLoginEvent({
      user_id: 'USR-DEV-04',
      geo_location: 'San Francisco, USA',
      source_ip: '198.51.100.10',
      login_status: 'SUCCESS',
    });
    expect(normalLogin.is_impossible_travel).toBe(false);
  });

  it('3. Impossible Travel Anomaly Triggering', () => {
    const impossibleTravelLogin = uebaEngine.ingestLoginEvent({
      user_id: 'USR-DEV-04',
      geo_location: 'Tokyo, Japan',
      source_ip: '202.214.194.1',
      login_status: 'SUCCESS',
    });
    expect(impossibleTravelLogin.is_impossible_travel).toBe(true);
  });

  it('4. Verify Anomaly Generation & Escalation', () => {
    const anomalies = uebaEngine.getAnomalies('USR-DEV-04');
    expect(anomalies.some((a) => a.anomaly_type === 'IMPOSSIBLE_TRAVEL')).toBe(true);
  });

  it('5. Dynamic Risk Score Recalculation', () => {
    const updatedDevUser = uebaEngine.getUserById('USR-DEV-04');
    expect(updatedDevUser).toBeDefined();
    expect(updatedDevUser!.risk_score).toBeGreaterThan(15);
  });

  it('6. Brute Force Velocity Detection', () => {
    for (let i = 0; i < 3; i++) {
      uebaEngine.ingestLoginEvent({
        user_id: 'USR-EXEC-CEO',
        login_status: 'FAILURE',
        source_ip: '185.220.101.55',
        geo_location: 'Unknown Tor Exit',
      });
    }
    const ceoAnomalies = uebaEngine.getAnomalies('USR-EXEC-CEO');
    expect(ceoAnomalies.some((a) => a.anomaly_type === 'BRUTE_FORCE')).toBe(true);
  });

  it('7. AWM AI Assistant Identity Investigation Report', async () => {
    const aiReport = await uebaEngine.investigateUserWithAI('USR-ADMIN-01');
    expect(aiReport).toBeDefined();
    expect(aiReport?.user_id).toBe('USR-ADMIN-01');
    expect(aiReport?.evidence_breakdown.length).toBeGreaterThan(0);
    expect(aiReport?.recommended_soar_playbooks.length).toBeGreaterThan(0);
  });

  it('8. Engine Statistics Aggregation', () => {
    const stats = uebaEngine.getStats();
    expect(stats.totalMonitoredEntities).toBeGreaterThanOrEqual(4);
    expect(stats.totalAnomaliesDetected).toBeGreaterThanOrEqual(3);
  });
});
