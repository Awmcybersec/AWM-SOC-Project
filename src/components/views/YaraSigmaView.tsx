import React, { useState } from "react";
import { FileCode2, Play, CheckCircle2, ShieldAlert, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { DetectionRule } from "../../types";

interface YaraSigmaViewProps {
  rules: DetectionRule[];
  onToggleRule: (id: string) => void;
}

export const YaraSigmaView: React.FC<YaraSigmaViewProps> = ({ rules, onToggleRule }) => {

  console.log("YARA RULES:", rules);

  const [selectedRule, setSelectedRule] = useState<DetectionRule | null>(
    rules?.[0] ?? null
  );

  if (!selectedRule) {
  return (
    <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-slate-300">
      <h2 className="text-lg font-bold text-white">
        YARA & Sigma Rules
      </h2>

      <p className="mt-3 text-sm text-slate-400">
        No detection rules available. Waiting for rule ingestion...
      </p>
    </div>
  );
}

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <FileCode2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-100">
              YARA & Sigma Rule Repository & Execution Sandbox
            </h2>
            <p className="text-xs text-slate-400">
              Pattern Matching Engine for Binary Memory Scanning & Generic SIEM Query Translation
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-lg font-mono">
          Active Engine Rules: {rules.filter((r) => r.enabled).length} Enabled
        </span>
      </div>

      {/* Main Grid: Rules List + Rule Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="font-bold text-sm text-slate-100 pb-3 border-b border-slate-800">
            Custom Detection Rules
          </h3>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                onClick={() => setSelectedRule(rule)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedRule.id === rule.id
                    ? "bg-indigo-950/40 border-indigo-500 text-indigo-100"
                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="text-xs text-slate-100 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 font-mono text-[10px] rounded">
                      {rule.type}
                    </span>
                    {rule.name}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleRule(rule.id);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    {rule.enabled ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2">
                  <span>Target: {rule.target}</span>
                  <span>Matches: {rule.matchCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rule Editor Code Panel */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
  <h3 className="font-bold text-base text-slate-100">
    {selectedRule?.name || "No rule selected"}
  </h3>

  <p className="text-xs text-slate-400">
    Author: {selectedRule?.author || "N/A"} • Target: {selectedRule?.target || "N/A"}
  </p>
</div>

            <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-400 font-bold rounded-lg">
              Matched Telemetry Hits: {selectedRule.matchCount}
            </span>
          </div>

          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
            {selectedRule.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
