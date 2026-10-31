import React from "react";
import logo from "../assets/logo.jpg";
import {
  LayoutDashboard,
  Bot,
  Laptop,
  Binary,
  Database,
  Network,
  Users,
  Workflow,
  Globe2,
  Grid3X3,
  FileCode2,
  ShieldCheck,
  FileText,
  Lock,
  ChevronRight,
  Flame,
  Building2,
  Radio,
  Zap,
  Cpu,
  Server,
  Settings,
  Siren,
  BrainCircuit,
  BarChart3,
  Search,
  ShoppingBag,
  Globe,
} from "lucide-react";
import { ActiveTab } from "../types";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unassignedAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unassignedAlertsCount,
}) => {
  const menuGroups = [
    {
      groupTitle: "SOC Operations",
      items: [
        { id: "soc_command" as ActiveTab, label: "Main SOC Command", icon: Radio, highlight: true },
        { id: "autonomous_soc" as ActiveTab, label: "Autonomous SOC Ops", icon: Bot, highlight: true, badge: "Phase 7" },
        { id: "incident_response" as ActiveTab, label: "Incident Response System", icon: Siren, highlight: true, badge: "Phase 5" },
        { id: "ai_analyst_assistant" as ActiveTab, label: "AI SOC Analyst Assistant", icon: BrainCircuit, highlight: true },
        { id: "dashboard" as ActiveTab, label: "Command Dashboard", icon: LayoutDashboard, badge: unassignedAlertsCount > 0 ? `${unassignedAlertsCount}` : null },
        { id: "copilot" as ActiveTab, label: "AWM AI Assistant", icon: Bot },
        { id: "edr" as ActiveTab, label: "EDR Endpoint Engine", icon: Laptop },
        { id: "siem" as ActiveTab, label: "SIEM Log Intelligence", icon: Database },
        { id: "nids" as ActiveTab, label: "NIDS / HIDS Sensors", icon: Network },
      ],
    },
    {
      groupTitle: "Threat Analytics & Hunting",
      items: [
        { id: "threat_hunting" as ActiveTab, label: "AWM-QL Threat Hunting", icon: Search, highlight: true, badge: "Phase 7" },
        { id: "advanced_analytics" as ActiveTab, label: "Kill Chain & Attack Paths", icon: Flame, highlight: true, badge: "Phase 6" },
        { id: "malware" as ActiveTab, label: "Malware AI Sandbox", icon: Binary },
        { id: "ueba" as ActiveTab, label: "UEBA Anomaly Tracker", icon: Users },
        { id: "threat_intel" as ActiveTab, label: "Threat Intelligence & IOCs", icon: Globe2, highlight: true },
        { id: "mitre" as ActiveTab, label: "MITRE ATT&CK Heatmap", icon: Grid3X3 },
      ],
    },
    {
      groupTitle: "Automation & Ecosystem",
      items: [
        { id: "marketplace" as ActiveTab, label: "Automation Marketplace", icon: ShoppingBag, highlight: true, badge: "Phase 7" },
        { id: "autonomous_response" as ActiveTab, label: "Autonomous Response & Approvals", icon: Zap, highlight: true },
        { id: "ai_models" as ActiveTab, label: "AI Model Gateway & Router", icon: Cpu, highlight: true },
        { id: "soar" as ActiveTab, label: "SOAR Playbooks", icon: Workflow },
        { id: "yara_sigma" as ActiveTab, label: "YARA & Sigma Rules", icon: FileCode2 },
      ],
    },
    {
      groupTitle: "Enterprise Scale & Governance",
      items: [
        { id: "global_scale" as ActiveTab, label: "Global Scale & HA Nodes", icon: Globe, highlight: true, badge: "Phase 7" },
        { id: "api_gateway" as ActiveTab, label: "Enterprise API Gateway", icon: Globe2, highlight: true, badge: "Commercial" },
        { id: "enterprise_reporting" as ActiveTab, label: "Enterprise SOC Reports", icon: BarChart3, highlight: true },
        { id: "vulnerability" as ActiveTab, label: "Vulnerabilities & Assets", icon: ShieldCheck },
        { id: "compliance" as ActiveTab, label: "Compliance & Audit", icon: FileText },
        { id: "rbac_audit" as ActiveTab, label: "RBAC & System Audit", icon: Lock },
        { id: "tenant_management" as ActiveTab, label: "SaaS Multi-Tenant", icon: Building2, highlight: true },
        { id: "windows_deployment" as ActiveTab, label: "Windows Enterprise App", icon: Server, highlight: true },
        { id: "enterprise_admin" as ActiveTab, label: "Enterprise Admin & Licensing", icon: Settings, highlight: true },
      ],
    },
    {
      groupTitle: "Architecture & Specs",
      items: [
        { id: "architecture_docs" as ActiveTab, label: "SRS & Manuals Suite", icon: FileText, badge: "38 Manuals" },
      ],
    },
  ];

  return (
    <aside className="relative w-64 bg-[#0B1220] border-r border-[rgba(255,255,255,0.08)] text-slate-300 flex flex-col justify-between shrink-0 select-none overflow-y-auto overflow-x-hidden">
      {/* Sidebar Full Background Logo Image */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden p-2">
        <img
          src={logo}
          alt=""
          className="w-[92%] max-h-[82%] object-contain select-none opacity-40 filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[#0B1220]/30 pointer-events-none" />
      </div>

      <div className="space-y-5 relative z-10">
        {/* Sidebar Brand Header */}
        <div className="py-4 px-3 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-center bg-[#0B1220]/80 backdrop-blur-sm">
          <div className="w-full h-[130px] flex items-center justify-center overflow-hidden">
            <img
              src={logo}
              alt="AWM Cybersecurity Logo"
              className="max-w-[95%] max-h-[95%] w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {menuGroups.map((group, idx) => (
          <div key={idx} className="px-3">
            <h2 className="px-3 text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2.5 drop-shadow">
              {group.groupTitle}
            </h2>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 backdrop-blur-sm ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500/30 via-blue-600/20 to-slate-900/80 text-white border-l-2 border-cyan-400 shadow-md shadow-cyan-950/50"
                        : item.highlight
                        ? "text-cyan-300 bg-[#0B1220]/75 border border-cyan-800/40 hover:bg-cyan-900/60 hover:text-white hover:translate-x-0.5"
                        : "text-slate-200 bg-[#0B1220]/60 hover:text-white hover:bg-slate-800/80 hover:translate-x-0.5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : item.highlight ? "text-cyan-400" : "text-slate-300"}`} />
                      <span className="drop-shadow-sm">{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                          isActive
                            ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400 opacity-90" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status Widget */}
      <div className="p-3.5 m-3 bg-[#111827] rounded-2xl border border-[rgba(255,255,255,0.08)] text-xs shadow-lg shadow-black/40 relative z-10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> System Threat Score
          </span>
          <span className="text-xs font-extrabold text-rose-400">78 / 100</span>
        </div>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-2">
          <div className="bg-gradient-to-r from-amber-500 to-rose-500 h-full w-[78%]" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>Active Nodes: 1,420</span>
          <span className="text-emerald-400 font-semibold">SOC Defense Active</span>
        </div>
      </div>
    </aside>
  );
};
