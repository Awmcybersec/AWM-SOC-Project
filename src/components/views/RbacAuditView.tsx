import React from "react";
import { Lock, Building2, UserCheck, Key, Shield, Hash, CheckCircle2 } from "lucide-react";
import { Tenant, AuditLogEntry } from "../../types";

interface RbacAuditViewProps {
  tenants: Tenant[];
  auditLogs: AuditLogEntry[];
}

export const RbacAuditView: React.FC<RbacAuditViewProps> = ({ tenants, auditLogs }) => {
  return (
    <div className="p-6 space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-100">
              Multi-Tenant RBAC & Cryptographic Audit Trail
            </h2>
            <p className="text-xs text-slate-400">
              Role-Based Access Control, MFA Enforcement & SHA-256 Tamper-Proof Audit Log
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg font-mono flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Cryptographic Ledger Verified
        </span>
      </div>

      {/* Main Grid: Multi-Tenant Organizations + Audit Log Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant Organizations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="font-bold text-sm text-slate-100 pb-3 border-b border-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" /> Managed Enterprise Tenants
          </h3>

          <div className="space-y-3">
            {tenants.map((t) => (
              <div key={t.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-100">{t.name}</span>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px]">{t.tier}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Agents: {t.activeAgents}</span>
                  <span>Log Volume: {t.monthlyLogVolumeGb} GB/mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cryptographic Audit Trail */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="font-bold text-sm text-slate-100 pb-3 border-b border-slate-800 flex items-center gap-2">
            <Hash className="w-4 h-4 text-cyan-400" /> SHA-256 Tamper-Proof Audit Trail
          </h3>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-200">{log.actor} ({log.role})</span>
                  <span className="text-slate-400 text-[10px]">{log.timestamp}</span>
                </div>

                <p className="text-slate-300 font-sans text-xs">{log.action}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Target: {log.target} &bull; IP: {log.ipAddress}</span>
                  <span className="text-cyan-400">Hash: {log.hash}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
