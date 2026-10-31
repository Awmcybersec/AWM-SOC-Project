import { Router } from "express";
import { wazuhClient } from "../integrations/wazuhClient.js";

const router = Router();

/**
 * GET /api/wazuh/test
 * Test Wazuh Manager API connectivity.
 */
router.get("/test", async (_req, res) => {
  try {
    const result = await wazuhClient.testConnection();

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    res.status(502).json({
      success: false,
      connected: false,
      error: message,
    });
  }
});

/**
 * GET /api/wazuh/manager
 * Return Wazuh manager information.
 */
router.get("/manager", async (_req, res) => {
  try {
    const result = await wazuhClient.getManagerInfo();

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    res.status(502).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/wazuh/agents
 * Return Wazuh agents.
 */
router.get("/agents", async (req, res) => {
  try {
    const rawLimit = Number(req.query.limit ?? 500);

    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.floor(rawLimit), 1000)
        : 500;

    const result = await wazuhClient.getAgents(limit);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    res.status(502).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/wazuh/agents/:agentId
 * Return one Wazuh agent.
 */
router.get("/agents/:agentId", async (req, res) => {
  try {
    const agentId = req.params.agentId;

    if (!agentId) {
      res.status(400).json({
        success: false,
        error: "agentId is required",
      });
      return;
    }

    const result = await wazuhClient.getAgent(agentId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    res.status(502).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/wazuh/alerts
 *
 * Alerts are obtained through the configured Wazuh Alert Bridge.
 * The Wazuh Manager API itself does not expose GET /alerts
 * in the current deployment.
 */
router.get("/alerts", async (req, res) => {
  try {
    const rawLimit = Number(req.query.limit ?? 100);

    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.floor(rawLimit), 1000)
        : 100;

    const result = await wazuhClient.getAlerts(limit);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    res.status(502).json({
      success: false,
      error: message,
    });
  }
});

export default router;