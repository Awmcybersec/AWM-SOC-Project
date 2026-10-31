import { EventEmitter } from "events";

export type AgentOsType =
  | "WINDOWS_10"
  | "WINDOWS_11"
  | "WINDOWS_SERVER"
  | "LINUX_SERVER"
  | "KALI_LINUX"
  | string;

export type AgentStatus = "ONLINE" | "OFFLINE" | "DEGRADED" | "ISOLATED" | "PENDING";

export interface Agent {
  id: string;
  hostname: string;
  osType: AgentOsType;
  ipAddress: string;
  agentVersion: string;
  status: AgentStatus;
  lastHeartbeat: string;
  createdAt: string;
  macAddress?: string;
  cpuUsagePct?: number;
  memoryUsageMb?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface RegisterAgentInput {
  hostname: string;
  osType: AgentOsType;
  ipAddress: string;
  agentVersion: string;
  macAddress?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface HeartbeatPayload {
  agentId: string;
  cpuUsagePct?: number;
  memoryUsageMb?: number;
  activeProcessesCount?: number;
  status?: AgentStatus;
  metadata?: Record<string, any>;
}

export class AgentManagementEngine extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private staleCheckIntervalMs: number = 30000;
  private offlineThresholdMs: number = 60000;
  private timer: NodeJS.Timeout | null = null;

constructor() {
 super();
 this.startHealthMonitor();
}

  /**
   * Registers a new agent endpoint or re-activates an existing host
   */
  public registerAgent(input: RegisterAgentInput): Agent {
    const existing = Array.from(this.agents.values()).find(
      (a) => a.hostname.toLowerCase() === input.hostname.toLowerCase() && a.ipAddress === input.ipAddress
    );

    const now = new Date().toISOString();

    if (existing) {
      existing.agentVersion = input.agentVersion || existing.agentVersion;
      existing.osType = input.osType || existing.osType;
      existing.status = "ONLINE";
      existing.lastHeartbeat = now;
      if (input.macAddress) existing.macAddress = input.macAddress;
      if (input.tags) existing.tags = input.tags;
      if (input.metadata) existing.metadata = { ...existing.metadata, ...input.metadata };

      this.emit("agent:reconnected", existing);
      this.emit("agent:updated", existing);
      return existing;
    }

    const id = `AGT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const agent: Agent = {
      id,
      hostname: input.hostname,
      osType: input.osType,
      ipAddress: input.ipAddress,
      agentVersion: input.agentVersion || "v6.2-ENT",
      status: "ONLINE",
      lastHeartbeat: now,
      createdAt: now,
      macAddress: input.macAddress,
      tags: input.tags || ["enterprise", "xdr-sensor"],
      metadata: input.metadata || {},
    };

    this.agents.set(id, agent);
    this.emit("agent:registered", agent);
    return agent;
  }

  /**
   * Process periodic agent heartbeat ping
   */
  public heartbeat(payload: HeartbeatPayload): Agent | null {
    const agent = this.agents.get(payload.agentId);
    if (!agent) {
      return null;
    }

    const now = new Date().toISOString();
    agent.lastHeartbeat = now;

    if (payload.status) {
      agent.status = payload.status;
    } else if (agent.status === "OFFLINE") {
      agent.status = "ONLINE";
    }

    if (payload.cpuUsagePct !== undefined) agent.cpuUsagePct = payload.cpuUsagePct;
    if (payload.memoryUsageMb !== undefined) agent.memoryUsageMb = payload.memoryUsageMb;

    if (payload.metadata) {
      agent.metadata = { ...agent.metadata, ...payload.metadata };
    }

    this.emit("agent:heartbeat", agent);
    return agent;
  }

  /**
   * Returns list of all agents, optionally filtered by status or OS type
   */
  public getAgents(filter?: { status?: AgentStatus; osType?: string; search?: string }): Agent[] {
    let list = Array.from(this.agents.values());

    if (filter?.status) {
      list = list.filter((a) => a.status === filter.status);
    }

    if (filter?.osType) {
      list = list.filter((a) => a.osType.toUpperCase().includes(filter.osType!.toUpperCase()));
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.hostname.toLowerCase().includes(q) ||
          a.ipAddress.includes(q) ||
          a.id.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.lastHeartbeat).getTime() - new Date(a.lastHeartbeat).getTime());
  }

  /**
   * Fetch specific agent by ID
   */
  public getAgentById(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  /**
   * Explicitly set status (e.g., ISOLATED, DEGRADED, OFFLINE)
   */
  public updateAgentStatus(id: string, status: AgentStatus): Agent | null {
    const agent = this.agents.get(id);
    if (!agent) return null;

    const oldStatus = agent.status;
    agent.status = status;
    this.emit("agent:statusChanged", { agent, oldStatus, newStatus: status });
    return agent;
  }

  /**
   * Removes an agent registration from memory
   */
  public removeAgent(id: string): boolean {
    const agent = this.agents.get(id);
    if (!agent) return false;

    this.agents.delete(id);
    this.emit("agent:removed", agent);
    return true;
  }

  /**
   * Seed enterprise demo endpoints across target OS platforms
   */
  private seedDefaultAgents(): void {
    return;
    const now = new Date().toISOString();
    const defaults: Agent[] = [
      {
        id: "AGT-WIN-001",
        hostname: "WIN-SEC-DC01",
        osType: "WINDOWS_SERVER",
        ipAddress: "192.168.1.10",
        agentVersion: "v6.2-ENT",
        status: "ONLINE",
        lastHeartbeat: now,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        macAddress: "00:15:5D:01:A4:B1",
        cpuUsagePct: 14.2,
        memoryUsageMb: 8192,
        tags: ["Domain Controller", "Windows Server 2022", "High-Value"],
      },
      {
        id: "AGT-WIN-002",
        hostname: "DESKTOP-SOC-ANALYST",
        osType: "WINDOWS_11",
        ipAddress: "192.168.1.105",
        agentVersion: "v6.2-ENT",
        status: "ONLINE",
        lastHeartbeat: now,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        macAddress: "00:15:5D:02:C8:E3",
        cpuUsagePct: 22.8,
        memoryUsageMb: 4096,
        tags: ["Workstation", "Windows 11 Pro"],
      },
      {
        id: "AGT-LNX-001",
        hostname: "LINUX-APP-NODE01",
        osType: "LINUX_SERVER",
        ipAddress: "10.0.4.50",
        agentVersion: "v6.2-ENT",
        status: "ONLINE",
        lastHeartbeat: now,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        macAddress: "52:54:00:12:34:56",
        cpuUsagePct: 8.5,
        memoryUsageMb: 2048,
        tags: ["Production", "Ubuntu 22.04 LTS"],
      },
      {
        id: "AGT-KALI-001",
        hostname: "KALI-REDTEAM-LAB",
        osType: "KALI_LINUX",
        ipAddress: "10.0.99.15",
        agentVersion: "v6.2-ENT",
        status: "ONLINE",
        lastHeartbeat: now,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        macAddress: "00:0C:29:8B:4F:1A",
        cpuUsagePct: 45.1,
        memoryUsageMb: 6144,
        tags: ["Red Team", "Kali Linux 2026.1", "Testing"],
      },
    ];

    for (const ag of defaults) {
      this.agents.set(ag.id, ag);
    }
  }

  /**
   * Monitor agent heartbeats and mark as OFFLINE if missed threshold
   */
  private startHealthMonitor(): void {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      const nowMs = Date.now();
      for (const agent of this.agents.values()) {
        if (agent.status === "ISOLATED") continue;

        const lastHeartbeatMs = new Date(agent.lastHeartbeat).getTime();
        if (nowMs - lastHeartbeatMs > this.offlineThresholdMs && agent.status !== "OFFLINE") {
          agent.status = "OFFLINE";
          this.emit("agent:statusChanged", { agent, oldStatus: "ONLINE", newStatus: "OFFLINE" });
        }
      }
    }, this.staleCheckIntervalMs);
  }
}

export const agentManagementEngine = new AgentManagementEngine();
