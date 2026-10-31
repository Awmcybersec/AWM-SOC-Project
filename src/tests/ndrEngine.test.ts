import { describe, it, expect, beforeEach } from "vitest";
import { NdrEngine } from "../server/ndrEngine";

describe("NDR / NIDS Microservice Engine", () => {
  let engine: NdrEngine;

  beforeEach(() => {
    engine = new NdrEngine();
  });

  it("should calculate Shannon Entropy accurately for DNS domains", () => {
    const normalEntropy = engine.calculateEntropy("google.com");
    const highEntropy = engine.calculateEntropy("v9a8f219a8f01b942a19x90a.txt.c2-exfil-dns.org");

    expect(normalEntropy).toBeLessThan(3.5);
    expect(highEntropy).toBeGreaterThan(4.2);
  });

  it("should ingest network flows and perform Deep Packet Inspection (DPI)", () => {
    const flow = engine.ingestFlow({
      protocol: "HTTP",
      sourceIp: "192.168.1.150",
      destinationIp: "198.51.100.10",
      httpMethod: "POST",
      httpUri: "/api/upload",
      bytesSent: 1024,
      bytesReceived: 2048,
    });

    expect(flow.id).toBeDefined();
    expect(flow.protocol).toBe("HTTP");

    const packets = engine.getPackets();
    expect(packets.length).toBeGreaterThan(0);
    const packet = packets[0];
    expect(packet.payloadAscii).toContain("POST /api/upload");
    expect(packet.payloadHex).toBeDefined();
  });

  it("should trigger Suricata CRITICAL alert when Cobalt Strike C2 beacon pattern matches", () => {
    const alertsBefore = engine.getAlerts().length;

    engine.ingestFlow({
      protocol: "HTTP",
      sourceIp: "10.0.10.5",
      destinationIp: "185.220.101.5",
      httpMethod: "GET",
      httpUri: "/match/c2/beacon?id=99",
      httpUserAgent: "CobaltStrike",
    });

    const alertsAfter = engine.getAlerts();
    expect(alertsAfter.length).toBe(alertsBefore + 1);
    expect(alertsAfter[0].title).toContain("Cobalt Strike");
    expect(alertsAfter[0].severity).toBe("CRITICAL");
    expect(alertsAfter[0].mitreTactic).toBe("Command and Control");
  });

  it("should trigger DNS Anomaly rule on high entropy DNS tunneling query", () => {
    engine.ingestFlow({
      protocol: "DNS",
      sourceIp: "10.0.10.12",
      destinationIp: "10.0.0.2",
      dnsQuery: "z90a19f82b0129a8f901c92a1.txt.c2-exfil-dns.org",
    });

    const alerts = engine.getAlerts();
    const dnsAlert = alerts.find((a) => a.title.includes("DNS High Entropy"));
    expect(dnsAlert).toBeDefined();
    expect(dnsAlert?.severity).toBe("HIGH");
  });

  it("should manage NDR detection rules correctly", () => {
    const newRule = engine.addRule({
      id: "CUSTOM-NDR-01",
      sid: 990001,
      title: "Suspicious Outbound SSH Tunneling",
      description: "Detects non-standard port SSH outbound session",
      severity: "MEDIUM",
      ruleType: "SURICATA_SIG",
      patternExpression: "destinationPort == 2222",
      mitreTactic: "Command and Control",
      mitreTechnique: "T1572 - Protocol Tunneling",
      enabled: true,
    });

    expect(engine.getRules().length).toBeGreaterThan(4);
    expect(engine.getRules()[0].id).toBe("CUSTOM-NDR-01");

    const deleted = engine.deleteRule("CUSTOM-NDR-01");
    expect(deleted).toBe(true);
  });

  it("should monitor sensor heartbeats and return accurate bandwidth metrics", () => {
    const stats = engine.getStats();
    expect(stats.activeSensors).toBeGreaterThan(0);
    expect(stats.bandwidthMbps).toBeGreaterThan(0);
    expect(stats.protocolBreakdown).toHaveProperty("HTTP");
  });
});
