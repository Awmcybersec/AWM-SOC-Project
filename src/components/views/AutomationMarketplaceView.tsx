import React, { useState } from "react";
import {
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Download,
  Star,
  Sparkles,
  Zap,
  Tag,
  Search,
  Check,
  RefreshCw,
  Box,
  FileCode,
  Sliders,
} from "lucide-react";

interface MarketplaceItem {
  id: string;
  name: string;
  category: "DETECTION_RULES" | "SOAR_PLAYBOOKS" | "AI_AGENTS" | "CONNECTORS" | "PLUGINS";
  author: string;
  version: string;
  description: string;
  installed: boolean;
  downloads: number;
  rating: number;
  hash: string;
  verified: boolean;
}

export const AutomationMarketplaceView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [items, setItems] = useState<MarketplaceItem[]>([
    {
      id: "MKT-101",
      name: "Ransomware Containment Playbook Pack",
      category: "SOAR_PLAYBOOKS",
      author: "AWM CyberSec Labs",
      version: "v3.2.0",
      description: "Automated host isolation, shadow copy recovery check, and C2 IP blocking playbooks.",
      installed: true,
      downloads: 14200,
      rating: 4.9,
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      verified: true,
    },
    {
      id: "MKT-102",
      name: "Groq Ultra-Fast LPU Cybersec Agent",
      category: "AI_AGENTS",
      author: "Groq AI Engineering",
      version: "v1.4.0",
      description: "Sub-second Llama 3.3 70B inference agent for automated SIEM log triage & incident summaries.",
      installed: true,
      downloads: 9800,
      rating: 5.0,
      hash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
      verified: true,
    },
    {
      id: "MKT-103",
      name: "Sigma Rules Pack for Active Directory",
      category: "DETECTION_RULES",
      author: "SigmaHQ & AWM",
      version: "v2026.8",
      description: "Over 350+ community-verified Sigma rules detecting DCSync, Kerberoasting, and NTDS dumps.",
      installed: false,
      downloads: 28500,
      rating: 4.8,
      hash: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
      verified: true,
    },
    {
      id: "MKT-104",
      name: "Palo Alto Panorama Firewall Connector",
      category: "CONNECTORS",
      author: "Enterprise Integrations",
      version: "v2.1.0",
      description: "Direct REST API connector for real-time dynamic address group IP blocking.",
      installed: false,
      downloads: 8400,
      rating: 4.7,
      hash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
      verified: true,
    },
    {
      id: "MKT-105",
      name: "Dark Web Identity Exposure Monitor",
      category: "PLUGINS",
      author: "Threat Intel Mesh",
      version: "v1.0.4",
      description: "Real-time query plugin cross-checking corporate domain emails against breach databases.",
      installed: true,
      downloads: 11300,
      rating: 4.9,
      hash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
      verified: true,
    },
  ]);

  const handleToggleInstall = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, installed: !item.installed } : item
      )
    );
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-pink-500/20 to-rose-600/20 border border-pink-500/40 rounded-xl text-pink-400">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Cybersecurity Automation Marketplace</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enterprise plugin ecosystem for Sigma/YARA detection rules, SOAR playbooks, AI security agents, and connectors.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search marketplace modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-pink-500/50"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: "ALL", label: "All Items" },
          { key: "SOAR_PLAYBOOKS", label: "SOAR Playbooks" },
          { key: "AI_AGENTS", label: "AI Security Agents" },
          { key: "DETECTION_RULES", label: "Detection Rules" },
          { key: "CONNECTORS", label: "SIEM Connectors" },
          { key: "PLUGINS", label: "Custom Plugins" },
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              selectedCategory === cat.key
                ? "bg-pink-500 text-slate-950 shadow-md font-bold"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Marketplace Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl hover:border-slate-700 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-pink-400 font-bold">{item.id}</span>
                    {item.verified && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 mt-1">{item.name}</h3>
                </div>
                <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-mono rounded">
                  {item.version}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>

              <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1 font-mono text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Author:</span> <span className="text-slate-200">{item.author}</span>
                </div>
                <div className="flex justify-between">
                  <span>Downloads:</span> <span className="text-cyan-400">{item.downloads.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>SHA-256 Hash:</span>{" "}
                  <span className="text-slate-500 truncate max-w-[110px]" title={item.hash}>
                    {item.hash.substring(0, 10)}...
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                <Star className="w-4 h-4 fill-amber-400" /> {item.rating}
              </div>

              <button
                onClick={() => handleToggleInstall(item.id)}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                  item.installed
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40"
                    : "bg-pink-500 hover:bg-pink-400 text-slate-950 shadow-md font-bold"
                }`}
              >
                {item.installed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Installed
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> Install Module
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
