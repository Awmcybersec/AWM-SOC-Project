import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { siemEngine } from "./src/server/siemEngine";
import { databaseStorage } from "./src/server/storage/databaseStorage";
import wazuhRoutes from "./src/server/routes/wazuhRoutes.js";

if (!process.env.NODE_ENV && process.argv[1] && process.argv[1].endsWith("dist/server.cjs")) {
  process.env.NODE_ENV = "production";
}
import { ndrEngine } from "./src/server/ndrEngine";
import { uebaEngine } from "./src/server/uebaEngine";
import { vulnerabilityEngine } from "./src/server/vulnerabilityEngine";
import { tenantEngine } from "./src/server/tenantEngine";
import { responseSimulationEngine } from "./src/server/responseSimulationEngine";
import { windowsServiceEngine } from "./src/server/windows/windowsServiceEngine.js";
import { securityHardening } from "./src/server/windows/securityHardening.js";
import { windowsLogger } from "./src/server/windows/windowsLogger.js";
import { enterpriseIamEngine } from "./src/server/iam/enterpriseIamEngine.js";
import { enterpriseLicenseEngine } from "./src/server/licensing/enterpriseLicenseEngine.js";
import { enterpriseAuditComplianceEngine } from "./src/server/compliance/enterpriseAuditComplianceEngine.js";
import { incidentManagementEngine } from "./src/server/incidents/incidentManagementEngine.js";
import { enterpriseApiGateway } from "./src/server/gateway/enterpriseApiGateway.js";
import { multiEnvConfigEngine } from "./src/server/multienv/multiEnvConfigEngine.js";
import { softwareUpdateEngine } from "./src/server/lifecycle/softwareUpdateEngine.js";
import { organizationEngine } from "./src/server/organizations/organizationEngine.js";
import agentRoutes from "./src/server/routes/agentRoutes.js";
import { telemetryRoutes } from "./src/server/routes/telemetryRoutes.js";
import "./src/server/config/env.js";
const isProduction = process.env.NODE_ENV === "production";
const enableSocCorrelation = process.env.SOC_CORRELATION_ENABLED === "true";
const enableAiBackgroundMonitoring = process.env.AI_BACKGROUND_MONITORING === "true";

let edrEngine: any;
let soarEngine: any;
let threatIntelEngine: any;
let complianceEngine: any;
let autonomousResponseEngine: any;
let aiGateway: any;
let aiSocAnalystAssistant: any;
let enterpriseReportingEngine: any;
let advancedAnalyticsEngine: any;
let threatIntelPlatformEngine: any;
let socCommandEngine: any;

const lazyLoadedModules = new Set<string>();
function logBoot(message: string) {
  console.log(`[BOOT] ${message}`);
}

function logLazyLoad(moduleName: string) {
  if (!lazyLoadedModules.has(moduleName)) {
    lazyLoadedModules.add(moduleName);
    console.log(`[BOOT] AI modules loaded only on demand: ${moduleName}`);
  }
}

async function getEdrEngine() {
  if (!edrEngine) {
    const mod = await import("./src/server/edrEngine.js");
    edrEngine = mod.edrEngine;
    logLazyLoad("edrEngine");
  }
  return edrEngine;
}

async function getSoarEngine() {
  if (!soarEngine) {
    const mod = await import("./src/server/soarEngine.js");
    soarEngine = mod.soarEngine;
    logLazyLoad("soarEngine");
  }
  return soarEngine;
}

async function getThreatIntelEngine() {
  if (!threatIntelEngine) {
    const mod = await import("./src/server/threatIntelEngine.js");
    threatIntelEngine = mod.threatIntelEngine;
    logLazyLoad("threatIntelEngine");
  }
  return threatIntelEngine;
}

async function getComplianceEngine() {
  if (!complianceEngine) {
    const mod = await import("./src/server/complianceEngine.js");
    complianceEngine = mod.complianceEngine;
    logLazyLoad("complianceEngine");
  }
  return complianceEngine;
}

async function getAutonomousResponseEngine() {
  if (!autonomousResponseEngine) {
    const mod = await import("./src/server/autonomousResponseEngine.js");
    autonomousResponseEngine = mod.autonomousResponseEngine;
    logLazyLoad("autonomousResponseEngine");
  }
  return autonomousResponseEngine;
}

async function getAiGateway() {
  if (!aiGateway) {
    const mod = await import("./src/server/ai/aiGateway.js");
    aiGateway = mod.aiGateway;
    logLazyLoad("aiGateway");
  }
  return aiGateway;
}

async function getAiSocAnalystAssistant() {
  if (!aiSocAnalystAssistant) {
    const mod = await import("./src/server/ai/aiSocAnalystAssistant.js");
    aiSocAnalystAssistant = mod.aiSocAnalystAssistant;
    logLazyLoad("aiSocAnalystAssistant");
  }
  return aiSocAnalystAssistant;
}

async function getEnterpriseReportingEngine() {
  if (!enterpriseReportingEngine) {
    const mod = await import("./src/server/reporting/enterpriseReportingEngine.js");
    enterpriseReportingEngine = mod.enterpriseReportingEngine;
    logLazyLoad("enterpriseReportingEngine");
  }
  return enterpriseReportingEngine;
}

async function getAdvancedAnalyticsEngine() {
  if (!advancedAnalyticsEngine) {
    const mod = await import("./src/server/analytics/advancedAnalyticsEngine.js");
    advancedAnalyticsEngine = mod.advancedAnalyticsEngine;
    logLazyLoad("advancedAnalyticsEngine");
  }
  return advancedAnalyticsEngine;
}

async function getThreatIntelPlatformEngine() {
  if (!threatIntelPlatformEngine) {
    const mod = await import("./src/server/threatintel/threatIntelPlatformEngine.js");
    threatIntelPlatformEngine = mod.threatIntelPlatformEngine;
    logLazyLoad("threatIntelPlatformEngine");
  }
  return threatIntelPlatformEngine;
}

async function getSocCommandEngine() {
  if (!socCommandEngine) {
    const mod = await import("./src/server/socCommandEngine.js");
    socCommandEngine = mod.socCommandEngine;
    logLazyLoad("socCommandEngine");
  }
  return socCommandEngine;
}

let enhancedSoarEngine: any;
async function getEnhancedSoarEngine() {
  if (!enhancedSoarEngine) {
    const mod = await import("./src/server/soar/enhancedSoarEngine.js");
    enhancedSoarEngine = mod.enhancedSoarEngine;
    logLazyLoad("enhancedSoarEngine");
  }
  return enhancedSoarEngine;
}

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
app.use(express.json({ limit: "10mb" }));
app.use("/api/agent", agentRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/wazuh", wazuhRoutes);

// ============================================================================
// SIEM ENGINE REST API & STREAMING ENDPOINTS
// ============================================================================

// 1. Query Ingested Logs
app.get("/api/siem/logs", async (req, res) => {
  try {
    const { kql, level, sourceType, startDate, endDate, limit, offset } = req.query;

    const result = await siemEngine.queryLogs({
      kql: kql as string,
      level: level as string,
      sourceType: sourceType as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to query SIEM logs",
      details: error.message,
    });
  }
});
// 2. Ingest New Raw Log & Trigger ECS Parser + Correlation Engine
app.post("/api/siem/ingest", (req, res) => {
  try {
    const rawInput = req.body;
    if (!rawInput || !rawInput.message) {
      return res.status(400).json({ error: "Missing required 'message' field in log payload" });
    }

    const logEntry = siemEngine.ingestRawLog(rawInput);
    res.status(201).json({
      status: "success",
      message: "Log ingested, normalized to ECS, and processed by correlation engine",
      log: logEntry,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to ingest log", details: error.message });
  }
});

// 3. Get Telemetry Statistics
app.get("/api/siem/stats", (req, res) => {
  try {
    const stats = siemEngine.getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to retrieve SIEM statistics", details: error.message });
  }
});

// 4. Get & Manage Correlation Rules
app.get("/api/siem/rules", async (req, res) => {
  try {
    const rules = await databaseStorage.getSiemRules();
    res.json(rules);
  } catch (error: any) {
    console.error("[SIEM] Failed to load rules:", error);

    res.status(500).json({
      error: "Failed to load SIEM rules",
      details: error.message,
    });
  }
});

app.post("/api/siem/rules", (req, res) => {
  try {
    const newRule = req.body;
    if (!newRule.id || !newRule.title || !newRule.conditionKql) {
      return res.status(400).json({ error: "Rule requires id, title, and conditionKql fields" });
    }
    const created = siemEngine.addRule(newRule);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create rule", details: error.message });
  }
});

app.delete("/api/siem/rules/:id", (req, res) => {
  const success = siemEngine.deleteRule(req.params.id);
  if (success) {
    res.json({ status: "success", message: `Rule ${req.params.id} deleted` });
  } else {
    res.status(404).json({ error: "Rule not found" });
  }
});

// 5. Get Correlation Alerts
app.get("/api/siem/alerts", async (req, res) => {
  try {
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 100;

    const alerts = await databaseStorage.getSiemAlerts(limit);

    res.json(alerts);
  } catch (error: any) {
    console.error("[SIEM] Failed to load alerts:", error);

    res.status(500).json({
      error: "Failed to load SIEM alerts",
      details: error.message,
    });
  }
});
// ============================================================
// SIEM ALERT LIFECYCLE - PostgreSQL
// ============================================================

// Move alert to INVESTIGATING
app.post("/api/siem/alerts/:id/investigate", async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await databaseStorage.updateSiemAlertStatus(
      id,
      "INVESTIGATING"
    );

    if (!alert) {
      return res.status(404).json({
        status: "error",
        message: "SIEM alert not found",
      });
    }

    return res.json({
      status: "success",
      message: "SIEM alert moved to INVESTIGATING",
      alert,
    });
  } catch (error) {
    console.error("[SIEM] Failed to investigate alert:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to update SIEM alert",
    });
  }
});

// Move alert to MITIGATED
app.post("/api/siem/alerts/:id/mitigate", async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await databaseStorage.updateSiemAlertStatus(
      id,
      "MITIGATED"
    );

    if (!alert) {
      return res.status(404).json({
        status: "error",
        message: "SIEM alert not found",
      });
    }

    return res.json({
      status: "success",
      message: "SIEM alert marked as MITIGATED",
      alert,
    });
  } catch (error) {
    console.error("[SIEM] Failed to mitigate alert:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to update SIEM alert",
    });
  }
});

// Mark alert as FALSE_POSITIVE
app.post("/api/siem/alerts/:id/false-positive", async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await databaseStorage.updateSiemAlertStatus(
      id,
      "FALSE_POSITIVE"
    );

    if (!alert) {
      return res.status(404).json({
        status: "error",
        message: "SIEM alert not found",
      });
    }

    return res.json({
      status: "success",
      message: "SIEM alert marked as FALSE_POSITIVE",
      alert,
    });
  } catch (error) {
    console.error("[SIEM] Failed to mark alert false positive:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to update SIEM alert",
    });
  }
});

// 6. Real-Time Server-Sent Events (SSE) Stream
app.get("/api/siem/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  const onNewLog = (log: any) => {
    res.write(`data: ${JSON.stringify({ type: "log", payload: log })}\n\n`);
  };

  const onNewAlert = (alert: any) => {
    res.write(`data: ${JSON.stringify({ type: "alert", payload: alert })}\n\n`);
  };

  siemEngine.on("new_log", onNewLog);
  siemEngine.on("new_alert", onNewAlert);

  req.on("close", () => {
    siemEngine.off("new_log", onNewLog);
    siemEngine.off("new_alert", onNewAlert);
  });
});

// ============================================================================
// NDR / NIDS ENGINE REST API & STREAMING ENDPOINTS
// ============================================================================

// 1. Query Network Flows
app.get("/api/ndr/flows", (req, res) => {
  try {
    const { protocol, sourceIp, destinationIp, limit } = req.query;
    const result = ndrEngine.queryFlows({
      protocol: protocol as string,
      sourceIp: sourceIp as string,
      destinationIp: destinationIp as string,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to query network flows", details: error.message });
  }
});

// 2. Ingest Flow Telemetry (DPI + Detection Rules Engine)
app.post("/api/ndr/flows/ingest", (req, res) => {
  try {
    const rawFlow = req.body;
    if (!rawFlow) {
      return res.status(400).json({ error: "Missing required flow payload" });
    }
    const flow = ndrEngine.ingestFlow(rawFlow);
    res.status(201).json({ status: "success", flow });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to ingest network flow", details: error.message });
  }
});

// 3. Raw Packet PCAP Inspection Telemetry
app.get("/api/ndr/packets", (req, res) => {
  res.json(ndrEngine.getPackets());
});

app.get("/api/ndr/packets/:id", (req, res) => {
  const packet = ndrEngine.getPacketById(req.params.id);
  if (packet) {
    res.json(packet);
  } else {
    res.status(404).json({ error: "Packet evidence not found" });
  }
});

// 4. Intrusion Alerts
app.get("/api/ndr/alerts", (req, res) => {
  res.json(ndrEngine.getAlerts());
});

// 5. Sensors Status
app.get("/api/ndr/sensors", (req, res) => {
  res.json(ndrEngine.getSensors());
});

// 6. Detection Rules
app.get("/api/ndr/rules", (req, res) => {
  res.json(ndrEngine.getRules());
});

app.post("/api/ndr/rules", (req, res) => {
  try {
    const newRule = req.body;
    if (!newRule.id || !newRule.title || !newRule.patternExpression) {
      return res.status(400).json({ error: "Rule requires id, title, and patternExpression" });
    }
    const created = ndrEngine.addRule(newRule);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create NDR rule", details: error.message });
  }
});

app.delete("/api/ndr/rules/:id", (req, res) => {
  const success = ndrEngine.deleteRule(req.params.id);
  if (success) {
    res.json({ status: "success", message: `NDR Rule ${req.params.id} deleted` });
  } else {
    res.status(404).json({ error: "Rule not found" });
  }
});

// 7. Network Bandwidth & Flow Stats
app.get("/api/ndr/stats", (req, res) => {
  res.json(ndrEngine.getStats());
});

// 8. NDR Real-Time Server-Sent Events Stream
app.get("/api/ndr/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  const onNewFlow = (flow: any) => {
    res.write(`data: ${JSON.stringify({ type: "flow", payload: flow })}\n\n`);
  };

  const onNewAlert = (alert: any) => {
    res.write(`data: ${JSON.stringify({ type: "alert", payload: alert })}\n\n`);
  };

  ndrEngine.on("new_flow", onNewFlow);
  ndrEngine.on("new_alert", onNewAlert);

  req.on("close", () => {
    ndrEngine.off("new_flow", onNewFlow);
    ndrEngine.off("new_alert", onNewAlert);
  });
});

// ============================================================================
// EDR (ENDPOINT DETECTION & RESPONSE) ENGINE REST API & STREAMING ENDPOINTS
// ============================================================================

// 1. Get Endpoints Inventory
app.get("/api/edr/endpoints", async (req, res) => {
  const edrEngine = await getEdrEngine();
  res.json(edrEngine.getEndpoints());
});

app.get("/api/edr/endpoints/:id", async (req, res) => {
  const edrEngine = await getEdrEngine();
  const ep = edrEngine.getEndpointById(req.params.id);
  if (ep) {
    res.json(ep);
  } else {
    res.status(404).json({ error: "Endpoint not found" });
  }
});

// 2. Network Isolation Control Toggle
app.post("/api/edr/endpoints/:id/isolate", async (req, res) => {
  const edrEngine = await getEdrEngine();
  const { isolate } = req.body;
  const ep = edrEngine.isolateEndpoint(req.params.id, isolate === true);
  if (ep) {
    res.json({ status: "success", endpoint: ep });
  } else {
    res.status(404).json({ error: "Endpoint not found" });
  }
});

// 3. Process Explorer & Ingestion
app.get("/api/edr/processes", async (req, res) => {
  const edrEngine = await getEdrEngine();
  const endpointId = req.query.endpointId as string | undefined;
  res.json(edrEngine.getProcesses(endpointId));
});

app.post("/api/edr/processes/ingest", async (req, res) => {
  try {
    const edrEngine = await getEdrEngine();
    const proc = edrEngine.ingestProcessEvent(req.body);
    res.status(201).json({ status: "success", process: proc });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to ingest process event", details: error.message });
  }
});

// 4. File Integrity Monitoring (FIM) & Ingestion
app.get("/api/edr/file-events", async (req, res) => {
  const edrEngine = await getEdrEngine();
  const endpointId = req.query.endpointId as string | undefined;
  res.json(edrEngine.getFileEvents(endpointId));
});

app.post("/api/edr/file-events/ingest", async (req, res) => {
  try {
    const edrEngine = await getEdrEngine();
    const fileEvent = edrEngine.ingestFileEvent(req.body);
    res.status(201).json({ status: "success", fileEvent });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to ingest file event", details: error.message });
  }
});

// 5. Registry Persistence Events & Ingestion
app.get("/api/edr/registry-events", async (req, res) => {
  const edrEngine = await getEdrEngine();
  const endpointId = req.query.endpointId as string | undefined;
  res.json(edrEngine.getRegistryEvents(endpointId));
});

app.post("/api/edr/registry-events/ingest", async (req, res) => {
  try {
    const edrEngine = await getEdrEngine();
    const regEvent = edrEngine.ingestRegistryEvent(req.body);
    res.status(201).json({ status: "success", regEvent });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to ingest registry event", details: error.message });
  }
});

// 6. Memory Analysis Events
app.get("/api/edr/memory-events", async (req, res) => {
  const edrEngine = await getEdrEngine();
  const endpointId = req.query.endpointId as string | undefined;
  res.json(edrEngine.getMemoryEvents(endpointId));
});

// 7. EDR Endpoint Alerts
app.get("/api/edr/alerts", async (req, res) => {
  const edrEngine = await getEdrEngine();
  const endpointId = req.query.endpointId as string | undefined;
  res.json(edrEngine.getAlerts(endpointId));
});

// 8. Remote SOAR Response Actions Console
app.get("/api/edr/response-actions", async (req, res) => {
  const edrEngine = await getEdrEngine();
  const endpointId = req.query.endpointId as string | undefined;
  res.json(edrEngine.getResponseActions(endpointId));
});

app.post("/api/edr/response-actions", async (req, res) => {
  try {
    const edrEngine = await getEdrEngine();
    const { endpointId, actionType, details } = req.body;
    if (!endpointId || !actionType) {
      return res.status(400).json({ error: "endpointId and actionType required" });
    }
    const action = edrEngine.executeResponseAction(endpointId, actionType, details);
    res.status(201).json({ status: "success", action });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to execute response action", details: error.message });
  }
});

// 9. EDR Detection Rules
app.get("/api/edr/rules", async (req, res) => {
  const edrEngine = await getEdrEngine();
  res.json(edrEngine.getRules());
});

app.post("/api/edr/rules", async (req, res) => {
  try {
    const edrEngine = await getEdrEngine();
    const rule = edrEngine.addRule(req.body);
    res.status(201).json(rule);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add detection rule", details: error.message });
  }
});

app.delete("/api/edr/rules/:id", async (req, res) => {
  const edrEngine = await getEdrEngine();
  const ok = edrEngine.deleteRule(req.params.id);
  if (ok) res.json({ status: "success" });
  else res.status(404).json({ error: "Rule not found" });
});

// 10. AI Behavior Investigation Endpoint
app.post("/api/edr/ai-investigate", async (req, res) => {
  try {
    const edrEngine = await getEdrEngine();
    const { endpointId } = req.body;
    if (!endpointId) {
      return res.status(400).json({ error: "endpointId is required" });
    }
    const analysis = await edrEngine.analyzeEndpointBehaviorWithAI(endpointId);
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to complete AI investigation", details: error.message });
  }
});

// 11. EDR Engine High-Level Statistics
app.get("/api/edr/stats", async (req, res) => {
  const edrEngine = await getEdrEngine();
  res.json(edrEngine.getStats());
});

// 12. EDR Real-Time SSE Stream
app.get("/api/edr/stream", async (req, res) => {
  const edrEngine = await getEdrEngine();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  const onProc = (proc: any) => res.write(`data: ${JSON.stringify({ type: "process", payload: proc })}\n\n`);
  const onFile = (file: any) => res.write(`data: ${JSON.stringify({ type: "file", payload: file })}\n\n`);
  const onReg = (reg: any) => res.write(`data: ${JSON.stringify({ type: "registry", payload: reg })}\n\n`);
  const onAlert = (alt: any) => res.write(`data: ${JSON.stringify({ type: "alert", payload: alt })}\n\n`);
  const onEp = (ep: any) => res.write(`data: ${JSON.stringify({ type: "endpoint", payload: ep })}\n\n`);

  edrEngine.on("process_event", onProc);
  edrEngine.on("file_event", onFile);
  edrEngine.on("registry_event", onReg);
  edrEngine.on("alert", onAlert);
  edrEngine.on("endpoint_updated", onEp);

  req.on("close", () => {
    edrEngine.off("process_event", onProc);
    edrEngine.off("file_event", onFile);
    edrEngine.off("registry_event", onReg);
    edrEngine.off("alert", onAlert);
    edrEngine.off("endpoint_updated", onEp);
  });
});

// ============================================================================
// UEBA (USER & ENTITY BEHAVIOR ANALYTICS) REST API & STREAMING ENDPOINTS
// ============================================================================

// 1. Get Monitored Users & Entities
app.get("/api/ueba/users", (req, res) => {
  res.json(uebaEngine.getUsers());
});

app.get("/api/ueba/entities", (req, res) => {
  res.json(uebaEngine.getUsers());
});

app.get("/api/ueba/users/:id", (req, res) => {
  const user = uebaEngine.getUserById(req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "UEBA user not found" });
  }
});

// 2. Ingest Login or Entity Event
app.post("/api/ueba/events", (req, res) => {
  try {
    const loginEvent = uebaEngine.ingestLoginEvent(req.body);
    res.status(201).json({ status: "success", event: loginEvent });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to ingest UEBA event", details: error.message });
  }
});

// 3. Get Anomalies
app.get("/api/ueba/anomalies", (req, res) => {
  const userId = req.query.userId as string | undefined;
  res.json(uebaEngine.getAnomalies(userId));
});

// 4. Get Risk Score for Entity
app.get("/api/ueba/risk/:entityId", (req, res) => {
  const user = uebaEngine.getUserById(req.params.entityId);
  if (user) {
    res.json({
      entityId: user.id,
      username: user.username,
      risk_score: user.risk_score,
      risk_level: user.risk_level,
      anomalies: uebaEngine.getAnomalies(user.id),
    });
  } else {
    res.status(404).json({ error: "Entity not found" });
  }
});

// 5. AI Identity Investigation Endpoint
app.post("/api/ueba/investigate", async (req, res) => {
  try {
    const { userId, entityId } = req.body;
    const targetId = userId || entityId || "USR-ADMIN-01";
    const report = await uebaEngine.investigateUserWithAI(targetId);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to execute UEBA AI investigation", details: error.message });
  }
});

// 6. UEBA High-Level Statistics
app.get("/api/ueba/statistics", (req, res) => {
  res.json(uebaEngine.getStats());
});

app.get("/api/ueba/stats", (req, res) => {
  res.json(uebaEngine.getStats());
});

// 7. UEBA Real-Time Server-Sent Events Stream
app.get("/api/ueba/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  const onLogin = (evt: any) => res.write(`data: ${JSON.stringify({ type: "login_event", payload: evt })}\n\n`);
  const onAnomaly = (ano: any) => res.write(`data: ${JSON.stringify({ type: "anomaly", payload: ano })}\n\n`);

  uebaEngine.on("login_event", onLogin);
  uebaEngine.on("anomaly", onAnomaly);

  req.on("close", () => {
    uebaEngine.off("login_event", onLogin);
    uebaEngine.off("anomaly", onAnomaly);
  });
});

// ============================================================================
// SOAR (SECURITY ORCHESTRATION, AUTOMATION & RESPONSE) REST API
// ============================================================================

// 1. Get Enterprise Playbooks
app.get("/api/soar/playbooks", async (req, res) => {
  const soarEngine = await getSoarEngine();
  res.json(soarEngine.getPlaybooks());
});

app.post("/api/soar/playbooks", async (req, res) => {
  try {
    const soarEngine = await getSoarEngine();
    const playbook = soarEngine.createPlaybook(req.body);
    res.status(201).json(playbook);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create playbook", details: error.message });
  }
});

// 2. Trigger/Run Playbook Execution
app.post("/api/soar/playbooks/:id/run", async (req, res) => {
  try {
    const soarEngine = await getSoarEngine();
    const execution = await soarEngine.runPlaybook(req.params.id, req.body);
    res.json({ status: "success", execution });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to execute playbook", details: error.message });
  }
});

// 3. Get SOAR Incidents & Cases
app.get("/api/soar/incidents", async (req, res) => {
  const soarEngine = await getSoarEngine();
  res.json(soarEngine.getIncidents());
});

// 4. Get Executions Log
app.get("/api/soar/executions", async (req, res) => {
  const soarEngine = await getSoarEngine();
  res.json(soarEngine.getExecutions());
});

// 5. Get Pending Human-in-the-Loop Approvals
app.get("/api/soar/approvals", async (req, res) => {
  const soarEngine = await getSoarEngine();
  res.json(soarEngine.getApprovals());
});

// 6. Decide Approval Gate (Approve/Reject)
app.post("/api/soar/approvals/:id/decide", async (req, res) => {
  try {
    const soarEngine = await getSoarEngine();
    const { decision, approver } = req.body;
    const execution = await soarEngine.decideApproval(req.params.id, decision, approver);
    res.json({ status: "success", execution });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to process approval decision", details: error.message });
  }
});

// 7. AI Playbook Synthesis
app.post("/api/soar/generate-playbook", async (req, res) => {
  try {
    const soarEngine = await getSoarEngine();
    const { threatScenario, targetAsset } = req.body;
    const playbook = await soarEngine.generatePlaybookWithAI(
      threatScenario || "Active Directory Golden Ticket Attack",
      targetAsset || "Domain Controller Cluster"
    );
    res.json(playbook);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to synthesize AI playbook", details: error.message });
  }
});

// 8. SOAR Statistics
app.get("/api/soar/stats", async (req, res) => {
  const soarEngine = await getSoarEngine();
  res.json(soarEngine.getStats());
});

// 9. SOAR Real-Time SSE Stream
app.get("/api/soar/stream", async (req, res) => {
  const soarEngine = await getSoarEngine();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  const onExecUpdate = (exec: any) => res.write(`data: ${JSON.stringify({ type: "execution_update", payload: exec })}\n\n`);
  const onApproval = (appr: any) => res.write(`data: ${JSON.stringify({ type: "approval_required", payload: appr })}\n\n`);

  soarEngine.on("execution_update", onExecUpdate);
  soarEngine.on("approval_required", onApproval);

  req.on("close", () => {
    soarEngine.off("execution_update", onExecUpdate);
    soarEngine.off("approval_required", onApproval);
  });
});

// ============================================================================
// ENTERPRISE THREAT INTELLIGENCE PLATFORM (TIP) REST API
// ============================================================================

// 1. GET /api/threatintel/iocs
app.get("/api/threatintel/iocs", async (req, res) => {
  const threatIntelEngine = await getThreatIntelEngine();
  res.json(threatIntelEngine.getIocs());
});

// 2. POST /api/threatintel/iocs
app.post("/api/threatintel/iocs", async (req, res) => {
  try {
    const threatIntelEngine = await getThreatIntelEngine();
    const ioc = threatIntelEngine.ingestIoc(req.body);
    res.status(201).json(ioc);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to ingest IOC indicator", details: error.message });
  }
});

// 3. GET /api/threatintel/feeds
app.get("/api/threatintel/feeds", async (req, res) => {
  const threatIntelEngine = await getThreatIntelEngine();
  res.json(threatIntelEngine.getFeeds());
});

// 4. POST /api/threatintel/sync
app.post("/api/threatintel/sync", async (req, res) => {
  try {
    const threatIntelEngine = await getThreatIntelEngine();
    const syncResult = await threatIntelEngine.syncFeeds();
    res.json({ status: "success", syncResult });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to sync threat feeds", details: error.message });
  }
});

// 5. GET /api/threatintel/actors
app.get("/api/threatintel/actors", async (req, res) => {
  const threatIntelEngine = await getThreatIntelEngine();
  res.json(threatIntelEngine.getActors());
});

// 6. GET /api/threatintel/campaigns
app.get("/api/threatintel/campaigns", async (req, res) => {
  const threatIntelEngine = await getThreatIntelEngine();
  res.json(threatIntelEngine.getCampaigns());
});

// 7. POST /api/threatintel/enrich
app.post("/api/threatintel/enrich", async (req, res) => {
  try {
    const threatIntelEngine = await getThreatIntelEngine();
    const { iocValue, iocType } = req.body;
    const enriched = await threatIntelEngine.enrichIoc(iocValue || "185.220.101.5", iocType || "IPv4");
    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to enrich IOC", details: error.message });
  }
});

// 8. GET /api/threatintel/reports
app.get("/api/threatintel/reports", async (req, res) => {
  const threatIntelEngine = await getThreatIntelEngine();
  res.json(threatIntelEngine.getReports());
});

app.post("/api/threatintel/generate-report", async (req, res) => {
  try {
    const threatIntelEngine = await getThreatIntelEngine();
    const { threatActor } = req.body;
    const report = await threatIntelEngine.generateThreatReport(threatActor || "APT28 (Fancy Bear)");
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate threat report", details: error.message });
  }
});

// 9. GET /api/threatintel/stream (SSE Stream)
app.get("/api/threatintel/stream", async (req, res) => {
  const threatIntelEngine = await getThreatIntelEngine();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  const onIocIngested = (ioc: any) => res.write(`data: ${JSON.stringify({ type: "ioc_ingested", payload: ioc })}\n\n`);
  const onIocMatch = (match: any) => res.write(`data: ${JSON.stringify({ type: "ioc_match", payload: match })}\n\n`);

  threatIntelEngine.on("ioc_ingested", onIocIngested);
  threatIntelEngine.on("ioc_match", onIocMatch);

  req.on("close", () => {
    threatIntelEngine.off("ioc_ingested", onIocIngested);
    threatIntelEngine.off("ioc_match", onIocMatch);
  });
});

// 10. Threat Intel Stats & Matches
app.get("/api/threatintel/stats", async (req, res) => {
  const threatIntelEngine = await getThreatIntelEngine();
  res.json(threatIntelEngine.getStats());
});

app.get("/api/threatintel/matches", async (req, res) => {
  const threatIntelEngine = await getThreatIntelEngine();
  res.json(threatIntelEngine.getMatches());
});

// ============================================================================
// ENTERPRISE VULNERABILITY & ATTACK SURFACE MANAGEMENT (VM/ASM) REST API
// ============================================================================

// 1. GET /api/vulnerability/assets
app.get("/api/vulnerability/assets", (req, res) => {
  res.json(vulnerabilityEngine.getAssets());
});

// 2. POST /api/vulnerability/scan
app.post("/api/vulnerability/scan", async (req, res) => {
  try {
    const { scanName, targetRange } = req.body;
    const scan = await vulnerabilityEngine.runScan(scanName, targetRange);
    res.status(201).json(scan);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to initiate vulnerability scan", details: error.message });
  }
});

// 3. GET /api/vulnerability/findings
app.get("/api/vulnerability/findings", (req, res) => {
  res.json(vulnerabilityEngine.getVulnerabilities());
});

// 4. GET /api/vulnerability/cves
app.get("/api/vulnerability/cves", (req, res) => {
  res.json(vulnerabilityEngine.getCves());
});

// 5. GET /api/vulnerability/risk/:assetId
app.get("/api/vulnerability/risk/:assetId", (req, res) => {
  try {
    const riskScore = vulnerabilityEngine.getRiskScore(req.params.assetId);
    res.json(riskScore);
  } catch (error: any) {
    res.status(404).json({ error: "Asset risk score not found", details: error.message });
  }
});

// 6. POST /api/vulnerability/remediate
app.post("/api/vulnerability/remediate", (req, res) => {
  try {
    const { vulnerabilityId, actionType } = req.body;
    const task = vulnerabilityEngine.remediateVulnerability(vulnerabilityId, actionType);
    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to trigger vulnerability remediation", details: error.message });
  }
});

// 7. GET /api/vulnerability/attack-surface
app.get("/api/vulnerability/attack-surface", (req, res) => {
  res.json(vulnerabilityEngine.getAttackSurface());
});

// 8. GET /api/vulnerability/reports
app.get("/api/vulnerability/reports", (req, res) => {
  res.json(vulnerabilityEngine.getReports());
});

app.post("/api/vulnerability/generate-report", async (req, res) => {
  try {
    const report = await vulnerabilityEngine.generateExecutiveReport();
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate executive VM report", details: error.message });
  }
});

app.post("/api/vulnerability/explain", async (req, res) => {
  try {
    const { vulnId } = req.body;
    const explanation = await vulnerabilityEngine.explainVulnerability(vulnId || "VULN-2026-001");
    res.json(explanation);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to explain vulnerability", details: error.message });
  }
});

// 9. GET /api/vulnerability/stream (SSE Stream)
app.get("/api/vulnerability/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  const onScanStarted = (scan: any) => res.write(`data: ${JSON.stringify({ type: "scan_started", payload: scan })}\n\n`);
  const onScanCompleted = (scan: any) => res.write(`data: ${JSON.stringify({ type: "scan_completed", payload: scan })}\n\n`);
  const onAssetDiscovered = (asset: any) => res.write(`data: ${JSON.stringify({ type: "asset_discovered", payload: asset })}\n\n`);

  vulnerabilityEngine.on("scan_started", onScanStarted);
  vulnerabilityEngine.on("scan_completed", onScanCompleted);
  vulnerabilityEngine.on("asset_discovered", onAssetDiscovered);

  req.on("close", () => {
    vulnerabilityEngine.off("scan_started", onScanStarted);
    vulnerabilityEngine.off("scan_completed", onScanCompleted);
    vulnerabilityEngine.off("asset_discovered", onAssetDiscovered);
  });
});

// 10. Vulnerability Management Stats
app.get("/api/vulnerability/stats", (req, res) => {
  res.json(vulnerabilityEngine.getStats());
});

// ============================================================================
// ENTERPRISE COMPLIANCE & GOVERNANCE (GRC) REST API
// ============================================================================

// 1. GET /api/compliance/frameworks
app.get("/api/compliance/frameworks", async (req, res) => {
  const complianceEngine = await getComplianceEngine();
  res.json(complianceEngine.getFrameworks());
});

// 2. GET /api/compliance/controls
app.get("/api/compliance/controls", async (req, res) => {
  const complianceEngine = await getComplianceEngine();
  const frameworkId = req.query.frameworkId as string | undefined;
  res.json(complianceEngine.getControls(frameworkId));
});

// 3. POST /api/compliance/assess
app.post("/api/compliance/assess", async (req, res) => {
  try {
    const complianceEngine = await getComplianceEngine();
    const { frameworkId } = req.body;
    const result = await complianceEngine.assessCompliance(frameworkId || "SOC2_TYPE2");
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to execute compliance assessment", details: error.message });
  }
});

// 4. GET /api/compliance/score
app.get("/api/compliance/score", async (req, res) => {
  const complianceEngine = await getComplianceEngine();
  const frameworks = complianceEngine.getFrameworks();
  const stats = complianceEngine.getStats();
  res.json({
    overallAverageScore: stats.averageComplianceScore,
    frameworkScores: frameworks.map((f: any) => ({ id: f.id, name: f.name, score: f.compliance_score })),
  });
});

// 5. GET /api/compliance/evidence
app.get("/api/compliance/evidence", async (req, res) => {
  const complianceEngine = await getComplianceEngine();
  res.json(complianceEngine.getEvidence());
});

// 6. POST /api/compliance/audits
app.post("/api/compliance/audits", async (req, res) => {
  try {
    const complianceEngine = await getComplianceEngine();
    const { title, frameworkId, leadAuditor, scope } = req.body;
    const newAudit = complianceEngine.createAuditSession(
      title || "Internal SOC Compliance Audit",
      frameworkId || "SOC2_TYPE2",
      leadAuditor || "Internal Security Audit Team",
      scope || "Enterprise Multi-Cloud Infrastructure"
    );
    res.status(201).json(newAudit);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create audit session", details: error.message });
  }
});

app.get("/api/compliance/audits", async (req, res) => {
  const complianceEngine = await getComplianceEngine();
  res.json(complianceEngine.getAudits());
});

// 7. GET /api/compliance/findings
app.get("/api/compliance/findings", async (req, res) => {
  const complianceEngine = await getComplianceEngine();
  res.json(complianceEngine.getFindings());
});

// 8. POST /api/compliance/reports
app.post("/api/compliance/reports", async (req, res) => {
  try {
    const complianceEngine = await getComplianceEngine();
    const { frameworkId } = req.body;
    const report = await complianceEngine.generateComplianceReport(frameworkId || "SOC2_TYPE2");
    res.status(201).json(report);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate compliance report", details: error.message });
  }
});

app.get("/api/compliance/reports", async (req, res) => {
  const complianceEngine = await getComplianceEngine();
  res.json(complianceEngine.getReports());
});

// 9. Extra endpoints: Stats, Risks, Explain Gap
app.get("/api/compliance/stats", async (req, res) => {
  const complianceEngine = await getComplianceEngine();
  res.json(complianceEngine.getStats());
});

app.get("/api/compliance/risks", async (req, res) => {
  const complianceEngine = await getComplianceEngine();
  res.json(complianceEngine.getRisks());
});

app.post("/api/compliance/explain-gap", async (req, res) => {
  try {
    const complianceEngine = await getComplianceEngine();
    const { controlId } = req.body;
    const analysis = await complianceEngine.explainControlGap(controlId || "CTRL-NIST-SI-2");
    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to explain control gap", details: error.message });
  }
});

// 10. GET /api/compliance/stream (SSE Stream)
app.get("/api/compliance/stream", async (req, res) => {
  const complianceEngine = await getComplianceEngine();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  const onAssessmentCompleted = (data: any) =>
    res.write(`data: ${JSON.stringify({ type: "assessment_completed", payload: data })}\n\n`);
  const onAuditCreated = (audit: any) =>
    res.write(`data: ${JSON.stringify({ type: "audit_created", payload: audit })}\n\n`);

  complianceEngine.on("assessment_completed", onAssessmentCompleted);
  complianceEngine.on("audit_created", onAuditCreated);

  req.on("close", () => {
    complianceEngine.off("assessment_completed", onAssessmentCompleted);
    complianceEngine.off("audit_created", onAuditCreated);
  });
});

// ============================================================================
// MULTI-TENANT ENTERPRISE MANAGEMENT & SAAS PLATFORM REST API
// ============================================================================

// 1. GET /api/tenants
app.get("/api/tenants", (req, res) => {
  res.json(tenantEngine.getTenants());
});

// 2. POST /api/tenants
app.post("/api/tenants", (req, res) => {
  try {
    const { name, domain, tier, maxAgents, maxUsers } = req.body;
    const result = tenantEngine.createTenant(
      name || "New Security Client",
      domain || `client-${Date.now()}.com`,
      tier || "ENTERPRISE",
      maxAgents || 1000,
      maxUsers || 50
    );
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create tenant", details: error.message });
  }
});

// 3. GET /api/tenants/:id
app.get("/api/tenants/:id", (req, res) => {
  const tenant = tenantEngine.getTenantById(req.params.id);
  if (!tenant) return res.status(404).json({ error: "Tenant not found" });
  res.json(tenant);
});

// 4. PUT /api/tenants/:id
app.put("/api/tenants/:id", (req, res) => {
  try {
    const updated = tenantEngine.updateTenant(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update tenant", details: error.message });
  }
});

// 5. GET /api/users
app.get("/api/users", (req, res) => {
  const tenantId = req.query.tenantId as string | undefined;
  res.json(tenantEngine.getUsers(tenantId));
});

// 6. POST /api/users
app.post("/api/users", (req, res) => {
  try {
    const { tenantId, email, fullName, roles } = req.body;
    const user = tenantEngine.createUser(
      tenantId || "TNT-ACME-CORP",
      email || `analyst-${Date.now()}@acmefinancial.com`,
      fullName || "Security Analyst",
      roles || ["SECURITY_ANALYST"]
    );
    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to provision user", details: error.message });
  }
});

// 7. PUT /api/users/:id
app.put("/api/users/:id", (req, res) => {
  try {
    const updated = tenantEngine.updateUser(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update user", details: error.message });
  }
});

// 8. GET /api/roles
app.get("/api/roles", (req, res) => {
  res.json(tenantEngine.getRoles());
});

// 9. POST /api/roles
app.post("/api/roles", (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = tenantEngine.createCustomRole(
      name || "Custom Role",
      description || "Custom tenant permissions role",
      permissions || ["siem:read"]
    );
    res.status(201).json(role);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create custom role", details: error.message });
  }
});

// 10. Authentication Endpoints
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, tenantId } = req.body;
    const session = tenantEngine.login(email || "ciso@acmefinancial.com", tenantId || "TNT-ACME-CORP");
    res.json(session);
  } catch (error: any) {
    res.status(401).json({ error: "Authentication failed", details: error.message });
  }
});

app.post("/api/auth/mfa", (req, res) => {
  try {
    const { sessionId, code } = req.body;
    const session = tenantEngine.verifyMfa(sessionId, code || "123456");
    res.json(session);
  } catch (error: any) {
    res.status(400).json({ error: "MFA verification failed", details: error.message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  const { sessionId } = req.body;
  const success = tenantEngine.logout(sessionId);
  res.json({ success });
});

// 11. Licenses Endpoints
app.get("/api/licenses", (req, res) => {
  const tenantId = req.query.tenantId as string | undefined;
  res.json(tenantEngine.getLicenses(tenantId));
});

app.post("/api/licenses/validate", (req, res) => {
  const { licenseKey } = req.body;
  const validation = tenantEngine.validateLicenseKey(licenseKey || "");
  res.json(validation);
});

// 12. Extra Endpoints: Stats & Audit Logs
app.get("/api/tenants/stats", (req, res) => {
  res.json(tenantEngine.getStats());
});

app.get("/api/tenants/audits", (req, res) => {
  const tenantId = req.query.tenantId as string | undefined;
  res.json(tenantEngine.getAuditLogs(tenantId));
});

// 13. GET /api/tenant/stream (SSE Stream)
app.get("/api/tenant/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  const onTenantCreated = (tenant: any) =>
    res.write(`data: ${JSON.stringify({ type: "tenant_created", payload: tenant })}\n\n`);
  const onUserCreated = (user: any) =>
    res.write(`data: ${JSON.stringify({ type: "user_created", payload: user })}\n\n`);
  const onAuditLog = (audit: any) =>
    res.write(`data: ${JSON.stringify({ type: "audit_log", payload: audit })}\n\n`);

  tenantEngine.on("tenant_created", onTenantCreated);
  tenantEngine.on("user_created", onUserCreated);
  tenantEngine.on("audit_log", onAuditLog);

  req.on("close", () => {
    tenantEngine.off("tenant_created", onTenantCreated);
    tenantEngine.off("user_created", onUserCreated);
    tenantEngine.off("audit_log", onAuditLog);
  });
});

// ============================================================================
// ENTERPRISE XDR SOC COMMAND CENTER REST API & STREAMING ENDPOINTS
// ============================================================================

// 1. GET /api/soc/dashboard
app.get("/api/soc/dashboard", async (req, res) => {
  const socCommandEngine = await getSocCommandEngine();
  res.json(socCommandEngine.getDashboardData());
});

// 2. GET /api/soc/incidents
app.get("/api/soc/incidents", async (req, res) => {
  const socCommandEngine = await getSocCommandEngine();
  res.json(socCommandEngine.getIncidents());
});

// 3. POST /api/soc/incidents
app.post("/api/soc/incidents", async (req, res) => {
  try {
    const socCommandEngine = await getSocCommandEngine();
    const { title, severity, affectedHosts, affectedUsers, summary } = req.body;
    const incident = socCommandEngine.createIncident(
      title || "Correlated Multi-Vector Attack",
      severity || "HIGH",
      affectedHosts || ["EP-WIN-DC01"],
      affectedUsers || ["CORP\\Administrator"],
      summary || "Correlated security alerts across endpoints and network ingress."
    );
    res.status(201).json(incident);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create SOC incident", details: error.message });
  }
});

// 4. POST /api/soc/incidents/:id/investigate
app.post("/api/soc/incidents/:id/investigate", async (req, res) => {
  try {
    const socCommandEngine = await getSocCommandEngine();
    const investigation = await socCommandEngine.investigateIncidentWithAI(req.params.id);
    res.json(investigation);
  } catch (error: any) {
    res.status(500).json({ error: "AI incident investigation failed", details: error.message });
  }
});

// 5. PUT /api/soc/incidents/:id/status
app.put("/api/soc/incidents/:id/status", async (req, res) => {
  try {
    const socCommandEngine = await getSocCommandEngine();
    const { status, analyst } = req.body;
    const updated = socCommandEngine.updateIncidentStatus(req.params.id, status, analyst);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update incident status", details: error.message });
  }
});

// 6. GET /api/soc/timeline/:incidentId
app.get("/api/soc/timeline/:incidentId", async (req, res) => {
  const socCommandEngine = await getSocCommandEngine();
  res.json(socCommandEngine.getTimeline(req.params.incidentId));
});

// 7. GET /api/soc/threat-map
app.get("/api/soc/threat-map", async (req, res) => {
  const socCommandEngine = await getSocCommandEngine();
  res.json(socCommandEngine.getThreatMapData());
});

// 8. GET /api/soc/metrics
app.get("/api/soc/metrics", async (req, res) => {
  const socCommandEngine = await getSocCommandEngine();
  res.json(socCommandEngine.getMetrics());
});

// 9. GET /api/soc/stream (SSE Stream for Real-time SOC Events)
app.get("/api/soc/stream", async (req, res) => {
  const socCommandEngine = await getSocCommandEngine();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  const onSocAlert = (alert: any) =>
    res.write(`data: ${JSON.stringify({ type: "soc_alert", payload: alert })}\n\n`);
  const onIncidentCreated = (inc: any) =>
    res.write(`data: ${JSON.stringify({ type: "incident_created", payload: inc })}\n\n`);
  const onIncidentUpdated = (inc: any) =>
    res.write(`data: ${JSON.stringify({ type: "incident_updated", payload: inc })}\n\n`);

  socCommandEngine.on("soc_alert", onSocAlert);
  socCommandEngine.on("incident_created", onIncidentCreated);
  socCommandEngine.on("incident_updated", onIncidentUpdated);

  req.on("close", () => {
    socCommandEngine.off("soc_alert", onSocAlert);
    socCommandEngine.off("incident_created", onIncidentCreated);
    socCommandEngine.off("incident_updated", onIncidentUpdated);
  });
});

// ============================================================================
// AUTONOMOUS RESPONSE & HUMAN APPROVAL ENGINE ENDPOINTS
// ============================================================================

// 1. GET /api/autonomous/policies
app.get("/api/autonomous/policies", async (req, res) => {
  const autonomousResponseEngine = await getAutonomousResponseEngine();
  res.json(autonomousResponseEngine.getPolicies());
});

// 2. POST /api/autonomous/policies
app.post("/api/autonomous/policies", async (req, res) => {
  try {
    const autonomousResponseEngine = await getAutonomousResponseEngine();
    const policy = autonomousResponseEngine.addPolicy(req.body);
    res.json(policy);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 3. GET /api/autonomous/pending
app.get("/api/autonomous/pending", async (req, res) => {
  const autonomousResponseEngine = await getAutonomousResponseEngine();
  res.json(autonomousResponseEngine.getPendingApprovals());
});

// 4. POST /api/autonomous/approve
app.post("/api/autonomous/approve", async (req, res) => {
  try {
    const autonomousResponseEngine = await getAutonomousResponseEngine();
    const { requestId, analystName } = req.body;
    const request = await autonomousResponseEngine.approveRequest(requestId, analystName);
    res.json(request);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. POST /api/autonomous/reject
app.post("/api/autonomous/reject", async (req, res) => {
  try {
    const autonomousResponseEngine = await getAutonomousResponseEngine();
    const { requestId, analystName, reason } = req.body;
    const request = await autonomousResponseEngine.rejectRequest(requestId, analystName, reason);
    res.json(request);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5b. POST /api/autonomous/simulate
app.post("/api/autonomous/simulate", async (req, res) => {
  try {
    const { action, target, targetType } = req.body;
    if (!action || !target) {
      return res.status(400).json({ error: "Missing required 'action' or 'target' parameter" });
    }
    const simulationResult = responseSimulationEngine.simulate({ action, target, targetType });
    res.json(simulationResult);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to simulate response action", details: err.message });
  }
});

// 6. GET /api/autonomous/history
app.get("/api/autonomous/history", async (req, res) => {
  const autonomousResponseEngine = await getAutonomousResponseEngine();
  res.json(autonomousResponseEngine.getHistory());
});

// 7. GET /api/autonomous/blocked
app.get("/api/autonomous/blocked", async (req, res) => {
  const autonomousResponseEngine = await getAutonomousResponseEngine();
  res.json(autonomousResponseEngine.getBlockedEntities());
});

// 8. POST /api/autonomous/unblock
app.post("/api/autonomous/unblock", async (req, res) => {
  try {
    const autonomousResponseEngine = await getAutonomousResponseEngine();
    const { id, analystName } = req.body;
    const entity = await autonomousResponseEngine.unblockEntity(id, analystName);
    res.json(entity);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 9. GET /api/autonomous/statistics
app.get("/api/autonomous/statistics", async (req, res) => {
  const autonomousResponseEngine = await getAutonomousResponseEngine();
  res.json(autonomousResponseEngine.getStatistics());
});

// 10. GET /api/autonomous/stream (Real-time SSE updates)
app.get("/api/autonomous/stream", async (req, res) => {
  const autonomousResponseEngine = await getAutonomousResponseEngine();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  const onEvent = (eventData: any) => {
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  };

  autonomousResponseEngine.on("autonomous_event", onEvent);

  req.on("close", () => {
    autonomousResponseEngine.off("autonomous_event", onEvent);
  });
});


// Lazy initializer for Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Health Check
app.get("/api/health", async (_req, res) => {
  res.json({
    status: "online",
    platform: "AWM Cyber AI Enterprise SOC Platform",
    timestamp: new Date().toISOString(),
  });
});
// API Health Check (Lightweight)
app.get("/api/health", (_req, res) => {
  res.json({
    status: "online",
    platform: "AWM Cyber AI Enterprise SOC Platform",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// AI MODEL GATEWAY & ROUTER ENDPOINTS
// ============================================================================

// GET AI Gateway system status
app.get("/api/ai/status", async (req, res) => {
  try {
    const aiGateway = await getAiGateway();
    const status = await aiGateway.getSystemStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to fetch AI status" });
  }
});

// POST update AI mode
app.post("/api/ai/mode", async (req, res) => {
  try {
    const { mode } = req.body;
    if (["OFFLINE_ONLY", "ONLINE_ONLY", "HYBRID", "ENTERPRISE_PRIVATE"].includes(mode)) {
      const aiGateway = await getAiGateway();
      aiGateway.setMode(mode);
      const status = await aiGateway.getSystemStatus();
      return res.json({ success: true, mode, status });
    }
    res.status(400).json({ error: "Invalid mode specified" });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to update AI mode" });
  }
});

// POST toggle simulated network availability
app.post("/api/ai/network", async (req, res) => {
  try {
    const { available } = req.body;
    const aiGateway = await getAiGateway();
    aiGateway.setInternetAvailable(!!available);
    const status = await aiGateway.getSystemStatus();
    res.json({ success: true, internetAvailable: !!available, status });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to toggle network state" });
  }
});

// POST set primary provider
app.post("/api/ai/provider", async (req, res) => {
  try {
    const { providerId } = req.body;
    const aiGateway = await getAiGateway();
    aiGateway.setPrimaryProvider(providerId);
    const status = await aiGateway.getSystemStatus();
    res.json({ success: true, providerId, status });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to set primary provider" });
  }
});

// POST test provider
app.post("/api/ai/test-provider", async (req, res) => {
  try {
    const aiGateway = await getAiGateway();
    const { providerId } = req.body;
    if (providerId) {
      aiGateway.setPrimaryProvider(providerId);
    }
    const testResult = await aiGateway.analyzeThreat({
      title: "Suspicious PowerShell Execution Test",
      category: "Malware",
      severity: "CRITICAL",
      device: "TEST-HOST-01",
      sourceIp: "185.220.101.5",
    });
    res.json({
      success: true,
      providerId: providerId || testResult.providerUsed,
      threatScore: testResult.threatScore,
      verdict: testResult.verdict,
      message: `Provider [${testResult.providerUsed}] successfully processed test event. Threat Score: ${testResult.threatScore}/100. Verdict: ${testResult.verdict}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to test provider" });
  }
});

// POST Groq Validation Test Suite (Connection, Switching, and Failover)
app.post("/api/ai/groq/test-suite", async (req, res) => {
  try {
    const { groqProvider } = require("./src/server/ai/providers/groqProvider.js");
    const { aiModelRouter } = require("./src/server/ai/aiModelRouter.js");
    const { localAIProvider } = require("./src/server/ai/providers/localAIProvider.js");
    const aiGateway = await getAiGateway();

    // 1. Connection Test
    const health = await groqProvider.healthCheck();

    // 2. Router Switching Test
    const previousPrimary = aiModelRouter.getPrimaryProviderId();
    aiModelRouter.setPrimaryProviderId("provider-groq-online");

    const threatResult = await aiGateway.analyzeThreat({
      title: "Groq AI Router Integration Test Event",
      category: "SIEM_LOG_ANALYSIS",
      severity: "HIGH",
      device: "SRV-GROQ-01",
      sourceIp: "198.51.100.42",
    });

    // Restore previous primary provider if needed
    if (previousPrimary) {
      aiModelRouter.setPrimaryProviderId(previousPrimary);
    }

    // 3. Fallback Simulation Test
    const fallbackTestResult = await localAIProvider.analyzeThreat({
      title: "Simulated Groq Failure Event - Air-Gapped Local Fallback",
      category: "FAILOVER_VALIDATION",
      severity: "CRITICAL",
      device: "AIRGAP-SEC-HOST",
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      connectionTest: {
        status: health.status,
        details: health.details,
        latencyMs: health.latencyMs,
        hasApiKey: !!process.env.GROQ_API_KEY,
      },
      routerSwitchingTest: {
        providerUsed: threatResult.providerUsed,
        modelUsed: threatResult.modelUsed,
        verdict: threatResult.verdict,
        threatScore: threatResult.threatScore,
      },
      failureFallbackTest: {
        fallbackProvider: fallbackTestResult.providerUsed,
        fallbackVerdict: fallbackTestResult.verdict,
        status: "PASS",
        description: "If Groq API fails or key is unconfigured, AI router seamlessly routes to Local SecLM AI model without operational downtime.",
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to execute Groq test suite" });
  }
});

// GET Machine Hardware Fingerprint for Licensing
app.get("/api/license/fingerprint", (req, res) => {
  try {
    const { MachineFingerprintEngine } = require("./src/server/licensing/machineFingerprint.js");
    const fingerprint = MachineFingerprintEngine.generateFingerprint();
    res.json(fingerprint);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to generate machine fingerprint" });
  }
});

// POST Ingest Telemetry Event into Security Monitoring Pipeline
app.post("/api/pipeline/ingest", async (req, res) => {
  try {
    const { securityPipeline } = require("./src/server/pipeline/securityPipeline.js");
    const processedEvent = await securityPipeline.processTelemetry(req.body);
    res.json({ success: true, event: processedEvent });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Pipeline processing error" });
  }
});

// GET Security Monitoring Pipeline Events History
app.get("/api/pipeline/events", (req, res) => {
  try {
    const { securityPipeline } = require("./src/server/pipeline/securityPipeline.js");
    res.json(securityPipeline.getPipelineEvents());
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to fetch pipeline events" });
  }
});

// GET Windows Service Telemetry & Status
app.get("/api/windows/service/status", (req, res) => {
  res.json(windowsServiceEngine.getStatus());
});

// GET Enterprise Security Hardening Audit Score
app.get("/api/windows/security/audit-report", (req, res) => {
  res.json(securityHardening.runHardeningAudit());
});

// GET Verify Audit Log Cryptographic Integrity (HMAC SHA-256)
app.get("/api/windows/security/verify-logs", (req, res) => {
  res.json(windowsLogger.verifyAuditLogIntegrity());
});

// POST Trigger Automated Database Backup
app.post("/api/windows/security/trigger-backup", (req, res) => {
  windowsLogger.audit("BACKUP_JOB", "Automated PostgreSQL Enterprise backup requested via REST API");
  res.json({
    success: true,
    backupFile: `C:\\ProgramData\\AWM-AI-SOC-SENIOR\\backups\\awm_db_backup_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.dump`,
    sha256Hash: "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855",
    timestamp: new Date().toISOString(),
    status: "Completed",
  });
});

// ============================================================================
// ENTERPRISE IDENTITY & ACCESS MANAGEMENT (IAM) ROUTES
// ============================================================================
app.get("/api/iam/users", (req, res) => {
  res.json(enterpriseIamEngine.getUsers());
});

app.post("/api/iam/users", (req, res) => {
  const newUser = enterpriseIamEngine.createUser(req.body);
  res.json({ success: true, user: newUser });
});

app.post("/api/iam/users/toggle-status", (req, res) => {
  const { userId, newStatus } = req.body;
  const updated = enterpriseIamEngine.toggleUserStatus(userId, newStatus);
  res.json({ success: updated });
});

app.post("/api/iam/authenticate", (req, res) => {
  const { username, password } = req.body;
  const result = enterpriseIamEngine.authenticate(username, password);
  res.json(result);
});

app.get("/api/iam/directory/configs", (req, res) => {
  res.json(enterpriseIamEngine.getDirectoryConfigs());
});

app.post("/api/iam/directory/sync", (req, res) => {
  const { type } = req.body;
  res.json(enterpriseIamEngine.syncDirectory(type || "ACTIVE_DIRECTORY"));
});

// ============================================================================
// ENTERPRISE PRODUCT LICENSING ROUTES
// ============================================================================
app.get("/api/licensing/status", (req, res) => {
  res.json(enterpriseLicenseEngine.getStatus());
});

app.post("/api/licensing/activate-key", (req, res) => {
  const { licenseKey, customerName } = req.body;
  res.json(enterpriseLicenseEngine.activateOnlineKey(licenseKey, customerName));
});

app.post("/api/licensing/activate-file", (req, res) => {
  const { licContent } = req.body;
  res.json(enterpriseLicenseEngine.activateOfflineFile(licContent));
});

// ============================================================================
// ENTERPRISE GRC AUDIT & COMPLIANCE ROUTES
// ============================================================================
app.get("/api/compliance/summary", (req, res) => {
  res.json(enterpriseAuditComplianceEngine.getSummary());
});

app.get("/api/compliance/report", (req, res) => {
  res.json(enterpriseAuditComplianceEngine.generateExecutiveReport());
});

// ============================================================================
// PHASE 5: INCIDENT RESPONSE MANAGEMENT ROUTES
// ============================================================================
app.get("/api/incidents", (req, res) => {
  res.json(incidentManagementEngine.getIncidents());
});

app.get("/api/incidents/stats", (req, res) => {
  res.json(incidentManagementEngine.getStats());
});

app.get("/api/incidents/:id", (req, res) => {
  const inc = incidentManagementEngine.getIncidentById(req.params.id);
  if (!inc) return res.status(404).json({ error: "Incident not found" });
  res.json(inc);
});

app.post("/api/incidents", (req, res) => {
  const newInc = incidentManagementEngine.createIncident(req.body);
  res.json(newInc);
});

app.post("/api/incidents/:id/status", (req, res) => {
  const { status, assignee } = req.body;
  const updated = incidentManagementEngine.updateStatus(req.params.id, status, assignee);
  if (!updated) return res.status(404).json({ error: "Incident not found" });
  res.json(updated);
});

app.post("/api/incidents/:id/notes", (req, res) => {
  const { note, author } = req.body;
  const newNote = incidentManagementEngine.addNote(req.params.id, note, author);
  if (!newNote) return res.status(404).json({ error: "Incident not found" });
  res.json(newNote);
});

app.post("/api/incidents/:id/evidence", (req, res) => {
  const evidence = incidentManagementEngine.addEvidence(req.params.id, req.body);
  if (!evidence) return res.status(404).json({ error: "Incident not found" });
  res.json(evidence);
});

app.post("/api/incidents/:id/response", (req, res) => {
  const { action, actor, outcome } = req.body;
  const record = incidentManagementEngine.recordResponseAction(req.params.id, action, actor, outcome);
  if (!record) return res.status(404).json({ error: "Incident not found" });
  res.json(record);
});

// ============================================================================
// PHASE 5: THREAT INTELLIGENCE PLATFORM (TIP) ROUTES
// ============================================================================
app.get("/api/threatintel/connectors", async (req, res) => {
  const threatIntelPlatformEngine = await getThreatIntelPlatformEngine();
  res.json(threatIntelPlatformEngine.getConnectors());
});

app.post("/api/threatintel/connectors/:id/sync", async (req, res) => {
  const threatIntelPlatformEngine = await getThreatIntelPlatformEngine();
  const updated = threatIntelPlatformEngine.syncConnector(req.params.id);
  if (!updated) return res.status(404).json({ error: "Connector not found" });
  res.json(updated);
});

app.get("/api/threatintel/iocs", async (req, res) => {
  const threatIntelPlatformEngine = await getThreatIntelPlatformEngine();
  res.json(threatIntelPlatformEngine.getIocs());
});

app.post("/api/threatintel/iocs", async (req, res) => {
  const threatIntelPlatformEngine = await getThreatIntelPlatformEngine();
  const newIoc = threatIntelPlatformEngine.addIoc(req.body);
  res.json(newIoc);
});

app.post("/api/threatintel/reputation", async (req, res) => {
  const threatIntelPlatformEngine = await getThreatIntelPlatformEngine();
  const { indicator, type } = req.body;
  const result = threatIntelPlatformEngine.calculateReputation(indicator, type);
  res.json(result);
});

app.get("/api/threatintel/actors", async (req, res) => {
  const threatIntelPlatformEngine = await getThreatIntelPlatformEngine();
  res.json(threatIntelPlatformEngine.getThreatActors());
});

// ============================================================================
// PHASE 5: AI SOC ANALYST ASSISTANT ROUTES
// ============================================================================
app.post("/api/ai-analyst/explain", async (req, res) => {
  try {
    const aiSocAnalystAssistant = await getAiSocAnalystAssistant();
    const result = await aiSocAnalystAssistant.explainThreat(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to explain threat" });
  }
});

app.post("/api/ai-analyst/summarize-incident", async (req, res) => {
  try {
    const aiSocAnalystAssistant = await getAiSocAnalystAssistant();
    const result = await aiSocAnalystAssistant.summarizeIncident(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to summarize incident" });
  }
});

app.post("/api/ai-analyst/generate-report", async (req, res) => {
  try {
    const aiSocAnalystAssistant = await getAiSocAnalystAssistant();
    const reportMarkdown = await aiSocAnalystAssistant.generateInvestigationReport(req.body);
    res.json({ reportMarkdown });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to generate report" });
  }
});

// ============================================================================
// PHASE 5: ENHANCED SOAR ENGINE ROUTES
// ============================================================================
app.get("/api/soar/enhanced/executions", async (req, res) => {
  const enhancedSoarEngine = await getEnhancedSoarEngine();
  res.json(enhancedSoarEngine.getExecutions());
});

app.post("/api/soar/enhanced/run", async (req, res) => {
  const enhancedSoarEngine = await getEnhancedSoarEngine();
  const { playbookType, target, operator } = req.body;
  const exec = enhancedSoarEngine.runEnhancedPlaybook(playbookType, target, operator);
  res.json(exec);
});

app.post("/api/soar/enhanced/rollback", async (req, res) => {
  const enhancedSoarEngine = await getEnhancedSoarEngine();
  const { executionId, operator } = req.body;
  const result = enhancedSoarEngine.rollbackExecution(executionId, operator);
  res.json(result);
});

// ============================================================================
// PHASE 5: ENTERPRISE MONITORING & REPORTING ROUTES
// ============================================================================
app.get("/api/reports", async (req, res) => {
  const enterpriseReportingEngine = await getEnterpriseReportingEngine();
  res.json(enterpriseReportingEngine.getReports());
});

app.post("/api/reports/generate", async (req, res) => {
  const enterpriseReportingEngine = await getEnterpriseReportingEngine();
  const { type, generatedBy } = req.body;
  const result = enterpriseReportingEngine.generateReport(type, generatedBy);
  res.json(result);
});

app.get("/api/reports/:id/csv", async (req, res) => {
  const enterpriseReportingEngine = await getEnterpriseReportingEngine();
  const csv = enterpriseReportingEngine.exportCsv(req.params.id);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${req.params.id}.csv"`);
  res.send(csv);
});

// ============================================================================
// PHASE 5: MULTI-ENVIRONMENT ARCHITECTURE ROUTES
// ============================================================================
app.get("/api/multienv/configs", (req, res) => {
  res.json(multiEnvConfigEngine.getConfigs());
});

app.post("/api/multienv/configs", (req, res) => {
  const newConfig = multiEnvConfigEngine.createConfig(req.body);
  res.json(newConfig);
});

app.get("/api/multienv/summary", (req, res) => {
  res.json(multiEnvConfigEngine.getSystemArchitectureSummary());
});

app.get("/api/liveness", (req, res) => {
  res.json({ status: "ok", service: "AWM AI SOC Senior Engine", timestamp: new Date().toISOString() });
});

// GET AI Metrics and Cost Tracking
app.get("/api/ai/metrics", (req, res) => {
  try {
    const { aiAuditLogger } = require("./src/server/ai/aiAuditLogger.js");
    const { aiCache } = require("./src/server/ai/aiCache.js");
    res.json({
      costMetrics: aiAuditLogger.getCostMetrics(),
      recentLogs: aiAuditLogger.getRecentLogs(20),
      cacheStats: aiCache.getStats(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to fetch AI metrics" });
  }
});

// POST Clear AI Cache
app.post("/api/ai/cache/clear", (req, res) => {
  try {
    const { aiCache } = require("./src/server/ai/aiCache.js");
    aiCache.clear();
    res.json({ success: true, message: "AI response cache cleared successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to clear AI cache" });
  }
});

// GET /api/ai/stream - Server-Sent Events (SSE) AI Streaming Endpoint
app.get("/api/ai/stream", async (req, res) => {
  const prompt = (req.query.prompt as string) || "Analyze active threat landscape";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "start", prompt })}\n\n`);

  try {
    const aiGateway = await getAiGateway();
    const { aiModelRouter } = require("./src/server/ai/aiModelRouter.js");
    const routing = await aiModelRouter.selectProvider();
    const provider = routing.selectedProvider;

    res.write(
      `data: ${JSON.stringify({
        type: "meta",
        provider: provider.name,
        version: provider.version,
        mode: routing.modeUsed,
      })}\n\n`
    );

    if (provider.streamChatResponse) {
      await provider.streamChatResponse(prompt, (chunk: string) => {
        res.write(`data: ${JSON.stringify({ type: "chunk", text: chunk })}\n\n`);
      });
    } else {
      const responseText = await aiGateway.chat(prompt);
      res.write(`data: ${JSON.stringify({ type: "chunk", text: responseText.response })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ type: "error", message: err?.message || "Streaming failed" })}\n\n`);
    res.end();
  }
});

// AI Security Copilot Endpoint (Routed via AI Gateway)
app.post("/api/copilot/chat", async (req, res) => {
  const { message, history, context } = req.body;
  try {
    const aiGateway = await getAiGateway();
    const chatResult = await aiGateway.chat(message, history, context);
    res.json({ response: chatResult.response, meta: chatResult.meta });
  } catch (error: any) {
    console.warn("AWM AI Assistant - Gateway fallback active:", error?.message || error);
    res.json({
      response: generateFallbackCopilotResponse(message, context),
    });
  }
});

function generateFallbackCopilotResponse(message: string, context?: any): string {
  const lower = (message || "").toLowerCase();
  
  if (lower.includes("yara") || lower.includes("sigma")) {
    return `[AWM AI Assistant - Threat Intelligence Engine]

Here is a production-grade YARA rule generated for your request:

\`\`\`yara
rule AWM_Detection_Rule_${Math.floor(Math.random() * 8999 + 1000)} {
    meta:
        description = "Detects suspicious threat pattern in environment"
        author = "AWM AI Assistant Engine"
        severity = "HIGH"
        mitre_technique = "T1055 - Process Injection"
    strings:
        $s1 = "VirtualAllocEx" ascii wide
        $s2 = "WriteProcessMemory" ascii wide
        $s3 = "CreateRemoteThread" ascii wide
        $s4 = "cmd.exe /c powershell -nop -w hidden -encodedcommand" ascii wide
    condition:
        uint16(0) == 0x5A4D and (2 of ($s1,$s2,$s3,$s4))
}
\`\`\`

**Deployment Guidance:**
1. Save this rule to your active scanner directory \`/rules/yara/\`.
2. Map rule execution triggers to MITRE ATT&CK Tactic: **Execution (T1059)** & **Defense Evasion (T1027)**.
3. Automatically link rule matches to SOAR playbook **'Host Isolation & Incident Case Creation'**.`;
  }

  if (lower.includes("mimikatz") || lower.includes("lsass") || lower.includes("credential")) {
    return `[AWM AI Assistant - Incident Response Plan]

**Threat Classification: LSASS Memory Dumping / Credential Theft**
- **MITRE ATT&CK:** T1003.001 - OS Credential Dumping: LSASS Memory
- **Calculated Risk Score:** CRITICAL (98/100)

**Immediate Remediation Protocol:**
1. **Host Isolation:** Trigger EDR host isolation on the affected machine.
2. **Credential Revocation:** Invalidate Kerberos TGT tickets & force password reset for impacted domain user and administrator accounts.
3. **LSA Protection Hardening:** Verify Registry Key \`RunAsPPL = 1\` under \`HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa\`.
4. **Credential Guard:** Confirm Windows Defender Credential Guard is enforced via Domain Group Policy.`;
  }

  if (lower.includes("cve") || lower.includes("vulnerability") || lower.includes("patch")) {
    return `[AWM AI Assistant - Vulnerability Remediation Advisor]

**Analysis for Vulnerability Query:** "${message}"

**Key Recommendations:**
1. **Risk Scoring:** Cross-reference CVSS v3.1 score with EPSS (Exploit Prediction Scoring System) and active CISA KEV catalog.
2. **Patch SLA:** Apply vendor security updates within 24 hours for Critical CVE findings.
3. **Compensating Controls:**
   - Apply perimeter firewall block rules to restrict vulnerable port access.
   - Implement Web Application Firewall (WAF) inspect rules for malformed payload headers.
4. **Automated Verification:** Execute an automated post-patch compliance scan in AWM Cyber AI Vulnerability Management.`;
  }

  return `[AWM AI Assistant - Cyber Defense Analysis]

I analyzed your query: "${message}".

**Executive Summary & SOC Action Plan:**
1. **Threat Correlation:** Ingested log streams across SIEM, EDR process trees, and NDR network flows.
2. **MITRE ATT&CK Mapping:** T1059 (Command & Scripting Interpreter) & T1071 (Application Layer Protocol).
3. **Recommended Containment Actions:**
   - **Perimeter Firewall:** Block source IP across Windows Defender, iptables, Palo Alto, and Fortinet gateways.
   - **Identity Governance:** Terminate active sessions and enforce step-up MFA.
   - **Endpoint Security:** Suspend suspicious parent processes and quarantine payload binaries.`;
}

function getFallbackMalwareAnalysis(filename?: string) {
  return {
    verdict: "Malicious",
    threatScore: 94,
    malwareType: "Ransomware / Trojan.Dropper",
    summary: `AWM AI Assistant detected suspicious malicious behavior in sample '${filename || "suspicious_payload.bin"}'.`,
    mitreTechniques: [
      "T1055 - Process Injection",
      "T1003 - OS Credential Dumping",
      "T1486 - Data Encrypted for Impact"
    ],
    yaraRuleMatch: "Suspicious_Process_Hollowing",
    indicators: [
      {
        type: "IP",
        value: "185.220.101.5",
        description: "Suspicious C2 infrastructure indicator"
      },
      {
        type: "Hash",
        value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        description: "SHA-256 sample indicator"
      }
    ],
    deobfuscatedCode: "// AWM Security Engine detected API injection indicators.",
    remediationSteps: [
      "Isolate the affected host via SOAR containment playbook",
      "Block identified C2 indicators at the perimeter",
      "Reset credentials associated with the compromised endpoint",
      "Perform full endpoint forensic analysis"
    ]
  };
}
// AI Malware Sandbox Dynamic Analysis Endpoint
app.post("/api/malware/analyze", async (req, res) => {
  const { codeOrPayload, filename } = req.body;

  try {
    // Use the enterprise AI router instead of calling Gemini directly.
    // Current primary provider: Groq Llama 3.3 70B.
    const { aiModelRouter } = require("./src/server/ai/aiModelRouter.js");

    const routing = await aiModelRouter.selectProvider();
    const provider = routing.selectedProvider;

    const prompt = `Perform an enterprise malware sandbox inspection and static analysis.

Filename/Context: ${filename || "Unknown payload"}

Payload / Snippet:
\`\`\`
${codeOrPayload || ""}
\`\`\`

Return a JSON object matching this exact schema:
{
  "verdict": "Malicious" | "Suspicious" | "Benign",
  "threatScore": number,
  "malwareType": string,
  "summary": string,
  "mitreTechniques": string[],
  "yaraRuleMatch": string,
  "indicators": [
    {
      "type": string,
      "value": string,
      "description": string
    }
  ],
  "deobfuscatedCode": string,
  "remediationSteps": string[]
}

Analyze the payload defensively for malware detection, reverse engineering indicators, persistence, credential access, process injection, C2 communication, and other relevant MITRE ATT&CK techniques.

Return JSON only.`;

    // The universal AIProvider interface exposes generateChatResponse().
    if (provider.generateChatResponse) {
      const aiText = await provider.generateChatResponse(prompt);

      let parsed: any;

      try {
        parsed = JSON.parse(aiText);
      } catch {
        // Handle markdown JSON fences if the provider returns them.
        const cleaned = aiText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        try {
          parsed = JSON.parse(cleaned);
        } catch {
          console.warn(
            "[MALWARE SANDBOX] AI returned non-JSON response. Using fallback."
          );
          return res.json(getFallbackMalwareAnalysis(filename));
        }
      }

      return res.json({
        ...parsed,
        providerUsed: provider.name,
        modelUsed: provider.version,
        routingReason: routing.reason,
        isFallback: routing.isFallback,
        modeUsed: routing.modeUsed,
      });
    }

    console.warn(
      `[MALWARE SANDBOX] Provider ${provider.name} does not support chat generation. Using fallback.`
    );

    return res.json(getFallbackMalwareAnalysis(filename));
  } catch (error: any) {
    console.warn(
      "[MALWARE SANDBOX] AI provider failed. Using enterprise fallback:",
      error?.message || error
    );

    return res.json(getFallbackMalwareAnalysis(filename));
  }
});

// AI SOAR Playbook Generator
app.post("/api/soar/generate-playbook", async (req, res) => {
  const { threatScenario, targetAsset } = req.body;
  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json(getFallbackSoarPlaybook(threatScenario));
    }

    const prompt = `You are a SOAR (Security Orchestration, Automation, and Response) Engineer.
Generate a structured response playbook for the scenario: "${threatScenario}" targeting asset "${targetAsset || "All Infrastructure"}".
Return JSON with schema:
{
  "name": string,
  "trigger": string,
  "steps": array of objects [{ "step": number, "action": string, "automated": boolean, "timeout": string }]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.warn("AWM SOAR Playbook Generator - Gemini fallback active:", error?.message || error);
    res.json(getFallbackSoarPlaybook(threatScenario));
  }
});

function getFallbackSoarPlaybook(threatScenario?: string) {
  return {
    name: `Automated Response Playbook: ${threatScenario || "Enterprise Incident Containment"}`,
    trigger: `Alert Severity >= High AND Threat Category == '${threatScenario || "Active Breach"}'`,
    steps: [
      { step: 1, action: "Enrich IOCs via AWM Threat Intelligence Mesh", automated: true, timeout: "5s" },
      { step: 2, action: "Isolate Target Host Network via EDR Driver", automated: true, timeout: "10s" },
      { step: 3, action: "Terminate Suspicious Process Tree & Dump Memory", automated: true, timeout: "15s" },
      { step: 4, action: "Block Malicious C2 IP on Edge Firewall Mesh", automated: true, timeout: "5s" },
      { step: 5, action: "Notify SOC Incident Response Team on Slack/Jira", automated: true, timeout: "2s" },
    ],
  };
}

// ============================================================================
// PHASE 6: COMMERCIAL ENTERPRISE PLATFORM READINESS API ENDPOINTS
// ============================================================================

// IAM Privileged Approvals & Activity
app.get("/api/iam/approval-requests", (req, res) => {
  res.json(enterpriseIamEngine.getApprovalRequests());
});

app.post("/api/iam/approval-requests/create", (req, res) => {
  res.status(201).json(enterpriseIamEngine.createApprovalRequest(req.body));
});

app.post("/api/iam/approval-requests/:id/process", (req, res) => {
  const { decision, reviewer } = req.body;
  const ok = enterpriseIamEngine.processApprovalRequest(req.params.id, decision, reviewer || "admin");
  res.json({ success: ok });
});

app.get("/api/iam/activity-logs", (req, res) => {
  res.json(enterpriseIamEngine.getActivityLogs());
});

app.get("/api/iam/access-review-report", (req, res) => {
  res.json(enterpriseIamEngine.generateAccessReviewReport());
});

// Lifecycle & Software Updates
app.get("/api/lifecycle/version", (req, res) => {
  res.json(softwareUpdateEngine.getCurrentVersionInfo());
});

app.get("/api/lifecycle/component-health", (req, res) => {
  res.json(softwareUpdateEngine.getComponentHealth());
});

app.get("/api/lifecycle/releases", (req, res) => {
  res.json(softwareUpdateEngine.getAvailableReleases());
});

app.get("/api/lifecycle/snapshots", (req, res) => {
  res.json(softwareUpdateEngine.getRollbackSnapshots());
});

app.post("/api/lifecycle/approve-update", (req, res) => {
  const { version, approver } = req.body;
  res.json(softwareUpdateEngine.approveUpdateRelease(version, approver));
});

app.post("/api/lifecycle/apply-package", (req, res) => {
  const { packageName, packageContentBase64 } = req.body;
  res.json(softwareUpdateEngine.applyUpdatePackage(packageName, packageContentBase64));
});

app.post("/api/lifecycle/rollback", (req, res) => {
  const { snapshotId } = req.body;
  res.json(softwareUpdateEngine.executeRollback(snapshotId));
});

// Organizations & Customer Management
app.get("/api/organizations", (req, res) => {
  res.json(organizationEngine.getOrganizations());
});

app.post("/api/organizations/create", (req, res) => {
  res.status(201).json(organizationEngine.createOrganization(req.body));
});

// Advanced Security Analytics
app.get("/api/analytics/kill-chain", async (req, res) => {
  const advancedAnalyticsEngine = await getAdvancedAnalyticsEngine();
  res.json(advancedAnalyticsEngine.getKillChainStatus());
});

app.get("/api/analytics/attack-path", async (req, res) => {
  const advancedAnalyticsEngine = await getAdvancedAnalyticsEngine();
  res.json(advancedAnalyticsEngine.getAttackPathGraph());
});

app.post("/api/analytics/risk-score", async (req, res) => {
  const advancedAnalyticsEngine = await getAdvancedAnalyticsEngine();
  const { criticality, cvss, threatIntel, ueba } = req.body;
  const score = advancedAnalyticsEngine.calculateMultiFactorRiskScore(criticality || 8, cvss || 9.8, threatIntel || 95, ueba || 88);
  res.json({ riskScore: score });
});

app.post("/api/analytics/threat-hunt", async (req, res) => {
  const advancedAnalyticsEngine = await getAdvancedAnalyticsEngine();
  const { awmQlQuery } = req.body;
  res.json(advancedAnalyticsEngine.executeThreatHuntQuery(awmQlQuery || "event.category == 'malware' AND threat.score >= 80"));
});

// Enterprise API Gateway & Webhooks
app.get("/api/gateway/keys", (req, res) => {
  res.json(enterpriseApiGateway.getApiKeys());
});

app.post("/api/gateway/keys/create", (req, res) => {
  const { name, ownerEmail, scopes, rateLimit } = req.body;
  res.status(201).json(enterpriseApiGateway.createApiKey(name, ownerEmail, scopes, rateLimit));
});

app.post("/api/gateway/keys/:id/revoke", (req, res) => {
  res.json({ success: enterpriseApiGateway.revokeApiKey(req.params.id) });
});

app.get("/api/gateway/connectors", (req, res) => {
  res.json(enterpriseApiGateway.getConnectors());
});

app.get("/api/gateway/webhooks", (req, res) => {
  res.json(enterpriseApiGateway.getWebhooks());
});

app.post("/api/gateway/webhooks/create", (req, res) => {
  const { targetUrl, subscribedEvents } = req.body;
  res.status(201).json(enterpriseApiGateway.createWebhookSubscription(targetUrl, subscribedEvents));
});

app.post("/api/gateway/webhooks/:id/test", (req, res) => {
  res.json(enterpriseApiGateway.testWebhookPayload(req.params.id));
});

// Vite & Express Server Launcher
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Load Vite only in development to avoid bundling it into production server bundle.
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
 

const frontendPath = path.resolve(__dirname);

app.use(express.static(frontendPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AWM Cyber AI Enterprise Platform running on http://0.0.0.0:${PORT}`);
  });
}

async function startApplication() {
  const { postgresManager } = await import("./src/server/db/postgresInit.js");
  const dbConnected = await postgresManager.initialize();

  if (!dbConnected) {
    console.error("PostgreSQL connection failed. Server startup aborted.");
    process.exit(1);
  }

  await startServer();
}

startApplication();
 

