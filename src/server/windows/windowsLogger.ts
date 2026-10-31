import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "AUDIT" | "DEBUG";
  module: string;
  message: string;
  details?: any;
}

class WindowsLogger {
  private logDir: string;
  private hmacSecret: string;

  constructor() {
    this.logDir = process.env.AWM_LOG_DIR || path.join(process.cwd(), "logs");
    this.hmacSecret = process.env.AWM_AUDIT_HMAC_SECRET || "AWM-ENTERPRISE-AUDIT-KEY-2026-SECURE";
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (err) {
      console.warn("WindowsLogger: Could not create log directory, using stdout fallback.", err);
    }
  }

  public log(level: "INFO" | "WARN" | "ERROR" | "AUDIT" | "DEBUG", module: string, message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      details,
    };

    let formatted = `[${entry.timestamp}] [${entry.level}] [${entry.module}] ${entry.message} ${
      details ? JSON.stringify(details) : ""
    }`;

    // Cryptographic SHA-256 signing for GRC Audit Logs
    if (level === "AUDIT") {
      const hmac = crypto.createHmac("sha256", this.hmacSecret).update(formatted).digest("hex");
      formatted += ` | SHA256:${hmac}`;
    }

    // Write to console
    if (level === "ERROR") {
      console.error(formatted);
    } else if (level === "WARN") {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    // Append to file
    try {
      const fileName = level === "ERROR" ? "awm-error.log" : level === "AUDIT" ? "awm-audit.log" : "awm-service.log";
      const filePath = path.join(this.logDir, fileName);
      fs.appendFileSync(filePath, formatted + "\n");
    } catch (err) {
      // Fallback
    }
  }

  public info(module: string, message: string, details?: any) {
    this.log("INFO", module, message, details);
  }

  public warn(module: string, message: string, details?: any) {
    this.log("WARN", module, message, details);
  }

  public error(module: string, message: string, details?: any) {
    this.log("ERROR", module, message, details);
  }

  public audit(module: string, message: string, details?: any) {
    this.log("AUDIT", module, message, details);
  }

  public getLogDir(): string {
    return this.logDir;
  }

  public verifyAuditLogIntegrity(): { valid: boolean; totalEntries: number; tamperedEntries: number; lastChecked: string } {
    try {
      const filePath = path.join(this.logDir, "awm-audit.log");
      if (!fs.existsSync(filePath)) {
        return { valid: true, totalEntries: 0, tamperedEntries: 0, lastChecked: new Date().toISOString() };
      }

      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n").filter((l) => l.trim().length > 0);
      let tampered = 0;

      for (const line of lines) {
        const parts = line.split(" | SHA256:");
        if (parts.length === 2) {
          const rawMessage = parts[0];
          const expectedHmac = parts[1].trim();
          const computedHmac = crypto.createHmac("sha256", this.hmacSecret).update(rawMessage).digest("hex");
          if (computedHmac !== expectedHmac) {
            tampered++;
          }
        }
      }

      return {
        valid: tampered === 0,
        totalEntries: lines.length,
        tamperedEntries: tampered,
        lastChecked: new Date().toISOString(),
      };
    } catch (err) {
      return { valid: false, totalEntries: 0, tamperedEntries: 1, lastChecked: new Date().toISOString() };
    }
  }
}

export const windowsLogger = new WindowsLogger();
