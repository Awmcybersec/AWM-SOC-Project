// AWM Cyber AI Enterprise - AI Audit Trail & Cost Tracking Engine
// Records every AI inference, model routing decision, token consumption, and dollar cost

export interface AIAuditRecord {
  id: string;
  timestamp: string;
  providerId: string;
  providerName: string;
  modelUsed: string;
  operationType: "THREAT_ANALYSIS" | "EXPLANATION" | "RESPONSE" | "LOG_ANALYSIS" | "CHAT" | "STREAM";
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  latencyMs: number;
  status: "SUCCESS" | "DEGRADED" | "FAILOVER" | "ERROR";
  modeUsed: string;
  isCached: boolean;
  errorMessage?: string;
}

export interface AICostMetrics {
  totalCostUSD: number;
  totalTokens: number;
  totalInferences: number;
  costByProvider: Record<string, number>;
  tokensByProvider: Record<string, number>;
  inferencesByProvider: Record<string, number>;
}

export class AIAuditLogger {
  private auditLogs: AIAuditRecord[] = [];
  private maxLogs = 1000;
  private totalCostUSD = 0;
  private totalTokens = 0;
  private costByProvider: Record<string, number> = {};
  private tokensByProvider: Record<string, number> = {};
  private inferencesByProvider: Record<string, number> = {};

  public log(record: Omit<AIAuditRecord, "id" | "timestamp">): AIAuditRecord {
    const fullRecord: AIAuditRecord = {
      ...record,
      id: `AI-LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };

    if (this.auditLogs.length >= this.maxLogs) {
      this.auditLogs.shift();
    }
    this.auditLogs.push(fullRecord);

    // Aggregate metrics
    this.totalCostUSD += fullRecord.estimatedCostUSD;
    this.totalTokens += fullRecord.totalTokens;

    const p = fullRecord.providerId;
    this.costByProvider[p] = (this.costByProvider[p] || 0) + fullRecord.estimatedCostUSD;
    this.tokensByProvider[p] = (this.tokensByProvider[p] || 0) + fullRecord.totalTokens;
    this.inferencesByProvider[p] = (this.inferencesByProvider[p] || 0) + 1;

    return fullRecord;
  }

  public getRecentLogs(limit = 50): AIAuditRecord[] {
    return this.auditLogs.slice(-limit).reverse();
  }

  public getCostMetrics(): AICostMetrics {
    return {
      totalCostUSD: parseFloat(this.totalCostUSD.toFixed(5)),
      totalTokens: this.totalTokens,
      totalInferences: this.auditLogs.length,
      costByProvider: Object.fromEntries(
        Object.entries(this.costByProvider).map(([k, v]) => [k, parseFloat(v.toFixed(5))])
      ),
      tokensByProvider: { ...this.tokensByProvider },
      inferencesByProvider: { ...this.inferencesByProvider },
    };
  }
}

export const aiAuditLogger = new AIAuditLogger();
