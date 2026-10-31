import { Pool } from "pg";
import { windowsLogger } from "../windows/windowsLogger.js";
import dotenv from "dotenv";
dotenv.config();

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
    database: process.env.POSTGRES_DB || "awm_ai_soc",
    user: process.env.POSTGRES_USER || "postgres",
    connected: false,
  };

  private pool: Pool;

  constructor() {
    const postgresPassword = process.env.POSTGRES_PASSWORD;

    if (!postgresPassword || typeof postgresPassword !== "string") {
      throw new Error(
        "POSTGRES_PASSWORD environment variable is missing or invalid"
      );
    }

    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: postgresPassword,
      max: 20,
      idleTimeoutMillis: 30000,
    });
  }

  public async initialize(): Promise<boolean> {
    try {
      const client = await this.pool.connect();

      try {
        await client.query("SELECT NOW()");
      } finally {
        client.release();
      }

      this.config.connected = true;

      windowsLogger.info(
        "POSTGRES_DB",
        `PostgreSQL connected: ${this.config.database} on ${this.config.host}:${this.config.port}`
      );

      return true;
    } catch (error: any) {
      this.config.connected = false;

      windowsLogger.error(
        "POSTGRES_DB",
        `PostgreSQL connection failed: ${error?.message || String(error)}`
      );

      return false;
    }
  }

  public getConfig(): PostgresConfig {
    return { ...this.config };
  }

  public getPool(): Pool {
    return this.pool;
  }
}

export const postgresManager = new PostgresManager();