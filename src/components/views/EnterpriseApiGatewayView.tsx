import React, { useState, useEffect } from "react";
import {
  Key,
  Globe,
  Webhook,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Shield,
  Zap,
  Lock,
  Send,
  Layers,
  Activity,
  Server,
  Code,
  Radio,
} from "lucide-react";

export const EnterpriseApiGatewayView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"api_keys" | "connectors" | "webhooks">("api_keys");
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Forms & Modal state
  const [showNewKeyModal, setShowNewKeyModal] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>("");
  const [newKeyOwner, setNewKeyOwner] = useState<string>("");
  const [newKeyRateLimit, setNewKeyRateLimit] = useState<number>(1000);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["siem:read", "alerts:read"]);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const [showWebhookModal, setShowWebhookModal] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["ALERT_CREATED", "INCIDENT_ESCALATED"]);

  const [testResult, setTestResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const availableScopes = [
    { id: "siem:read", label: "Read SIEM Telemetry & Logs" },
    { id: "siem:write", label: "Ingest Logs via REST API" },
    { id: "alerts:read", label: "Read Correlation & Threat Alerts" },
    { id: "incidents:write", label: "Manage Incident Containment" },
    { id: "soar:execute", label: "Execute SOAR Automation Playbooks" },
    { id: "webhooks:trigger", label: "Trigger External Webhook Subscriptions" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resKeys, resConn, resWh] = await Promise.all([
        fetch("/api/gateway/keys"),
        fetch("/api/gateway/connectors"),
        fetch("/api/gateway/webhooks"),
      ]);

      if (resKeys.ok) setApiKeys(await resKeys.json());
      if (resConn.ok) setConnectors(await resConn.json());
      if (resWh.ok) setWebhooks(await resWh.json());
    } catch (err) {
      console.error("Failed to load API Gateway data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/gateway/keys/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName,
          ownerEmail: newKeyOwner,
          scopes: selectedScopes,
          rateLimit: newKeyRateLimit,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedSecret(data.rawSecretKey);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to create API Key:", err);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      const res = await fetch(`/api/gateway/keys/${id}/revoke`, { method: "POST" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Failed to revoke API Key:", err);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/gateway/webhooks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: webhookUrl,
          subscribedEvents: selectedEvents,
        }),
      });
      if (res.ok) {
        setShowWebhookModal(false);
        setWebhookUrl("");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to create Webhook:", err);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      const res = await fetch(`/api/gateway/webhooks/${webhookId}/test`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to test Webhook payload:", err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              COMMERCIAL ENTERPRISE
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              API GATEWAY v2
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Globe className="w-7 h-7 text-cyan-400" />
            Enterprise Security API Gateway & External Integrations
          </h1>
          <p className="text-sm text-slate-400">
            Secure high-throughput API key authentication, token bucket rate limiting, webhooks HMAC validation, and native connectors for SIEM, ITSM, and Cloud Security tools.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Sync Telemetry
        </button>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("api_keys")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "api_keys" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Key className="w-4 h-4" /> API Key Management ({apiKeys.length})
        </button>
        <button
          onClick={() => setActiveTab("connectors")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "connectors" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" /> External Integration Connectors ({connectors.length})
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === "webhooks" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Webhook className="w-4 h-4" /> Webhook Subscriptions ({webhooks.length})
        </button>
      </div>

      {/* API KEYS TAB */}
      {activeTab === "api_keys" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" /> Active Enterprise API Keys
            </h2>
            <button
              onClick={() => {
                setCreatedSecret(null);
                setShowNewKeyModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              <Plus className="w-4 h-4" /> Generate New API Key
            </button>
          </div>

          <div className="grid gap-4">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{key.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${key.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}>
                      {key.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="font-mono bg-slate-950 px-2 py-1 rounded text-cyan-300 border border-slate-800">{key.keyMasked}</span>
                    <span>Owner: <strong className="text-slate-200">{key.ownerEmail}</strong></span>
                    <span>Rate Limit: <strong className="text-cyan-400">{key.rateLimitReqPerMin} req/min</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400">Scopes:</span>
                    {key.scopes.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {key.status === "ACTIVE" && (
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs font-semibold rounded-xl transition"
                    >
                      Revoke Key
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONNECTORS TAB */}
      {activeTab === "connectors" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> SIEM, ITSM & Cloud Security Connectors
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectors.map((c) => (
              <div key={c.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{c.vendor}</span>
                    <h3 className="font-bold text-white text-base">{c.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${c.status === "CONNECTED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                    <CheckCircle2 className="w-3 h-3" /> {c.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="bg-slate-950 p-2 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800/80 truncate">
                    {c.endpointUrl}
                  </div>
                  <div className="flex justify-between">
                    <span>Auth Method: <strong className="text-slate-200">{c.authMethod}</strong></span>
                    <span>24h Ingested: <strong className="text-cyan-400">{c.eventsProcessed24h.toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WEBHOOKS TAB */}
      {activeTab === "webhooks" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Webhook className="w-5 h-5 text-cyan-400" /> HMAC-SHA256 Signed Webhook Endpoints
            </h2>
            <button
              onClick={() => setShowWebhookModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              <Plus className="w-4 h-4" /> Subscribe Webhook Target
            </button>
          </div>

          <div className="grid gap-4">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm bg-slate-950 px-2.5 py-1 rounded border border-slate-800">{wh.targetUrl}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {wh.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Secret HMAC Key: <strong className="font-mono text-cyan-300">{wh.secretKey.slice(0, 10)}...</strong></span>
                      <span>Delivered Events: <strong className="text-emerald-400">{wh.totalDelivered}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTestWebhook(wh.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold rounded-xl transition"
                  >
                    <Send className="w-3.5 h-3.5" /> Dispatch Test Payload
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Subscribed Events:</span>
                  {wh.subscribedEvents.map((ev: string) => (
                    <span key={ev} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Test Payload Output Box */}
          {testResult && (
            <div className="p-5 bg-slate-950 border border-cyan-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Webhook Test Dispatched (HTTP 200 OK)
                </span>
                <span className="font-mono text-xs text-slate-400">Signature: {testResult.signatureHeader.slice(0, 32)}...</span>
              </div>
              <pre className="font-mono text-xs text-emerald-300 bg-slate-900/90 p-4 rounded-xl overflow-x-auto border border-slate-800">
                {JSON.stringify(testResult.payloadSample, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* CREATE API KEY MODAL */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" /> Generate Commercial API Key
              </h3>
              <button onClick={() => setShowNewKeyModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {createdSecret ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-emerald-400">API Key Successfully Generated!</p>
                  <p className="text-slate-300">Copy this raw secret token now. It will never be displayed again.</p>
                  <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-slate-800 font-mono text-cyan-300">
                    <span>{createdSecret}</span>
                    <button onClick={() => handleCopy(createdSecret)} className="text-slate-400 hover:text-white">
                      {copiedKey === createdSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCreatedSecret(null);
                    setShowNewKeyModal(false);
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
                >
                  Close & Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateApiKey} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Key Name / Client System</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QRadar SIEM Ingest Connector"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Owner Email</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@enterprise.internal"
                    value={newKeyOwner}
                    onChange={(e) => setNewKeyOwner(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Token Bucket Rate Limit (req/min)</label>
                  <input
                    type="number"
                    value={newKeyRateLimit}
                    onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">API Scopes</label>
                  <div className="space-y-1.5 pt-1">
                    {availableScopes.map((scope) => (
                      <label key={scope.id} className="flex items-center gap-2 text-slate-300">
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(scope.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedScopes([...selectedScopes, scope.id]);
                            else setSelectedScopes(selectedScopes.filter((s) => s !== scope.id));
                          }}
                          className="rounded border-slate-800 text-cyan-500 focus:ring-0"
                        />
                        <span>{scope.label} <strong className="font-mono text-cyan-400 text-[10px]">({scope.id})</strong></span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowNewKeyModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl">
                    Generate Secret Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CREATE WEBHOOK MODAL */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Webhook className="w-5 h-5 text-cyan-400" /> Subscribe Webhook Endpoint
              </h3>
              <button onClick={() => setShowWebhookModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Endpoint URL (HTTPS)</label>
                <input
                  type="url"
                  required
                  placeholder="https://enterprise.service-now.com/api/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowWebhookModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl">
                  Subscribe Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
