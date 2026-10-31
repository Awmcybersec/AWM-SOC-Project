import crypto from "crypto";
import { windowsLogger } from "../windows/windowsLogger.js";

export interface ApiKeyRecord {
  id: string;
  name: string;
  keyMasked: string;
  secretHash: string;
  scopes: string[];
  ownerEmail: string;
  rateLimitReqPerMin: number;
  currentRequestsThisMin: number;
  ipWhitelist: string[];
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
}

export interface EnterpriseIntegrationConnector {
  id: string;
  name: string;
  type: "SIEM_PLATFORM" | "TICKETING_SYSTEM" | "CLOUD_SECURITY" | "SOAR_FRAMEWORK";
  vendor: "Splunk" | "IBM QRadar" | "Microsoft Sentinel" | "ServiceNow" | "Jira Enterprise" | "AWS GuardDuty" | "Azure Defender" | "GCP SCC";
  endpointUrl: string;
  authMethod: "API_KEY" | "OAUTH2" | "MUTUAL_TLS";
  status: "CONNECTED" | "SYNCING" | "ERROR" | "DISCONNECTED";
  lastSyncTime: string;
  eventsProcessed24h: number;
}

export interface WebhookSubscription {
  id: string;
  targetUrl: string;
  secretKey: string;
  subscribedEvents: Array<"ALERT_CREATED" | "INCIDENT_ESCALATED" | "CONTAINMENT_TRIGGERED" | "COMPLIANCE_NONCOMPLIANT">;
  status: "ACTIVE" | "SUSPENDED";
  totalDelivered: number;
  failedAttempts: number;
  lastDeliveryStatus: "SUCCESS_200" | "FAILED_500" | "NEVER_TRIGGERED";
  lastDeliveryTime: string | null;
}

class EnterpriseApiGateway {
  private apiKeys: ApiKeyRecord[] = [
    {
      id: "KEY-SIEM-SPLUNK-01",
      name: "Splunk Enterprise SIEM Connector Key",
      keyMasked: "awm_live_99a82f...x7721",
      secretHash: crypto.createHash("sha256").update("splunk_secret_2026").digest("hex"),
      scopes: ["siem:read", "siem:write", "alerts:read"],
      ownerEmail: "siem-admin@enterprise.internal",
      rateLimitReqPerMin: 5000,
      currentRequestsThisMin: 142,
      ipWhitelist: ["10.0.1.0/24", "192.168.10.50"],
      status: "ACTIVE",
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      lastUsedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 335 * 86400000).toISOString(),
    },
    {
      id: "KEY-SERVICENOW-01",
      name: "ServiceNow Incident Automation Webhook Key",
      keyMasked: "awm_live_44b910...m9910",
      secretHash: crypto.createHash("sha256").update("servicenow_secret_2026").digest("hex"),
      scopes: ["incidents:read", "incidents:write", "webhooks:trigger"],
      ownerEmail: "itsm-admin@enterprise.internal",
      rateLimitReqPerMin: 1000,
      currentRequestsThisMin: 18,
      ipWhitelist: ["*"],
      status: "ACTIVE",
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      lastUsedAt: new Date(Date.now() - 300000).toISOString(),
      expiresAt: new Date(Date.now() + 350 * 86400000).toISOString(),
    },
  ];

  private connectors: EnterpriseIntegrationConnector[] = [
    {
      id: "CONN-SPLUNK",
      name: "Splunk Heavy Forwarder Sync",
      type: "SIEM_PLATFORM",
      vendor: "Splunk",
      endpointUrl: "https://splunk-hec.corp.internal:8088/services/collector",
      authMethod: "API_KEY",
      status: "CONNECTED",
      lastSyncTime: new Date().toISOString(),
      eventsProcessed24h: 1849200,
    },
    {
      id: "CONN-SERVICENOW",
      name: "ServiceNow Security Incident Response (SIR)",
      type: "TICKETING_SYSTEM",
      vendor: "ServiceNow",
      endpointUrl: "https://enterprise.service-now.com/api/now/table/sn_si_incident",
      authMethod: "OAUTH2",
      status: "CONNECTED",
      lastSyncTime: new Date(Date.now() - 120000).toISOString(),
      eventsProcessed24h: 420,
    },
    {
      id: "CONN-JIRA",
      name: "Jira Enterprise Security Board",
      type: "TICKETING_SYSTEM",
      vendor: "Jira Enterprise",
      endpointUrl: "https://jira.enterprise.internal/rest/api/3/issue",
      authMethod: "API_KEY",
      status: "CONNECTED",
      lastSyncTime: new Date(Date.now() - 300000).toISOString(),
      eventsProcessed24h: 180,
    },
    {
      id: "CONN-AWS",
      name: "AWS GuardDuty & Security Hub Ingest",
      type: "CLOUD_SECURITY",
      vendor: "AWS GuardDuty",
      endpointUrl: "https://guardduty.us-east-1.amazonaws.com",
      authMethod: "OAUTH2",
      status: "CONNECTED",
      lastSyncTime: new Date(Date.now() - 60000).toISOString(),
      eventsProcessed24h: 312000,
    },
    {
      id: "CONN-AZURE",
      name: "Microsoft Defender for Cloud Integration",
      type: "CLOUD_SECURITY",
      vendor: "Azure Defender",
      endpointUrl: "https://management.azure.com/subscriptions/8f74a321",
      authMethod: "OAUTH2",
      status: "CONNECTED",
      lastSyncTime: new Date(Date.now() - 90000).toISOString(),
      eventsProcessed24h: 245000,
    },
  ];

  private webhooks: WebhookSubscription[] = [
    {
      id: "WH-SNOW-01",
      targetUrl: "https://enterprise.service-now.com/api/sn_si/incident_webhook",
      secretKey: "whsec_awm_89128391283912312",
      subscribedEvents: ["ALERT_CREATED", "INCIDENT_ESCALATED", "CONTAINMENT_TRIGGERED"],
      status: "ACTIVE",
      totalDelivered: 1420,
      failedAttempts: 0,
      lastDeliveryStatus: "SUCCESS_200",
      lastDeliveryTime: new Date(Date.now() - 180000).toISOString(),
    },
  ];

  public getApiKeys(): ApiKeyRecord[] {
    return this.apiKeys;
  }

  public createApiKey(name: string, ownerEmail: string, scopes: string[], rateLimit: number): { apiKeyRecord: ApiKeyRecord; rawSecretKey: string } {
    const rawSecretKey = `awm_live_${crypto.randomBytes(18).toString("hex")}`;
    const secretHash = crypto.createHash("sha256").update(rawSecretKey).digest("hex");
    const keyMasked = `${rawSecretKey.slice(0, 12)}...${rawSecretKey.slice(-5)}`;

    const newKey: ApiKeyRecord = {
      id: `KEY-${Date.now().toString(36).toUpperCase()}`,
      name,
      keyMasked,
      secretHash,
      scopes: scopes.length ? scopes : ["siem:read", "alerts:read"],
      ownerEmail,
      rateLimitReqPerMin: rateLimit || 1000,
      currentRequestsThisMin: 0,
      ipWhitelist: ["*"],
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    };

    this.apiKeys.unshift(newKey);
    windowsLogger.audit("API_GATEWAY", `Created new Enterprise API Key: '${name}' (${newKey.id}) for ${ownerEmail}`);

    return { apiKeyRecord: newKey, rawSecretKey };
  }

  public revokeApiKey(id: string): boolean {
    const key = this.apiKeys.find((k) => k.id === id);
    if (!key) return false;
    key.status = "REVOKED";
    windowsLogger.audit("API_GATEWAY", `Revoked API Key '${key.name}' (${id})`);
    return true;
  }

  public getConnectors(): EnterpriseIntegrationConnector[] {
    return this.connectors;
  }

  public getWebhooks(): WebhookSubscription[] {
    return this.webhooks;
  }

  public createWebhookSubscription(targetUrl: string, subscribedEvents: Array<"ALERT_CREATED" | "INCIDENT_ESCALATED" | "CONTAINMENT_TRIGGERED" | "COMPLIANCE_NONCOMPLIANT">): WebhookSubscription {
    const secretKey = `whsec_${crypto.randomBytes(16).toString("hex")}`;
    const newWh: WebhookSubscription = {
      id: `WH-${Date.now().toString(36).toUpperCase()}`,
      targetUrl,
      secretKey,
      subscribedEvents,
      status: "ACTIVE",
      totalDelivered: 0,
      failedAttempts: 0,
      lastDeliveryStatus: "NEVER_TRIGGERED",
      lastDeliveryTime: null,
    };

    this.webhooks.unshift(newWh);
    windowsLogger.audit("WEBHOOKS", `Subscribed new Webhook endpoint '${targetUrl}' (${newWh.id})`);
    return newWh;
  }

  public testWebhookPayload(webhookId: string): { success: boolean; statusCode: number; payloadSample: any; signatureHeader: string } {
    const wh = this.webhooks.find((w) => w.id === webhookId);
    if (!wh) {
      return { success: false, statusCode: 404, payloadSample: null, signatureHeader: "" };
    }

    const testPayload = {
      event: "ALERT_CREATED",
      timestamp: new Date().toISOString(),
      alertId: "ALT-2026-9921",
      title: "TEST WEBHOOK EVENT - Ransomware Memory Injection Detected",
      severity: "CRITICAL",
      affectedAsset: "DC-PRIMARY-01",
      sourceIp: "185.220.101.99",
      mitreTactic: "Execution",
      mitreTechnique: "Process Injection (T1055)",
    };

    const signature = crypto.createHmac("sha256", wh.secretKey).update(JSON.stringify(testPayload)).digest("hex");

    wh.totalDelivered += 1;
    wh.lastDeliveryStatus = "SUCCESS_200";
    wh.lastDeliveryTime = new Date().toISOString();

    windowsLogger.audit("WEBHOOKS", `Dispatched test payload to Webhook '${wh.targetUrl}'`);

    return {
      success: true,
      statusCode: 200,
      payloadSample: testPayload,
      signatureHeader: `sha256=${signature}`,
    };
  }
}

export const enterpriseApiGateway = new EnterpriseApiGateway();
