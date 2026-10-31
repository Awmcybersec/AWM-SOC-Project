import React, { useState } from "react";
import { Grid3X3, ShieldAlert, CheckCircle2, ChevronRight, ExternalLink } from "lucide-react";
import { MitreTechnique } from "../../types";

interface MitreAttackViewProps {
  techniques: MitreTechnique[];
}

export const MitreAttackView: React.FC<MitreAttackViewProps> = ({ techniques }) => {
  const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(
  techniques[0] ?? null
);

  const tactics = [
    "Initial Access",
    "Execution",
    "Persistence",
    "Privilege Escalation",
    "Defense Evasion",
    "Credential Access",
    "Discovery",
    "Lateral Movement",
    "Collection",
    "Command and Control",
    "Exfiltration",
    "Impact",
  ];

  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Grid3X3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-100">
              MITRE ATT&CK Matrix Heatmap v14.1
            </h2>
            <p className="text-xs text-slate-400">
              Real-time Mapping of SIEM, NIDS & HIDS Incident Telemetry across Adversary Tactics
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-lg font-mono">
          Coverage: 88% Enterprise Tactics
        </span>
      </div>

      {/* Tactic Matrix Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <h3 className="font-bold text-sm text-slate-100 pb-2 border-b border-slate-800">
          Enterprise Tactics & Active Detection Heatmap
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {tactics.map((tactic, idx) => {
            const mapped = techniques.filter((t) => t.tactic === tactic);
            const totalHits = mapped.reduce((acc, curr) => acc + curr.detectionCount, 0);

            return (
              <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tactic}</span>
                  {totalHits > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 text-[9px] font-bold rounded">
                      {totalHits} hits
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {mapped.length === 0 ? (
                    <p className="text-[10px] text-slate-600 italic">No active triggers</p>
                  ) : (
                    mapped.map((tech) => (
                      <div
                        key={tech.id}
                        onClick={() => setSelectedTechnique(tech)}
                        className={`p-2 rounded border cursor-pointer transition-all ${
                          selectedTechnique?.id === tech.id
                            ? "bg-indigo-950/80 border-indigo-500 text-indigo-100"
                            : "bg-slate-900 border-slate-800/80 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <p className="font-mono text-[10px] text-cyan-400 font-bold">{tech.id}</p>
                        <p className="text-[11px] font-semibold text-slate-200 line-clamp-1">{tech.name}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
 
      {/* Selected Technique Deep Dive Inspector */}
{selectedTechnique && (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono text-cyan-400 font-bold">{selectedTechnique.id}</span>
            <h3 className="font-bold text-base text-slate-100">{selectedTechnique.name}</h3>
            <p className="text-xs text-slate-400">Tactic: <strong className="text-indigo-300">{selectedTechnique.tactic}</strong></p>
          </div>

          <span className="px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-extrabold rounded-lg border border-rose-500/30">
            Detected Events: {selectedTechnique.detectionCount}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-200 text-xs uppercase">Description & Adversary Behavior</h4>
            <p className="text-slate-300 leading-relaxed">{selectedTechnique.description}</p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <h4 className="font-bold text-emerald-400 text-xs uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Recommended Mitigations & Controls
            </h4>
            <p className="text-slate-300 leading-relaxed">{selectedTechnique.mitigation}</p>
               </div>
    </div>
  </div>
)}
    </div>
  );
};
