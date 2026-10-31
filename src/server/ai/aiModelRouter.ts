// AWM Cyber AI Enterprise - AI Model Router
// Intelligent decision router for selecting online vs offline AI providers based on network, health & mode

import { AIProvider, AIMode } from "./AIProvider.js";
import { geminiProvider } from "./providers/geminiProvider.js";
import { localAIProvider } from "./providers/localAIProvider.js";
import { openAIProvider } from "./providers/openAIProvider.js";
import { groqProvider } from "./providers/groqProvider.js";
import { deepSeekProvider } from "./providers/deepSeekProvider.js";
import { ollamaProvider } from "./providers/ollamaProvider.js";
import { customAIProvider } from "./providers/customAIProvider.js";
import { modelHealthMonitor } from "./modelHealthMonitor.js";

export interface RoutingDecision {
  selectedProvider: AIProvider;
  reason: string;
  isFallback: boolean;
  modeUsed: AIMode;
}

export class AIModelRouter {
  private mode: AIMode = "HYBRID";
  private primaryProviderId: string = "provider-groq-online";
  private internetAvailable: boolean = true;
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    // Read environment override if available
    if (process.env.AI_MODE) {
      const envMode = process.env.AI_MODE.toUpperCase() as AIMode;
      if (["OFFLINE_ONLY", "ONLINE_ONLY", "HYBRID", "ENTERPRISE_PRIVATE"].includes(envMode)) {
        this.mode = envMode;
      }
    }

    if (process.env.AI_PROVIDER) {
      const p = process.env.AI_PROVIDER.toLowerCase();
      if (p === "local") this.primaryProviderId = "provider-local-offline";
      else if (p === "ollama") this.primaryProviderId = "provider-ollama-local";
      else if (p === "openai") this.primaryProviderId = "provider-openai-online";
      else if (p === "groq") this.primaryProviderId = "provider-groq-online";
      else if (p === "deepseek") this.primaryProviderId = "provider-deepseek-online";
      else if (p === "custom") this.primaryProviderId = "provider-custom-enterprise";
    }

    // Register all enterprise AI providers
    this.registerProvider(geminiProvider);
    this.registerProvider(openAIProvider);
    this.registerProvider(groqProvider);
    this.registerProvider(deepSeekProvider);
    this.registerProvider(ollamaProvider);
    this.registerProvider(localAIProvider);
    this.registerProvider(customAIProvider);
  }

  public registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  public setMode(mode: AIMode): void {
    this.mode = mode;
  }

  public getMode(): AIMode {
    return this.mode;
  }

  public setPrimaryProviderId(providerId: string): void {
    if (this.providers.has(providerId)) {
      this.primaryProviderId = providerId;
    }
  }

  public getPrimaryProviderId(): string {
    return this.primaryProviderId;
  }

  public setInternetAvailability(available: boolean): void {
    this.internetAvailable = available;
  }

  public getInternetAvailability(): boolean {
    return this.internetAvailable;
  }

  public getProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  public getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  public async selectProvider(): Promise<RoutingDecision> {
    // 1. OFFLINE_ONLY Mode -> Ollama or Local SecLM
    if (this.mode === "OFFLINE_ONLY") {
      const offlineCandidate = this.providers.get("provider-ollama-local") || localAIProvider;
      modelHealthMonitor.recordInference(true, false);
      return {
        selectedProvider: offlineCandidate,
        reason: `System configured for Strict Air-Gapped Offline Mode (${this.mode}). Using local model '${offlineCandidate.name}'.`,
        isFallback: false,
        modeUsed: "OFFLINE_ONLY",
      };
    }

    // 2. ENTERPRISE_PRIVATE Mode
    if (this.mode === "ENTERPRISE_PRIVATE") {
      const custom = this.providers.get("provider-custom-enterprise") || customAIProvider;
      modelHealthMonitor.recordInference(custom.isOffline, false);
      return {
        selectedProvider: custom,
        reason: "System configured to route all traffic to Enterprise Private VPC Model.",
        isFallback: false,
        modeUsed: "ENTERPRISE_PRIVATE",
      };
    }

    // 3. ONLINE_ONLY Mode
    if (this.mode === "ONLINE_ONLY") {
      const onlineProvider = this.providers.get(this.primaryProviderId) || groqProvider;
      if (!this.internetAvailable) {
        modelHealthMonitor.recordInference(true, true);
        return {
          selectedProvider: ollamaProvider,
          reason: "Internet connectivity down in ONLINE_ONLY mode. Automatic emergency local air-gapped failover activated.",
          isFallback: true,
          modeUsed: "ONLINE_ONLY",
        };
      }
      modelHealthMonitor.recordInference(false, false);
      return {
        selectedProvider: onlineProvider,
        reason: `Selected Primary Online Agent '${onlineProvider.name}' in ONLINE_ONLY mode.`,
        isFallback: false,
        modeUsed: "ONLINE_ONLY",
      };
    }

    // 4. HYBRID Mode (Default Enterprise Mode)
    if (this.internetAvailable) {
     const primaryCandidate = this.providers.get(this.primaryProviderId) || groqProvider;
      const health = await modelHealthMonitor.checkHealth(primaryCandidate);

      if (health.status === "HEALTHY" || health.status === "DEGRADED") {
        modelHealthMonitor.recordInference(primaryCandidate.isOffline, false);
        return {
          selectedProvider: primaryCandidate,
          reason: `Hybrid Mode: Selected healthy primary online provider '${primaryCandidate.name}'.`,
          isFallback: false,
          modeUsed: "HYBRID",
        };
      }

      // Multi-provider online failover chain: check Groq -> DeepSeek -> Gemini -> OpenAI
      const onlineFallbackChain = ["provider-groq-online", "provider-deepseek-online", "provider-gemini-online", "provider-openai-online"];
      for (const pId of onlineFallbackChain) {
        if (pId !== this.primaryProviderId) {
          const altProvider = this.providers.get(pId);
          if (altProvider) {
            const altHealth = await modelHealthMonitor.checkHealth(altProvider);
            if (altHealth.status === "HEALTHY" || altHealth.status === "DEGRADED") {
              modelHealthMonitor.recordInference(altProvider.isOffline, true);
              return {
                selectedProvider: altProvider,
                reason: `Hybrid Mode: Primary '${primaryCandidate.name}' unavailable. Automatic online failover to '${altProvider.name}'.`,
                isFallback: true,
                modeUsed: "HYBRID",
              };
            }
          }
        }
      }
    }

    // Ultimate Failover to Local Air-Gapped Offline Model
    modelHealthMonitor.recordInference(true, true);
    return {
      selectedProvider: ollamaProvider,
      reason: "Hybrid Mode: Primary online models & internet unreachable. Automatic zero-trust failover to Ollama / Local SecLM Offline Model.",
      isFallback: true,
      modeUsed: "HYBRID",
    };
  }
}

export const aiModelRouter = new AIModelRouter();
