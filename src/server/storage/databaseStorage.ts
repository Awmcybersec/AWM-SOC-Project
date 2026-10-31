import { postgresManager } from "../db/postgresInit.js";

export interface SecurityEventInput {
  id: string;
  module: string;
  eventType: string;
  severity: string;
  agentId?: string;
  hostname?: string;
  osType?: string;
  source?: string;
  timestamp?: string;
  payload?: Record<string, any>;
}

export class DatabaseStorage {
  async saveSecurityEvent(event: SecurityEventInput) {
    const pool = postgresManager.getPool();

    await pool.query(
      `
      INSERT INTO security_events
      (
        event_id,
        module,
        event_type,
        severity,
        agent_id,
        hostname,
        os_type,
        source,
        event_time,
        payload,
        created_at
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10::jsonb,
        NOW()
      )
      ON CONFLICT (event_id) DO NOTHING
      `,
      [
        event.id,
        event.module,
        event.eventType,
        event.severity || "INFO",
        event.agentId || null,
        event.hostname || null,
        event.osType || null,
        event.source || "xdr-sensor",
        event.timestamp ? new Date(event.timestamp) : new Date(),
        JSON.stringify(event.payload || {}),
      ]
    );
  }
  async createSiemAlert(alert: {
  ruleId: string;
  title: string;
  severity: string;
  matchedLogCount: number;
  firstSeen: string;
  lastSeen: string;
  host: string;
  sourceIp: string;
  mitreTactic: string;
  mitreTechnique: string;
  status: string;
  triggerContext: Record<string, any>;
}) {
  const pool = postgresManager.getPool();

  const result = await pool.query(
    `
    INSERT INTO siem_alerts
    (
      rule_id,
      title,
      severity,
      matched_log_count,
      first_seen,
      last_seen,
      host_name,
      source_ip,
      mitre_tactic,
      mitre_technique,
      status,
      trigger_context
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11,
      $12::jsonb
    )
    RETURNING *
    `,
    [
      alert.ruleId,
      alert.title,
      alert.severity,
      alert.matchedLogCount,
      new Date(alert.firstSeen),
      new Date(alert.lastSeen),
      alert.host || null,
      alert.sourceIp || null,
      alert.mitreTactic || null,
      alert.mitreTechnique || null,
      alert.status,
      JSON.stringify(alert.triggerContext || {}),
    ]
  );

  return result.rows[0];
}

  async getRecentEvents(limit: number = 100) {
    const pool = postgresManager.getPool();

    const result = await pool.query(
      `
      SELECT
        event_id,
        module,
        event_type,
        severity,
        agent_id,
        hostname,
        os_type,
        source,
        event_time,
        payload,
        created_at
      FROM security_events
      ORDER BY event_time DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows;
  }
// ============================================================
// SIEM LOGS - PostgreSQL
// ============================================================

async saveSiemLog(log: {
  id: string;
  timestamp: string;
  level: string;
  sourceType: string;
  serviceName?: string;
  host: string;
  sourceIp: string;
  destinationIp?: string;
  user?: string;
  category: string;
  eventId?: string | number;
  message: string;
  ecs?: Record<string, any>;
}) {
  const pool = postgresManager.getPool();

  const result = await pool.query(
    `
    INSERT INTO siem_logs
    (
      timestamp,
      log_level,
      source_type,
      service_name,
      host_name,
      source_ip,
      destination_ip,
      user_name,
      event_category,
      event_id,
      message,
      ecs_raw
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11,
      $12::jsonb
    )
    RETURNING *
    `,
    [
      new Date(log.timestamp),
      log.level,
      log.sourceType,
      log.serviceName || null,
      log.host || null,
      log.sourceIp || null,
      log.destinationIp || null,
      log.user || null,
      log.category || null,
      log.eventId || null,
      log.message,
      JSON.stringify(log.ecs || {}),
    ]
  );

  return result.rows[0];
}
  async getRecentSiemLogs(limit = 5000) {
    const pool = postgresManager.getPool();

    const result = await pool.query(
      `
      SELECT
        id,
        timestamp,
        log_level,
        source_type,
        service_name,
        host_name,
        source_ip,
        destination_ip,
        user_name,
        event_category,
        event_id,
        message,
        ecs_raw,
        created_at
      FROM siem_logs
      ORDER BY timestamp DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows;
  }
  // ============================================================
  // SIEM RULES - PostgreSQL
  // ============================================================

  async getSiemRules() {
    const pool = postgresManager.getPool();

    const result = await pool.query(`
      SELECT
        id,
        title,
        description,
        severity,
        log_source,
        condition_kql,
        time_window_seconds,
        threshold_count,
        mitre_tactic,
        mitre_technique,
        enabled,
        created_at,
        updated_at
      FROM siem_rules
      ORDER BY id ASC
    `);

    return result.rows;
  }

  async createSiemRule(rule: any) {
    const pool = postgresManager.getPool();

    const result = await pool.query(
      `
      INSERT INTO siem_rules
      (
        id,
        title,
        description,
        severity,
        log_source,
        condition_kql,
        time_window_seconds,
        threshold_count,
        mitre_tactic,
        mitre_technique,
        enabled
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11
      )
      RETURNING
        id,
        title,
        description,
        severity,
        log_source,
        condition_kql,
        time_window_seconds,
        threshold_count,
        mitre_tactic,
        mitre_technique,
        enabled
      `,
      [
        rule.id,
        rule.title,
        rule.description || "",
        rule.severity || "MEDIUM",
        rule.logSource || rule.log_source || "Unknown",
        rule.conditionKql || rule.condition_kql || "",
        Number(rule.timeWindowSeconds ?? rule.time_window_seconds ?? 300),
        Number(rule.thresholdCount ?? rule.threshold_count ?? 1),
        rule.mitreTactic || rule.mitre_tactic || null,
        rule.mitreTechnique || rule.mitre_technique || null,
        rule.enabled !== false,
      ]
    );

    return result.rows[0];
  }

  async deleteSiemRule(id: string) {
    const pool = postgresManager.getPool();

    const result = await pool.query(
      `
      DELETE FROM siem_rules
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );
return (result.rowCount ?? 0) > 0;
  }
  // ============================================================
  // SIEM ALERT STATUS - PostgreSQL
  // ============================================================

  async updateSiemAlertStatus(
    id: string,
    status: "OPEN" | "INVESTIGATING" | "MITIGATED" | "FALSE_POSITIVE"
  ) {
    const pool = postgresManager.getPool();

    const result = await pool.query(
      `
      UPDATE siem_alerts
      SET status = $1
      WHERE id = $2
      RETURNING
        id,
        rule_id,
        title,
        severity,
        matched_log_count,
        first_seen,
        last_seen,
        host_name,
        source_ip,
        mitre_tactic,
        mitre_technique,
        status,
        trigger_context,
        created_at
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }
  // ============================================================
  // SIEM ALERTS - PostgreSQL
  // ============================================================

  async getSiemAlerts(limit: number = 100) {
    const pool = postgresManager.getPool();

    const result = await pool.query(
      `
      SELECT
        id,
        rule_id,
        title,
        severity,
        matched_log_count,
        first_seen,
        last_seen,
        host_name,
        host_name AS host,
        source_ip,
        mitre_tactic,
        mitre_technique,
        status,
        trigger_context,
        created_at
      FROM siem_alerts
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows;
  }
}

export const databaseStorage = new DatabaseStorage();