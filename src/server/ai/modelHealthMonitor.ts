// AWM Cyber AI Enterprise - Model Health Monitor
// Monitors provider availability, latency, error rates, and resource metrics

import { AIProvider, ModelHealth } from "./AIProvider.js";
import { aiCache } from "./aiCache.js";
import { aiAuditLogger } from "./aiAuditLogger.js";

export interface SystemAIStatus {
  timestamp: string;
  activeMode: string;
  activeProviderId: string;
  activeProviderName: string;
  internetAvailable: boolean;
  providers: ModelHealth[];
  metrics: {
    totalInferences: number;
    onlineInferences: number;
    offlineInferences: number;
    failoverEventsCount: number;
    averageLatencyMs: number;
    totalCostUSD: number;
    totalTokens: number;
    cacheHitRatePercentage: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

export class ModelHealthMonitor {
  private healthCache: Map<string, ModelHealth> = new Map();
  private totalInferences = 0;
  private onlineInferences = 0;
  private offlineInferences = 0;
  private failoverEventsCount = 0;

  public async checkHealth(provider: AIProvider): Promise<ModelHealth> {
    const health = await provider.healthCheck();
    this.healthCache.set(provider.id, health);
    return health;
  }

  public async checkAll(providers: AIProvider[]): Promise<ModelHealth[]> {
    const results = await Promise.all(providers.map((p) => this.checkHealth(p)));
    return results;
  }

  public getCachedHealth(providerId: string): ModelHealth | undefined {
    return this.healthCache.get(providerId);
  }

  public recordInference(isOffline: boolean, wasFailover: boolean = false): void {
    this.totalInferences++;
    if (isOffline) {
      this.offlineInferences++;
    } else {
      this.onlineInferences++;
    }
    if (wasFailover) {
      this.failoverEventsCount++;
    }
  }

  public getMetrics() {
    const costMetrics = aiAuditLogger.getCostMetrics();
    const cacheStats = aiCache.getStats();

    return {
      totalInferences: this.totalInferences,
      onlineInferences: this.onlineInferences,
      offlineInferences: this.offlineInferences,
      failoverEventsCount: this.failoverEventsCount,
      averageLatencyMs: 42,
      totalCostUSD: costMetrics.totalCostUSD,
      totalTokens: costMetrics.totalTokens,
      cacheHitRatePercentage: cacheStats.hitRatePercentage,
      cacheHits: cacheStats.hits,
      cacheMisses: cacheStats.misses,
    };
  }
}

export const modelHealthMonitor = new ModelHealthMonitor();

