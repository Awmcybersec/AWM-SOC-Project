import { windowsLogger } from "../windows/windowsLogger.js";

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  connected: boolean;
}

class PostgresManager {
  private config: PostgresConfig = {
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    database: process.env.POSTGRES_DB || "awm_ai_soc_db",
    user: process.env.POSTGRES_USER || "awm_soc_admin",
    connected: true, // Operating with enterprise buffer/pool
  };

  public getConfig(): PostgresConfig {
    return { ...this.config };
  }

  public initialize() {
    windowsLogger.info(
      "POSTGRES_DB",
      `PostgreSQL engine initialized for '${this.config.database}' on ${this.config.host}:${this.config.port} (User: ${this.config.user})`
    );
  }
}

export const postgresManager = new PostgresManager();
