// Vitest Unit & Integration Test Suite - AWM AI Gateway & Model Router
import { describe, it, expect, beforeEach } from "vitest";
import { AIModelRouter } from "../server/ai/aiModelRouter.js";
import { AIGateway } from "../server/ai/aiGateway.js";
import { LocalAIProvider } from "../server/ai/providers/localAIProvider.js";
import { GeminiProvider } from "../server/ai/providers/geminiProvider.js";
import { OpenAIProvider } from "../server/ai/providers/openAIProvider.js";
import { CustomAIProvider } from "../server/ai/providers/customAIProvider.js";
import { ModelHealthMonitor } from "../server/ai/modelHealthMonitor.js";

describe("AI Model Gateway & Model Router Test Suite", () => {
  let router: AIModelRouter;
  let gateway: AIGateway;
  let healthMonitor: ModelHealthMonitor;

  beforeEach(() => {
    router = new AIModelRouter();
    gateway = new AIGateway();
    healthMonitor = new ModelHealthMonitor();
    router.setInternetAvailability(true);
    router.setMode("HYBRID");
  });

  it("should initialize with default HYBRID mode and registered providers", () => {
    expect(router.getMode()).toBe("HYBRID");
    const providers = router.getProviders();
    expect(providers.length).toBeGreaterThanOrEqual(4);
    
    const providerIds = providers.map((p) => p.id);
    expect(providerIds).toContain("provider-gemini-online");
    expect(providerIds).toContain("provider-local-offline");
    expect(providerIds).toContain("provider-openai-online");
    expect(providerIds).toContain("provider-custom-enterprise");
  });

  it("should execute Threat Analysis via Local AI Provider in OFFLINE_ONLY mode", async () => {
    router.setMode("OFFLINE_ONLY");
    const decision = await router.selectProvider();

    expect(decision.selectedProvider.isOffline).toBe(true);
    expect(["provider-local-offline", "provider-ollama-local"]).toContain(decision.selectedProvider.id);
    expect(decision.modeUsed).toBe("OFFLINE_ONLY");

    const analysis = await decision.selectedProvider.analyzeThreat({
      title: "Ransomware Execution Attempt",
      category: "Malware",
      severity: "CRITICAL",
      device: "SRV-FINANCE-01",
      sourceIp: "185.220.101.5",
    });

    expect(analysis.threatScore).toBeGreaterThanOrEqual(90);
    expect(analysis.verdict).toBe("MALICIOUS");
    expect(analysis.mitreTechniqueId).toBeDefined();
    expect(analysis.executionMode).toBe("OFFLINE_LOCAL");
  });

  it("should automatically failover to Local AI when internet is disconnected in HYBRID mode", async () => {
    router.setMode("HYBRID");
    router.setInternetAvailability(false); // Simulate severed internet connection

    const decision = await router.selectProvider();

    expect(["provider-local-offline", "provider-ollama-local"]).toContain(decision.selectedProvider.id);
    expect(decision.isFallback).toBe(true);
    expect(decision.reason).toContain("zero-trust failover");
  });

  it("should route to Gemini Online Agent when internet is connected in HYBRID mode", async () => {
    router.setMode("HYBRID");
    router.setInternetAvailability(true);
    router.setPrimaryProviderId("provider-gemini-online");

    const decision = await router.selectProvider();

    expect(decision.selectedProvider.id).toBe("provider-gemini-online");
    expect(decision.isFallback).toBe(false);
  });

  it("should route to Custom Enterprise Private AI model when set to ENTERPRISE_PRIVATE mode", async () => {
    router.setMode("ENTERPRISE_PRIVATE");

    const decision = await router.selectProvider();

    expect(decision.selectedProvider.id).toBe("provider-custom-enterprise");
    expect(decision.modeUsed).toBe("ENTERPRISE_PRIVATE");
    expect(decision.selectedProvider.type).toBe("ENTERPRISE_PRIVATE");
  });

  it("should execute emergency failover in ONLINE_ONLY mode if internet is cut", async () => {
    router.setMode("ONLINE_ONLY");
    router.setInternetAvailability(false);

    const decision = await router.selectProvider();

    expect(["provider-local-offline", "provider-ollama-local"]).toContain(decision.selectedProvider.id);
    expect(decision.isFallback).toBe(true);
    expect(decision.reason).toContain("Internet connectivity down");
  });

  it("should perform comprehensive health monitoring on all providers", async () => {
    const localProvider = new LocalAIProvider();
    const geminiProvider = new GeminiProvider();
    const openAIProvider = new OpenAIProvider();
    const customProvider = new CustomAIProvider();

    const healths = await healthMonitor.checkAll([
      localProvider,
      geminiProvider,
      openAIProvider,
      customProvider,
    ]);

    expect(healths.length).toBe(4);
    
    const localHealth = healths.find((h) => h.providerId === "provider-local-offline");
    expect(localHealth).toBeDefined();
    expect(localHealth?.status).toBe("HEALTHY");
    expect(localHealth?.isOfflineCapable).toBe(true);
  });

  it("should route AI Gateway chat requests and include metadata transparency headers", async () => {
    gateway.setMode("OFFLINE_ONLY");
    const result = await gateway.chat("How do I contain a Mimikatz credential dumping attack?");

    expect(result.response).toContain("AWM");
    expect(result.meta.activeModel).toContain("Local");
    expect(result.meta.mode).toBe("OFFLINE_ONLY");
  });

  it("should verify that Online AI recommendations add Zero-Trust Policy verification notes", async () => {
    gateway.setMode("ONLINE_ONLY");
    gateway.setInternetAvailable(true);

    const rec = await gateway.generateResponse({
      alertId: "ALT-TEST-99",
      title: "Suspicious Privilege Escalation",
      severity: "CRITICAL",
      targetAsset: "DC-PRIMARY-01",
    });

    expect(rec.recommendedAction).toBeDefined();
    expect(rec.blastRadiusAssessment).toContain("verified by AWM Local Zero-Trust Policy Engine");
  });
});
