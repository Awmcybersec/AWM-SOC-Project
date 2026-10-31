import { describe, it, expect } from 'vitest';
import { threatIntelEngine } from '../server/threatIntelEngine.js';

describe('Threat Intelligence Platform (TIP) Engine Suite', () => {
  it('should initialize default feeds, indicators, actors, and campaigns', () => {
    const feeds = threatIntelEngine.getFeeds();
    const iocs = threatIntelEngine.getIocs();
    const actors = threatIntelEngine.getActors();

    expect(feeds.length).toBeGreaterThan(0);
    expect(iocs.length).toBeGreaterThan(0);
    expect(actors.length).toBeGreaterThan(0);

    const apt28 = actors.find((a) => a.id === 'ACTOR-APT28');
    expect(apt28).toBeDefined();
    expect(apt28?.aliases.length).toBeGreaterThan(0);
  });

  it('should ingest a new IOC and calculate reputation scoring dynamically', () => {
    const newIoc = threatIntelEngine.ingestIoc({
      type: 'IPv4',
      value: '198.51.100.77',
      feed_source: 'MANUAL_TEST_INGEST',
      threat_actor: 'APT28 (Fancy Bear)',
      tags: ['c2_server', 'ransomware'],
    });

    expect(newIoc).toBeDefined();
    expect(newIoc.reputation_score).toBeGreaterThanOrEqual(80);
    expect(newIoc.severity).toBe('CRITICAL');

    const fetched = threatIntelEngine.getIocByValue('198.51.100.77');
    expect(fetched).toBeDefined();
    expect(fetched?.value).toBe('198.51.100.77');
  });

  it('should parse STIX 2.1 JSON bundle', () => {
    const sampleStixBundle = {
      type: 'bundle',
      id: 'bundle--cisa-001',
      objects: [
        {
          type: 'indicator',
          id: 'indicator--001',
          name: 'APT29 Malicious C2 IP',
          pattern: "[ipv4-addr:value = '198.51.100.55']",
          confidence: 90,
          labels: ['botnet', 'apt29'],
        },
      ],
    };

    const parsed = threatIntelEngine.parseStixBundle(sampleStixBundle);
    expect(parsed.length).toBe(1);
    expect(parsed[0].value).toBe('198.51.100.55');
  });

  it('should match incoming telemetry against active IOC database and trigger alerts', () => {
    // Ingest target indicator
    threatIntelEngine.ingestIoc({
      type: 'IPv4',
      value: '203.0.113.88',
      reputation_score: 95,
      severity: 'CRITICAL',
    });

    const match = threatIntelEngine.matchIoc('203.0.113.88', 'NDR', 'FLOW-1002', '10.0.1.20', '203.0.113.88');
    expect(match).not.toBeNull();
    expect(match?.indicator_value).toBe('203.0.113.88');
    expect(match?.matched_module).toBe('NDR');
    expect(match?.severity).toBe('CRITICAL');
  });

  it('should enrich indicator using AWM AI Assistant Gemini fallback or live model', async () => {
    const enriched = await threatIntelEngine.enrichIoc('185.220.101.5', 'IPv4');

    expect(enriched).toBeDefined();
    expect(enriched.value).toBe('185.220.101.5');
    expect(enriched.riskScore).toBeGreaterThan(0);
    expect(enriched.summary).toBeDefined();
    expect(enriched.detectionRules).toBeDefined();
  }, 15000);
});
