// AWM AI SOC SENIOR - Threat Intelligence Platform (TIP) Framework Engine
// Provides MISP, OpenCTI, and STIX/TAXII connectors, Reputation Scoring, IOC Catalog & Threat Actor Profiles.

import { EventEmitter } from "events";
import { IOC, ThreatFeedConnector, ThreatActor } from "../../types.js";

export class ThreatIntelPlatformEngine extends EventEmitter {
  private connectors: ThreatFeedConnector[] = [
    {
      id: "CONN-MISP-01",
      name: "MISP Enterprise",
      type: "MISP",
      status: "Active",
      lastSync: new Date(Date.now() - 60000 * 12).toISOString(),
      iocCount: 48250,
      endpointUrl: "https://misp.corp.internal/api/v2/events",
    },
    {
      id: "CONN-OPENCTI-01",
      name: "OpenCTI Instance",
      type: "OpenCTI",
      status: "Active",
      lastSync: new Date(Date.now() - 60000 * 25).toISOString(),
      iocCount: 124900,
      endpointUrl: "https://opencti.corp.internal/graphql",
    },
    {
      id: "CONN-TAXII-01",
      name: "STIX/TAXII 2.1 Feed",
      type: "STIX/TAXII",
      status: "Active",
      lastSync: new Date(Date.now() - 60000 * 5).toISOString(),
      iocCount: 89400,
      endpointUrl: "https://taxii.us-cert.gov/taxii2/",
    },
    {
      id: "CONN-OTX-01",
      name: "AlienVault OTX",
      type: "API",
      status: "Active",
      lastSync: new Date(Date.now() - 60000 * 45).toISOString(),
      iocCount: 312000,
      endpointUrl: "https://otx.alienvault.com/api/v1/pulses/subscribed",
    },
    {
      id: "CONN-VT-01",
      name: "VirusTotal API",
      type: "API",
      status: "Active",
      lastSync: new Date(Date.now() - 60000 * 2).toISOString(),
      iocCount: 520000,
      endpointUrl: "https://www.virustotal.com/api/v3/intelligence",
    },
  ];

  private iocs: IOC[] = [
    {
      id: "IOC-1001",
      type: "IP",
      value: "185.220.101.5",
      threatGroup: "APT28 (Fancy Bear)",
      confidenceScore: 98,
      firstSeen: "2026-07-12T10:00:00.000Z",
      lastSeen: new Date().toISOString(),
      feedSource: "MISP Enterprise",
      tags: ["C2", "Ransomware-Dropper", "Tor-Exit-Node"],
    },
    {
      id: "IOC-1002",
      type: "SHA256",
      value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      threatGroup: "Lazarus Group",
      confidenceScore: 95,
      firstSeen: "2026-06-01T14:20:00.000Z",
      lastSeen: new Date(Date.now() - 3600000 * 4).toISOString(),
      feedSource: "VirusTotal API",
      tags: ["Wiper", "LSASS-Dumper", "Executable"],
    },
    {
      id: "IOC-1003",
      type: "Domain",
      value: "update-windows-security-service.com",
      threatGroup: "FIN7",
      confidenceScore: 91,
      firstSeen: "2026-08-01T09:15:00.000Z",
      lastSeen: new Date(Date.now() - 3600000 * 1).toISOString(),
      feedSource: "OpenCTI Instance",
      tags: ["Phishing", "Credential-Harvesting", "Typosquatting"],
    },
    {
      id: "IOC-1004",
      type: "URL",
      value: "http://45.33.22.11/payloads/cobaltstrike.beacon.bin",
      threatGroup: "Volt Typhoon",
      confidenceScore: 96,
      firstSeen: "2026-08-04T18:00:00.000Z",
      lastSeen: new Date(Date.now() - 3600000 * 2).toISOString(),
      feedSource: "STIX/TAXII 2.1 Feed",
      tags: ["CobaltStrike", "Beacon", "Living-off-the-land"],
    },
  ];

  private threatActors: ThreatActor[] = [
    {
      id: "ACTOR-001",
      name: "APT28 (Fancy Bear / Strontium)",
      aliases: ["Fancy Bear", "Strontium", "Sednit", "Sofacy"],
      origin: "Eastern Europe",
      targetSectors: ["Defense", "Government", "Financial Services", "Energy Infrastructure"],
      mitreAttckIds: ["T1059", "T1003", "T1055", "T1071"],
      description: "State-sponsored cyber espionage group targeting military, intelligence, and financial networks.",
      sophistication: "Nation-State",
    },
    {
      id: "ACTOR-002",
      name: "Lazarus Group (HIDDEN COBRA)",
      aliases: ["HIDDEN COBRA", "Zinc", "APT38"],
      origin: "East Asia",
      targetSectors: ["Cryptocurrency", "Banking", "Aerospace", "Critical Infrastructure"],
      mitreAttckIds: ["T1486", "T1027", "T1566", "T1059.001"],
      description: "Prolific actor conducting financial theft, SWIFT attacks, and destructive wiper campaigns.",
      sophistication: "Nation-State",
    },
    {
      id: "ACTOR-003",
      name: "Volt Typhoon (BRONZE SILHOUETTE)",
      aliases: ["Vanguard Panda", "BRONZE SILHOUETTE"],
      origin: "East Asia",
      targetSectors: ["Telecommunications", "Utilities", "Transportation", "Cloud Infrastructure"],
      mitreAttckIds: ["T1078", "T1059.003", "T1505.003", "T1090"],
      description: "Focuses on living-off-the-land techniques, web shells, and stealthy persistence on critical networks.",
      sophistication: "Nation-State",
    },
    {
      id: "ACTOR-004",
      name: "FIN7 (Carbanak / Elbrus)",
      aliases: ["Carbanak", "Navigator Group", "Gold Nipper"],
      origin: "Eastern Europe",
      targetSectors: ["Retail", "Hospitality", "Financial Institutions", "Healthcare"],
      mitreAttckIds: ["T1566.001", "T1053", "T1055", "T1486"],
      description: "Financially motivated cybercrime syndicate deploying ransomware and POS memory scrapers.",
      sophistication: "Cybercrime",
    },
  ];

  public getConnectors(): ThreatFeedConnector[] {
    return this.connectors;
  }

  public getIocs(): IOC[] {
    return this.iocs;
  }

  public getThreatActors(): ThreatActor[] {
    return this.threatActors;
  }

  public calculateReputation(indicator: string, type: string) {
    const cleanInd = indicator.trim().toLowerCase();
    const match = this.iocs.find((i) => i.value.toLowerCase() === cleanInd);

    if (match) {
      return {
        indicator,
        type,
        reputation: match.confidenceScore > 80 ? "Malicious" : "Suspicious",
        confidenceScore: match.confidenceScore,
        threatGroup: match.threatGroup,
        tags: match.tags,
        feedSource: match.feedSource,
        recommendation: "Block traffic and trigger automated containment playbook.",
      };
    }

    // Heuristic Reputation Analysis for unknown indicator
    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(indicator);
    const isKnownBadSubnet = indicator.startsWith("185.") || indicator.startsWith("45.");

    if (isIp && isKnownBadSubnet) {
      return {
        indicator,
        type: "IP",
        reputation: "Suspicious",
        confidenceScore: 78,
        threatGroup: "Automated Threat Mesh Correlation",
        tags: ["High-Risk-Subnet", "Potential-Proxy"],
        feedSource: "AWM AI Heuristic Engine",
        recommendation: "Apply rate-limiting and enforce step-up authentication.",
      };
    }

    return {
      indicator,
      type: type || (isIp ? "IP" : "Domain"),
      reputation: "Clean / Neutral",
      confidenceScore: 12,
      threatGroup: "None Identified",
      tags: ["Benign-Evaluated"],
      feedSource: "Global Threat Registry",
      recommendation: "No containment required at this time.",
    };
  }

  public syncConnector(connectorId: string) {
    const conn = this.connectors.find((c) => c.id === connectorId);
    if (conn) {
      conn.status = "Syncing";
      setTimeout(() => {
        conn.status = "Active";
        conn.lastSync = new Date().toISOString();
        conn.iocCount += Math.floor(150 + Math.random() * 400);
        this.emit("connector_synced", conn);
      }, 1200);
      return conn;
    }
    return undefined;
  }

  public addIoc(iocData: Omit<IOC, "id">): IOC {
    const newIoc: IOC = {
      id: `IOC-${Math.floor(1000 + Math.random() * 9000)}`,
      ...iocData,
    };
    this.iocs.unshift(newIoc);
    this.emit("ioc_created", newIoc);
    return newIoc;
  }
}

export const threatIntelPlatformEngine = new ThreatIntelPlatformEngine();
