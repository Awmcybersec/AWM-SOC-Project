// AWM Cyber AI Enterprise - Response Caching Engine
// High-performance TTL-based LRU response cache for AI inferences

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
  providerId: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  entriesCount: number;
  hitRatePercentage: number;
  savedTokensEstimate: number;
  savedCostEstimateUSD: number;
}

export class AICache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxEntries: number;
  private defaultTTLMs: number;
  private hits = 0;
  private misses = 0;
  private savedTokens = 0;
  private savedCostUSD = 0;

  constructor(maxEntries = 500, defaultTTLMinutes = 15) {
    this.maxEntries = maxEntries;
    this.defaultTTLMs = defaultTTLMinutes * 60 * 1000;
  }

  public generateKey(prefix: string, payload: any): string {
    const serialized = typeof payload === "string" ? payload : JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `${prefix}:${Math.abs(hash).toString(16)}`;
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    entry.hits++;
    this.hits++;
    this.savedTokens += 450; // Average saved token estimate
    this.savedCostUSD += 0.0008; // Average saved cost
    return entry.data as T;
  }

  public set<T>(key: string, data: T, providerId: string, ttlMs?: number): void {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const ttl = ttlMs || this.defaultTTLMs;
    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      hits: 0,
      providerId,
    });
  }

  public clear(): void {
    this.cache.clear();
  }

  public getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRatePercentage = total > 0 ? Math.round((this.hits / total) * 100) : 0;
    return {
      hits: this.hits,
      misses: this.misses,
      entriesCount: this.cache.size,
      hitRatePercentage,
      savedTokensEstimate: this.savedTokens,
      savedCostEstimateUSD: parseFloat(this.savedCostUSD.toFixed(4)),
    };
  }
}

export const aiCache = new AICache();
