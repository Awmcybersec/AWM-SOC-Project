import { Router, Request, Response } from "express";
import {
  agentManagementEngine,
  RegisterAgentInput,
  HeartbeatPayload,
  AgentStatus,
} from "../agents/agentManagementEngine.js";

const router = Router();

/**
 * Helper to register routes for both root relative path (e.g. /register)
 * and full path (e.g. /api/agent/register) for maximum mounting compatibility.
 */

// ============================================================================
// 1. REGISTER AGENT
// POST /api/agent/register
// ============================================================================
const handleRegister = (req: Request, res: Response): void => {
  try {
    const { hostname, osType, ipAddress, agentVersion, macAddress, tags, metadata } = req.body || {};

    const missingFields: string[] = [];
    if (!hostname || typeof hostname !== "string" || !hostname.trim()) {
      missingFields.push("hostname");
    }
    if (!osType || typeof osType !== "string" || !osType.trim()) {
      missingFields.push("osType");
    }
    if (!ipAddress || typeof ipAddress !== "string" || !ipAddress.trim()) {
      missingFields.push("ipAddress");
    }

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: "Validation failed: Missing or invalid required fields",
        missingFields,
      });
      return;
    }

    const payload: RegisterAgentInput = {
      hostname: hostname.trim(),
      osType: osType.trim(),
      ipAddress: ipAddress.trim(),
      agentVersion: agentVersion && typeof agentVersion === "string" ? agentVersion.trim() : "v6.2-ENT",
      macAddress: macAddress && typeof macAddress === "string" ? macAddress.trim() : undefined,
      tags: Array.isArray(tags) ? tags : undefined,
      metadata: typeof metadata === "object" && metadata !== null ? metadata : undefined,
    };

    const agent = agentManagementEngine.registerAgent(payload);

    res.status(201).json({
      success: true,
      message: "Agent registered successfully",
      agent,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Internal server error during agent registration",
      details: error?.message || String(error),
    });
  }
};

router.post("/register", handleRegister);
router.post("/api/agent/register", handleRegister);

// ============================================================================
// 2. AGENT HEARTBEAT
// POST /api/agent/heartbeat
// ============================================================================
const handleHeartbeat = (req: Request, res: Response): void => {
  try {
    const { agentId, cpuUsagePct, memoryUsageMb, activeProcessesCount, status, metadata } = req.body || {};

    if (!agentId || typeof agentId !== "string" || !agentId.trim()) {
      res.status(400).json({
        success: false,
        error: "Validation failed: 'agentId' is required",
      });
      return;
    }

    const payload: HeartbeatPayload = {
      agentId: agentId.trim(),
      cpuUsagePct: typeof cpuUsagePct === "number" ? cpuUsagePct : undefined,
      memoryUsageMb: typeof memoryUsageMb === "number" ? memoryUsageMb : undefined,
      activeProcessesCount: typeof activeProcessesCount === "number" ? activeProcessesCount : undefined,
      status: status as AgentStatus,
      metadata: typeof metadata === "object" && metadata !== null ? metadata : undefined,
    };

    const updatedAgent = agentManagementEngine.heartbeat(payload);

    if (!updatedAgent) {
      res.status(404).json({
        success: false,
        error: `Agent not found with ID '${agentId}'`,
        suggestion: "Please call POST /api/agent/register first to register this agent.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Heartbeat processed successfully",
      agent: updatedAgent,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Internal server error during agent heartbeat",
      details: error?.message || String(error),
    });
  }
};

router.post("/heartbeat", handleHeartbeat);
router.post("/api/agent/heartbeat", handleHeartbeat);

// ============================================================================
// 3. GET FLEET / ALL AGENTS
// GET /api/agent/fleet
// ============================================================================
const handleGetFleet = (req: Request, res: Response): void => {
  try {
    const { status, osType, search } = req.query;

    const agents = agentManagementEngine.getAgents({
      status: status as AgentStatus | undefined,
      osType: osType as string | undefined,
      search: search as string | undefined,
    });

    res.status(200).json({
      success: true,
      count: agents.length,
      agents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Internal server error retrieving agent fleet",
      details: error?.message || String(error),
    });
  }
};

router.get("/fleet", handleGetFleet);
router.get("/api/agent/fleet", handleGetFleet);

// ============================================================================
// 4. GET SINGLE AGENT BY ID
// GET /api/agent/:id
// ============================================================================
const handleGetAgentById = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: "Agent ID required" });
      return;
    }

    const agent = agentManagementEngine.getAgentById(id);
    if (!agent) {
      res.status(404).json({ success: false, error: `Agent not found: ${id}` });
      return;
    }

    res.status(200).json({
      success: true,
      agent,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Internal server error retrieving agent",
      details: error?.message || String(error),
    });
  }
};

router.get("/:id", handleGetAgentById);
router.get("/api/agent/:id", handleGetAgentById);

// ============================================================================
// 5. UPDATE AGENT STATUS
// PATCH /api/agent/:id/status
// ============================================================================
const handleUpdateStatus = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!id || !status) {
      res.status(400).json({ success: false, error: "Both 'id' and 'status' are required" });
      return;
    }

    const updated = agentManagementEngine.updateAgentStatus(id, status as AgentStatus);
    if (!updated) {
      res.status(404).json({ success: false, error: `Agent not found: ${id}` });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Agent status updated to ${status}`,
      agent: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Internal server error updating agent status",
      details: error?.message || String(error),
    });
  }
};

router.patch("/:id/status", handleUpdateStatus);
router.patch("/api/agent/:id/status", handleUpdateStatus);

// ============================================================================
// 6. REMOVE AGENT
// DELETE /api/agent/:id
// ============================================================================
const handleRemoveAgent = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: "Agent ID required" });
      return;
    }

    const removed = agentManagementEngine.removeAgent(id);
    if (!removed) {
      res.status(404).json({ success: false, error: `Agent not found: ${id}` });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Agent ${id} removed from management registry`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Internal server error removing agent",
      details: error?.message || String(error),
    });
  }
};

router.delete("/:id", handleRemoveAgent);
router.delete("/api/agent/:id", handleRemoveAgent);

export default router;
export { router as agentRoutes };
