import { Router, Request, Response } from "express";
import {
  telemetryCollectorEngine,
  TelemetryEvent,
  TelemetryEventType,
  TelemetrySeverity,
} from "../agents/telemetryCollectors.js";
import { databaseStorage } from "../storage/databaseStorage.js";
const router = Router();

// ============================================================================
// 1. TELEMETRY INGESTION
// POST /api/telemetry/ingest
// ============================================================================
const handleIngest = (req: Request, res: Response): void => {
  try {
    const { agentId, hostname, osType, eventType, source, payload, severity } = req.body || {};

    const missingFields: string[] = [];
    if (!agentId || typeof agentId !== "string" || !agentId.trim()) missingFields.push("agentId");
    if (!hostname || typeof hostname !== "string" || !hostname.trim()) missingFields.push("hostname");
    if (!osType || typeof osType !== "string" || !osType.trim()) missingFields.push("osType");
    if (!eventType || typeof eventType !== "string" || !eventType.trim()) missingFields.push("eventType");

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: "Validation failed: Missing required telemetry fields",
        missingFields,
      });
      return;
    }

    const typeStr = (eventType as string).trim();
    const cleanPayload = typeof payload === "object" && payload !== null ? payload : {};

    let createdEvent: TelemetryEvent;

    if (typeStr === "WINDOWS_EVENT_LOG" || typeStr === "SYSMON_PROCESS_CREATE" || typeStr === "SYSMON_NETWORK_CONNECTION") {
      createdEvent = telemetryCollectorEngine.normalizeWindowsEvent(
        agentId.trim(),
        hostname.trim(),
        osType.trim(),
        cleanPayload
      );
    } else if (typeStr === "LINUX_AUDIT_EXECVE" || typeStr === "LINUX_SSH_LOGIN") {
      createdEvent = telemetryCollectorEngine.normalizeLinuxEvent(
        agentId.trim(),
        hostname.trim(),
        osType.trim(),
        cleanPayload
      );
    } else if (typeStr === "FIREWALL_EVENT") {
      createdEvent = telemetryCollectorEngine.normalizeNetworkEvent(
        agentId.trim(),
        hostname.trim(),
        osType.trim(),
        cleanPayload
      );
    } else {
      // Direct raw/custom telemetry event collection
      createdEvent = telemetryCollectorEngine.collectEvent({
        agentId: agentId.trim(),
        hostname: hostname.trim(),
        osType: osType.trim(),
        eventType: typeStr as TelemetryEventType,
        severity: (severity as TelemetrySeverity) || "INFO",
        source: source && typeof source === "string" ? source.trim() : "xdr-agent",
        payload: cleanPayload,
      });
    }

    res.status(201).json({
      success: true,
      eventId: createdEvent.id,
      severity: createdEvent.severity,
      eventType: createdEvent.eventType,
      timestamp: createdEvent.timestamp,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Internal server error during telemetry ingestion",
      details: error?.message || String(error),
    });
  }
};

router.post("/ingest", handleIngest);
router.post("/api/telemetry/ingest", handleIngest);

// ============================================================================
// 2. QUERY RECENT TELEMETRY EVENTS
// GET /api/telemetry/recent
// ============================================================================
const handleGetRecent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId, severity, eventType, limit } = req.query;

    const parsedLimit = limit ? parseInt(String(limit), 10) : 100;
    const safeLimit =
      isNaN(parsedLimit) || parsedLimit <= 0 ? 100 : Math.min(parsedLimit, 500);

    let events = await databaseStorage.getRecentEvents(safeLimit);

    if (agentId) {
      events = events.filter(
        (event: any) => event.agent_id === String(agentId)
      );
    }

    if (severity) {
      events = events.filter(
        (event: any) => event.severity === String(severity)
      );
    }

    if (eventType) {
      events = events.filter(
        (event: any) => event.event_type === String(eventType)
      );
    }

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error: any) {
    console.error("[TelemetryRoutes] PostgreSQL query failed:", error);

    res.status(500).json({
      success: false,
      error: "Internal server error querying telemetry events",
      details: error?.message || String(error),
    });
  }
};

router.get("/recent", handleGetRecent);
router.get("/api/telemetry/recent", handleGetRecent);

export default router;
export { router as telemetryRoutes };
