import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  Terminal,
  ShieldAlert,
  Code2,
  RefreshCw,
  Copy,
  Check,
  User,
} from "lucide-react";
import { Alert } from "../../types";

interface Message {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
}

interface AiCopilotViewProps {
  selectedAlert?: Alert | null;
}

export const AiCopilotView: React.FC<AiCopilotViewProps> = ({ selectedAlert }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-0",
      sender: "copilot",
      text: `Hello, Senior SOC Analyst. I am **AWM AI Assistant**, your **Senior SOC Cyber Defense Analyst**.

**Core Capabilities:**
- **Threat Investigation**: Root cause triage & deep log analysis.
- **Malware Analysis**: Reverse engineering, payload deobfuscation, & sandbox behavior.
- **Incident Response**: Automated host containment & firewall drop rule execution.
- **Threat Hunting**: Proactive IOC searching & anomaly detection.
- **MITRE ATT&CK Analysis**: Mapping adversary tactics & techniques.
- **SOC Recommendations**: Actionable remediation guidance & zero-trust policy generation.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const processedAlertIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedAlert && selectedAlert.id !== processedAlertIdRef.current) {
      processedAlertIdRef.current = selectedAlert.id;
      const prompt = `Please triage Critical Alert '${selectedAlert.title}' (${selectedAlert.id}) from ${selectedAlert.device}. 
Details: ${selectedAlert.description}. MITRE Technique: ${selectedAlert.mitreTechniqueId} ${selectedAlert.mitreTechnique}.
Provide root cause analysis, threat classification, and immediate containment steps.`;
      handleSendPrompt(prompt);
    }
  }, [selectedAlert]);

  const handleSendPrompt = async (promptToSend?: string) => {
    const text = promptToSend || inputText;
    if (!text.trim() || isGenerating) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptToSend) setInputText("");
    setIsGenerating(true);

    try {
      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
          context: {
            alertContext: selectedAlert ? selectedAlert.id : null,
            platformVersion: "AWM Cyber AI SOC v4.2",
          },
        }),
      });

      const data = await res.json();
      const copilotMsg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sender: "copilot",
        text: data.response || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sender: "copilot",
        text: "Error calling AWM AI Assistant engine. Please check system logs or environment setup.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const presetPrompts = [
    { title: "Mimikatz LSASS Analysis", prompt: "Perform deep dive analysis on LSASS Memory Dumping alert (Mimikatz) and provide mitigation steps." },
    { title: "Generate YARA Rule", prompt: "Write a YARA rule to detect Windows executables containing VirtualAllocEx and WriteProcessMemory imports." },
    { title: "Draft SOAR Playbook", prompt: "Create a 5-step automated SOAR response playbook for Ransomware file extension modification." },
    { title: "Explain CVE-2024-3094", prompt: "Explain the XZ Utils backdoor vulnerability (CVE-2024-3094) and give me Linux CLI commands to patch it." },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col space-y-4 text-slate-100">
      {/* Copilot Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base flex items-center gap-2">
              AWM AI Assistant <Sparkles className="w-4 h-4 text-cyan-400 fill-current" />
            </h2>
            <p className="text-xs text-slate-400">
              Senior SOC Cyber Defense Analyst | Autonomous Threat Intelligence & Defense
            </p>
          </div>
        </div>

        {selectedAlert && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-1.5 text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Targeting Context: <strong>{selectedAlert.id}</strong> ({selectedAlert.title})</span>
          </div>
        )}
      </div>

      {/* Quick Preset Prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {presetPrompts.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSendPrompt(preset.prompt)}
            disabled={isGenerating}
            className="p-3 bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-800/80 rounded-xl text-left transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 mb-1">
              <span>{preset.title}</span>
              <Zap className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-1">{preset.prompt}</p>
          </button>
        ))}
      </div>

      {/* Chat Conversation History */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto space-y-4 shadow-inner">
        {messages.map((msg, idx) => (
          <div
            key={`${msg.id}-${idx}`}
            className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              }`}
            >
              {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-3xl rounded-xl p-4 text-xs leading-relaxed shadow-md relative group ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap font-sans"
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-slate-800/60 opacity-80 text-[10px]">
                <span className="font-semibold tracking-wide uppercase">
                  {msg.sender === "user" ? "SOC Analyst" : "AWM AI Assistant"}
                </span>
                <span className="text-slate-400 font-mono">{msg.timestamp}</span>
              </div>

              <div>{msg.text}</div>

              {msg.sender === "copilot" && (
                <button
                  onClick={() => handleCopy(msg.id, msg.text)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-all"
                  title="Copy response"
                >
                  {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-cyan-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              AWM AI Assistant is reasoning and generating response...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="shrink-0 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg flex items-center gap-3">
        <input
          type="text"
          placeholder="Ask AWM AI Assistant (e.g. 'Generate Sigma rule for PowerShell process creation'...)"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendPrompt()}
          disabled={isGenerating}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />

        <button
          onClick={() => handleSendPrompt()}
          disabled={!inputText.trim() || isGenerating}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          Send Prompt
        </button>
      </div>
    </div>
  );
};
