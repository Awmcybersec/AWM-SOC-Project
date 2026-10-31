import React from "react";
import logo from "../assets/logo.jpg";
import {
  ShieldAlert,
  Radio,
  Building2,
  UserCheck,
  Bell,
  Play,
  Pause,
  Cpu,
  RefreshCw,
  Zap,
  Mic,
} from "lucide-react";
import { Tenant, ActiveTab } from "../types";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  tenants: Tenant[];
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  isLiveSimulating: boolean;
  setIsLiveSimulating: (sim: boolean) => void;
  criticalAlertsCount: number;
  triggerManualThreatEvent: () => void;
  onOpenVoiceModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  tenants,
  selectedTenant,
  setSelectedTenant,
  selectedRole,
  setSelectedRole,
  isLiveSimulating,
  setIsLiveSimulating,
  criticalAlertsCount,
  triggerManualThreatEvent,
  onOpenVoiceModal,
}) => {
  return (
    <header className="bg-[#111827] border-b border-[rgba(255,255,255,0.08)] text-slate-100 px-5 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 shadow-xl shadow-black/40">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => setActiveTab("dashboard")}>
        <div className="relative flex items-center justify-center h-10 w-12 shrink-0">
          <img
            src={logo}
            alt="AWM Cybersecurity Official Logo"
            className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-200"
            referrerPolicy="no-referrer"
          />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold tracking-tight text-lg text-white leading-tight">
              AWM AI SOC <span className="text-cyan-400">SENIOR</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-extrabold tracking-widest uppercase bg-cyan-500/15 text-cyan-300 rounded-md border border-cyan-500/30">
              AWM Cyber AI XDR
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
            Enterprise Autonomous Security Operations Center Platform
          </p>
        </div>
      </div>

      {/* Middle Status Bar & Simulation Controls */}
      <div className="flex items-center gap-3 bg-[#0B1220]/90 border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-1.5 text-xs shadow-inner">
        {/* Live Ticker */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLiveSimulating ? "bg-emerald-400 opacity-75" : "bg-amber-400 opacity-50"}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveSimulating ? "bg-emerald-500" : "bg-amber-500"}`}></span>
          </span>
          <span className="font-semibold text-slate-300 tracking-wide">
            {isLiveSimulating ? "LIVE STREAM ACTIVE" : "STREAM PAUSED"}
          </span>
        </div>

        {/* Live Simulation Toggle */}
        <button
          onClick={() => setIsLiveSimulating(!isLiveSimulating)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
            isLiveSimulating
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {isLiveSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isLiveSimulating ? "Pause Ingestion" : "Start Live Stream"}
        </button>

        {/* Trigger Threat Event Simulation */}
        <button
          onClick={triggerManualThreatEvent}
          className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-950/50 transition-all duration-200 active:scale-95"
          title="Simulate incoming zero-day ransomware attack event"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          Simulate Attack
        </button>
      </div>

      {/* Right Tenant, Role, Notifications & AI Copilot Quick Launcher */}
      <div className="flex items-center gap-3">
        {/* Tenant Selector */}
        <div className="flex items-center gap-1.5 bg-[#0B1220]/90 border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-1.5 text-xs">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          <select
  value={selectedTenant?.id || ""}
  onChange={(e) => {
    const t = tenants.find((item) => item.id === e.target.value);
    if (t) setSelectedTenant(t);
  }}
  className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
>
  {tenants.map((tenant) => (
    <option key={tenant.id} value={tenant.id} className="bg-slate-900 text-slate-200">
      {tenant.name}
    </option>
  ))}
</select>
        </div>

        {/* Role Selector */}
        <div className="flex items-center gap-1.5 bg-[#0B1220]/90 border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-1.5 text-xs">
          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="SOC Lead / Principal Analyst" className="bg-slate-900">
              Role: SOC Lead
            </option>
            <option value="Chief Information Security Officer (CISO)" className="bg-slate-900">
              Role: CISO
            </option>
            <option value="Incident Responder (Tier-2)" className="bg-slate-900">
              Role: Incident Responder
            </option>
            <option value="DevSecOps & Compliance Auditor" className="bg-slate-900">
              Role: Auditor
            </option>
          </select>
        </div>

        {/* Voice AI Control Launcher Button */}
        {onOpenVoiceModal && (
          <button
            onClick={onOpenVoiceModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all duration-200 shadow-md"
            title="Open Enterprise Voice AI Assistant"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Voice Control
          </button>
        )}

        {/* AWM AI Assistant Launcher Button */}
        <button
          onClick={() => setActiveTab("copilot")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-md ${
            activeTab === "copilot"
              ? "bg-cyan-400 text-slate-950 ring-2 ring-cyan-300 shadow-cyan-500/30"
              : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 hover:text-white"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          AWM AI Assistant
        </button>

        {/* Notifications Badge */}
        <button
          onClick={() => setActiveTab("dashboard")}
          className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Active Critical Alerts"
        >
          <Bell className="w-4 h-4" />
          {criticalAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-slate-900 animate-pulse">
              {criticalAlertsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
