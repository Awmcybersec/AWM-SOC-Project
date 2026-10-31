import https from "https";

interface WazuhConfig {
  baseUrl: string;
  username: string;
  password: string;
  alertsBridgeUrl?: string;
  alertsBridgeToken?: string;
}

interface WazuhResponse<T = any> {
  data?: T;
  error?: number;
  message?: string;
  detail?: string;
}

export class WazuhClient {
  private readonly config: WazuhConfig;

  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor() {
    const baseUrl = process.env.WAZUH_API_URL;
    const username = process.env.WAZUH_USERNAME;
    const password = process.env.WAZUH_PASSWORD;

    if (!baseUrl || !username || !password) {
      throw new Error(
        "Wazuh configuration missing: WAZUH_API_URL, WAZUH_USERNAME, WAZUH_PASSWORD"
      );
    }

    this.config = {
      baseUrl: baseUrl.replace(/\/+$/, ""),
      username,
      password,

      // Optional alert bridge.
      // Used only because this Wazuh installation does not expose /alerts.
      alertsBridgeUrl: process.env.WAZUH_ALERTS_BRIDGE_URL?.replace(
        /\/+$/,
        ""
      ),

      alertsBridgeToken: process.env.WAZUH_ALERTS_BRIDGE_TOKEN,
    };
  }

  private async rawRequest<T = any>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      headers?: Record<string, string>;
    } = {}
  ): Promise<WazuhResponse<T>> {
    const url = new URL(path, `${this.config.baseUrl}/`);

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers || {}),
    };

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    return new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          method,
          headers,
          rejectUnauthorized: false,
        },
        (res) => {
          let raw = "";

          res.on("data", (chunk) => {
            raw += chunk;
          });

          res.on("end", () => {
            let parsed: WazuhResponse<T>;

            try {
              parsed = raw ? JSON.parse(raw) : {};
            } catch {
              reject(
                new Error(
                  `Invalid Wazuh API response (${res.statusCode}): ${raw}`
                )
              );
              return;
            }

            if (res.statusCode && res.statusCode >= 400) {
              reject(
                new Error(
                  `Wazuh API ${res.statusCode}: ${
                    parsed.detail ||
                    parsed.message ||
                    JSON.stringify(parsed)
                  }`
                )
              );
              return;
            }

            resolve(parsed);
          });
        }
      );

      req.setTimeout(10000, () => {
        req.destroy(new Error("Wazuh API request timeout"));
      });

      req.on("error", reject);

      if (options.body !== undefined) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  public async authenticate(): Promise<string> {
    const now = Date.now();

    if (this.token && now < this.tokenExpiresAt - 30_000) {
      return this.token;
    }

    const basicAuth = Buffer.from(
      `${this.config.username}:${this.config.password}`
    ).toString("base64");

    const result = await this.rawRequest<{ token: string }>(
      "GET",
      "/security/user/authenticate",
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
      }
    );

    if (!result.data?.token) {
      this.clearToken();

      throw new Error(
        "Wazuh authentication failed: no JWT token returned"
      );
    }

    this.token = result.data.token;

    this.tokenExpiresAt = Date.now() + 14 * 60 * 1000;

    return this.token;
  }

  private async request<T = any>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<WazuhResponse<T>> {
    const token = await this.authenticate();

    try {
      return await this.rawRequest<T>(
        method,
        path,
        {
          body,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      if (
        message.includes("401") ||
        message.toLowerCase().includes("unauthorized") ||
        message.toLowerCase().includes("invalid authorization") ||
        message.toLowerCase().includes("token")
      ) {
        this.clearToken();

        const newToken = await this.authenticate();

        return this.rawRequest<T>(
          method,
          path,
          {
            body,
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          }
        );
      }

      throw error;
    }
  }

  public async getManagerInfo() {
    return this.request(
      "GET",
      "/manager/info"
    );
  }

  public async getAgents(limit = 500) {
    return this.request(
      "GET",
      `/agents?limit=${encodeURIComponent(String(limit))}`
    );
  }

  public async getAgent(agentId: string) {
    return this.request(
      "GET",
      `/agents?agents_list=${encodeURIComponent(agentId)}`
    );
  }

  /**
   * Wazuh alerts.
   *
   * Wazuh Manager 4.14.7 in the current deployment does not expose
   * GET /alerts. Alerts must therefore come through the optional
   * AWM Wazuh Alert Bridge.
   */
  public async getAlerts(limit = 100) {
    if (!this.config.alertsBridgeUrl) {
      throw new Error(
        "Wazuh alerts bridge is not configured. " +
        "Set WAZUH_ALERTS_BRIDGE_URL to the AWM Wazuh Alert Bridge."
      );
    }

    const url = new URL(
      `/api/alerts?limit=${encodeURIComponent(String(limit))}`,
      `${this.config.alertsBridgeUrl}/`
    );

    return new Promise<WazuhResponse>(
      (resolve, reject) => {
        const headers: Record<string, string> = {
          Accept: "application/json",
        };

        if (this.config.alertsBridgeToken) {
          headers.Authorization = `Bearer ${this.config.alertsBridgeToken}`;
        }

        const req = https.request(
          url,
          {
            method: "GET",
            headers,
            rejectUnauthorized: false,
          },
          (res) => {
            let raw = "";

            res.on("data", (chunk) => {
              raw += chunk;
            });

            res.on("end", () => {
              let parsed: WazuhResponse;

              try {
                parsed = raw ? JSON.parse(raw) : {};
              } catch {
                reject(
                  new Error(
                    `Invalid Wazuh Alert Bridge response (${res.statusCode}): ${raw}`
                  )
                );
                return;
              }

              if (res.statusCode && res.statusCode >= 400) {
                reject(
                  new Error(
                    `Wazuh Alert Bridge ${res.statusCode}: ${
                      parsed.detail ||
                      parsed.message ||
                      JSON.stringify(parsed)
                    }`
                  )
                );
                return;
              }

              resolve(parsed);
            });
          }
        );

        req.setTimeout(10000, () => {
          req.destroy(
            new Error("Wazuh Alert Bridge request timeout")
          );
        });

        req.on("error", reject);
        req.end();
      }
    );
  }

  public async testConnection() {
    const manager = await this.getManagerInfo();

    return {
      connected: true,
      manager,
    };
  }

  public clearToken() {
    this.token = null;
    this.tokenExpiresAt = 0;
  }
}

export const wazuhClient = new WazuhClient();