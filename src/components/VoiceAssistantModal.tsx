import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Settings,
  Sparkles,
  X,
  Play,
  Square,
  ShieldAlert,
  Sliders,
  Globe,
  Terminal,
} from "lucide-react";
import { ActiveTab } from "../types";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  triggerManualThreatEvent: () => void;
  criticalAlertsCount: number;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  triggerManualThreatEvent,
  criticalAlertsCount,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(
    "AWM Cyber Voice AI active. Say 'Hey AWM' or speak a command like 'Show active threats' or 'Isolate endpoint'."
  );
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Voice Settings State
  const [voiceAnnouncementsEnabled, setVoiceAnnouncementsEnabled] = useState(true);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);

  const recognitionRef = useRef<any>(null);

  // Load available TTS voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Text-to-Speech Helper
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    if (availableVoices.length > 0 && availableVoices[selectedVoiceIndex]) {
      utterance.voice = availableVoices[selectedVoiceIndex];
    }
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = speechVolume;
    utterance.lang = selectedLanguage;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        // Process final commands
        if (event.results[event.results.length - 1].isFinal) {
          processVoiceCommand(currentTranscript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isListening && wakeWordEnabled) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [selectedLanguage, wakeWordEnabled, isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      const fallbackMsg = "Web Speech API is not natively supported in this browser. You can type or trigger voice simulation commands.";
      setAiResponse(fallbackMsg);
      speakText(fallbackMsg);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
        const startMsg = "Voice Assistant listening. State your command.";
        setAiResponse(startMsg);
        speakText(startMsg);
      } catch (err) {
        console.warn("Failed to start speech recognition:", err);
      }
    }
  };

  // Process Recognized Voice Commands
  const processVoiceCommand = (rawCmd: string) => {
    const cmd = rawCmd.toLowerCase().trim();
    setLastCommand(rawCmd);

    let response = "";

    if (cmd.includes("show active threat") || cmd.includes("open threat") || cmd.includes("siem")) {
      setActiveTab("siem");
      response = "Opening Real-time SIEM Threat Log View.";
    } else if (cmd.includes("incident") || cmd.includes("soar") || cmd.includes("playbook")) {
      setActiveTab("soar");
      response = "Navigating to SOAR Automated Playbook Incident Management.";
    } else if (cmd.includes("isolate endpoint") || cmd.includes("isolate host") || cmd.includes("edr")) {
      setActiveTab("edr");
      response = "Opening Endpoint Detection and Response View. Endpoint isolation sequence ready.";
    } else if (cmd.includes("analyze") || cmd.includes("explain") || cmd.includes("copilot")) {
      setActiveTab("copilot");
      response = "Opening AWM AI Security Assistant Copilot view.";
    } else if (cmd.includes("report") || cmd.includes("compliance")) {
      setActiveTab("compliance");
      response = "Navigating to Regulatory Compliance & Audit reporting dashboard.";
    } else if (cmd.includes("system health") || cmd.includes("model")) {
      setActiveTab("ai_models");
      response = "Opening AI Model Router and Enterprise Provider Health dashboard.";
    } else if (cmd.includes("simulate attack") || cmd.includes("simulate threat")) {
      triggerManualThreatEvent();
      response = "Triggering zero-day ransomware attack simulation.";
    } else if (cmd.includes("stop") || cmd.includes("quiet") || cmd.includes("mute")) {
      stopSpeaking();
      response = "Voice audio output muted.";
    } else {
      response = `Command evaluated by AWM AI: '${rawCmd}'. Executing security action.`;
    }

    setAiResponse(response);
    if (voiceAnnouncementsEnabled) {
      speakText(response);
    }
  };

  // Trigger Voice Simulation Sample Commands
  const handleQuickCommand = (cmdText: string) => {
    setTranscript(cmdText);
    processVoiceCommand(cmdText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-cyan-950/50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AWM Enterprise Voice AI Assistant
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30">
                  REAL-TIME STT/TTS
                </span>
              </h2>
              <p className="text-xs text-slate-400">Hands-free voice operational control & SOC alert synthesis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Voice Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel Drawer */}
        {showSettings && (
          <div className="p-5 bg-slate-950 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Voice Announcements
                </label>
                <input
                  type="checkbox"
                  checked={voiceAnnouncementsEnabled}
                  onChange={(e) => setVoiceAnnouncementsEnabled(e.target.checked)}
                  className="accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" /> Wake Word Detection ("Hey AWM")
                </label>
                <input
                  type="checkbox"
                  checked={wakeWordEnabled}
                  onChange={(e) => setWakeWordEnabled(e.target.checked)}
                  className="accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" /> Language Model
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                >
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                  <option value="es-ES">Spanish (Español)</option>
                  <option value="de-DE">German (Deutsch)</option>
                  <option value="fr-FR">French (Français)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Speech Voice Persona</label>
                <select
                  value={selectedVoiceIndex}
                  onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                >
                  {availableVoices.length > 0 ? (
                    availableVoices.map((v, i) => (
                      <option key={i} value={i}>
                        {v.name} ({v.lang})
                      </option>
                    ))
                  ) : (
                    <option value={0}>Standard System Voice</option>
                  )}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1 font-semibold">
                  <span>Speech Rate</span>
                  <span>{speechRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1 font-semibold">
                  <span>Voice Volume</span>
                  <span>{Math.round(speechVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.1"
                  value={speechVolume}
                  onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Mic Display */}
        <div className="p-8 flex flex-col items-center justify-center space-y-6 text-center">
          <div className="relative">
            {/* Visualizer Ping Ring */}
            {isListening && (
              <div className="absolute -inset-4 rounded-full bg-cyan-500/20 animate-ping" />
            )}
            <button
              onClick={toggleListening}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                isListening
                  ? "bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-950 shadow-cyan-500/50 scale-105"
                  : "bg-slate-800 border-2 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-400"
              }`}
            >
              {isListening ? <Mic className="w-10 h-10 animate-bounce" /> : <MicOff className="w-10 h-10" />}
            </button>
          </div>

          <div>
            <p className="text-sm font-bold text-white tracking-wide">
              {isListening ? "LISTENING TO VOICE COMMANDS..." : "VOICE ASSISTANT STANDBY"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isListening
                ? "Speak clearly into your microphone..."
                : "Click microphone icon to activate voice assistant"}
            </p>
          </div>

          {/* Transcript / AI Speech Box */}
          <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Terminal className="w-3.5 h-3.5" /> STT Real-Time Speech Recognition
              </span>
              {isSpeaking && (
                <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                  <Volume2 className="w-3.5 h-3.5" /> TTS Speaking
                </span>
              )}
            </div>

            <div className="min-h-[60px] text-xs space-y-1.5">
              {transcript ? (
                <p className="text-cyan-300 font-mono">
                  <span className="text-slate-500">User Speech:</span> "{transcript}"
                </p>
              ) : (
                <p className="text-slate-600 italic">No audio input detected yet...</p>
              )}

              {aiResponse && (
                <p className="text-emerald-400 font-sans font-medium pt-1 border-t border-slate-900">
                  <span className="text-slate-500 font-mono">AWM Voice AI:</span> {aiResponse}
                </p>
              )}
            </div>
          </div>

          {/* Quick Voice Simulation Trigger Buttons */}
          <div className="w-full space-y-2 text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sample Voice Operational Commands
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Show active threats",
                "Open incident dashboard",
                "Isolate endpoint",
                "Simulate attack",
                "Show system health",
                "Generate compliance report",
              ].map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickCommand(cmd)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-slate-300 text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                  "{cmd}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Critical Active Alerts:{" "}
            <span className="text-amber-400 font-bold font-mono">{criticalAlertsCount}</span>
          </span>
          <span>100% On-Device Web Speech API + AWM Enterprise AI Engine</span>
        </div>
      </div>
    </div>
  );
};
