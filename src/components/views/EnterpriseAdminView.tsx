import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  Key,
  Award,
  Lock,
  Building2,
  Database,
  RefreshCw,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Copy,
  Check,
  Server,
  HardDrive,
  Download,
  Plus,
  Radio,
  Settings,
  Workflow,
  ShieldAlert,
  Activity,
  Layers,
  Clock,
  RotateCcw,
} from "lucide-react";

export const EnterpriseAdminView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"iam" | "directory" | "licensing" | "lifecycle" | "organizations">("iam");

  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [directoryConfigs, setDirectoryConfigs] = useState<any[]>([]);
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [accessReport, setAccessReport] = useState<any>(null);

  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [componentHealth, setComponentHealth] = useState<any[]>([]);
  const [availableReleases, setAvailableReleases] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form states
  const [activationKey, setActivationKey] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [licenseMsg, setLicenseMsg] = useState<{ success: boolean; text: string } | null>(null);

  const [showAddUser, setShowAddUser] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>("");
  const [newFullName, setNewFullName] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");
  const [newRole, setNewRole] = useState<string>("SENIOR_SECURITY_ANALYST");

  const [offlinePackageName, setOfflinePackageName] = useState<string>("");
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const rolesList = [
    { id: "PLATFORM_OWNER", title: "Platform Owner", desc: "Full administrative control over platform tenant & cryptographic engine." },
    { id: "ENTERPRISE_ADMIN", title: "Enterprise Administrator", desc: "System administration, license updates, and directory sync." },
    { id: "SOC_DIRECTOR", title: "SOC Director", desc: "Global SOC leadership, autonomous approvals, and incident sign-off." },
    { id: "SENIOR_SECURITY_ANALYST", title: "Senior Security Analyst", desc: "L2/L3 threat investigation, rule creation, and containment actions." },
    { id: "INCIDENT_RESPONDER", title: "Incident Responder", desc: "SOC playbook execution, endpoint network isolation, and forensics." },
    { id: "THREAT_INTEL_ANALYST", title: "Threat Intelligence Analyst", desc: "IOC feed ingestion, YARA/Sigma management, and ATT&CK mapping." },
    { id: "COMPLIANCE_AUDITOR", title: "Compliance Auditor", desc: "Read-only access to GRC frameworks, HMAC audit trails, and review logs." },
    { id: "READ_ONLY", title: "Read Only User", desc: "Executive view access to high-level security posture dashboards." },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        resUsers,
        resDir,
        resLic,
        resApr,
        resVer,
        resComp,
        resRel,
        resSnap,
        resOrg,
      ] = await Promise.all([
        fetch("/api/iam/users"),
        fetch("/api/iam/directory/configs"),
        fetch("/api/licensing/status"),
        fetch("/api/iam/approval-requests"),
        fetch("/api/lifecycle/version"),
        fetch("/api/lifecycle/component-health"),
        fetch("/api/lifecycle/releases"),
        fetch("/api/lifecycle/snapshots"),
        fetch("/api/organizations"),
      ]);

      if (resUsers.ok) setUsers(await resUsers.json());
      if (resDir.ok) setDirectoryConfigs(await resDir.json());
      if (resLic.ok) setLicenseStatus(await resLic.json());
      if (resApr.ok) setApprovalRequests(await resApr.json());
      if (resVer.ok) setVersionInfo(await resVer.json());
      if (resComp.ok) setComponentHealth(await resComp.json());
      if (resRel.ok) setAvailableReleases(await resRel.json());
      if (resSnap.ok) setSnapshots(await resSnap.json());
      if (resOrg.ok) setOrganizations(await resOrg.json());
    } catch (err) {
      console.error("Failed to load Enterprise Admin telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await fetch("/api/iam/users/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newStatus }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Error toggling user status:", err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/iam/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          fullName: newFullName,
          email: newEmail,
          role: newRole,
        }),
      });
      if (res.ok) {
        setShowAddUser(false);
        setNewUsername("");
        setNewFullName("");
        setNewEmail("");
        fetchData();
      }
    } catch (err) {
      console.error("Error creating user:", err);
    }
  };

  const handleProcessApproval = async (id: string, decision: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/iam/approval-requests/${id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewer: "soc.director" }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Error processing approval request:", err);
    }
  };

  const handleGenerateAccessReport = async () => {
    try {
      const res = await fetch("/api/iam/access-review-report");
      if (res.ok) {
        setAccessReport(await res.json());
      }
    } catch (err) {
      console.error("Error generating access report:", err);
    }
  };

  const handleSyncDirectory = async (type: string) => {
    try {
      await fetch("/api/iam/directory/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      fetchData();
    } catch (err) {
      console.error("Error syncing directory:", err);
    }
  };

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/licensing/activate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: activationKey, customerName }),
      });
      const data = await res.json();
      setLicenseMsg({ success: data.success, text: data.message });
      if (data.success) {
        setActivationKey("");
        fetchData();
      }
    } catch (err) {
      setLicenseMsg({ success: false, text: "Activation request failed." });
    }
  };

  const handleApplyUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlinePackageName) return;
    try {
      const res = await fetch("/api/lifecycle/apply-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageName: offlinePackageName }),
      });
      const data = await res.json();
      setUpdateMsg(data.message);
      fetchData();
    } catch (err) {
      setUpdateMsg("Update package application failed.");
    }
  };

  const handleRollback = async (snapshotId: string) => {
    try {
      const res = await fetch("/api/lifecycle/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshotId }),
      });
      if (res.ok) {
        const data = await res.json();
        setUpdateMsg(data.message);
        fetchData();
      }
    } catch (err) {
      console.error("Error executing rollback:", err);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/60 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              COMMERCIAL ENTERPRISE PLATFORM
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ACTIVATED RELEASE {versionInfo?.currentVersion || "v6.2.0-ENT"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-cyan-400" />
            Enterprise Admin & Commercial Readiness
          </h1>
          <p className="text-sm text-slate-400">
            Advanced RBAC, Active Directory / Entra ID Synchronization, Offline License Activation, Software Updates, and Organization Asset Inventory.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh State
        </button>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab("iam")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeSubTab === "iam" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" /> Identity & RBAC ({users.length})
        </button>
        <button
          onClick={() => setActiveSubTab("directory")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeSubTab === "directory" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" /> Directory & SSO ({directoryConfigs.length})
        </button>
        <button
          onClick={() => setActiveSubTab("licensing")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeSubTab === "licensing" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Key className="w-4 h-4" /> Licensing & Entitlements
        </button>
        <button
          onClick={() => setActiveSubTab("lifecycle")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeSubTab === "lifecycle" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity className="w-4 h-4" /> Software Updates & Health
        </button>
        <button
          onClick={() => setActiveSubTab("organizations")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeSubTab === "organizations" ? "border-cyan-400 text-cyan-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" /> Customer Organizations ({organizations.length})
        </button>
      </div>

      {/* IAM & RBAC TAB */}
      {activeSubTab === "iam" && (
        <div className="space-y-6">
          {/* Privileged Action Approvals Queue */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" /> Privileged Action Approval Queue
            </h2>

            <div className="grid gap-3">
              {approvalRequests.map((req) => (
                <div key={req.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{req.actionTitle}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-slate-300">Target: <strong className="text-cyan-300">{req.targetResource}</strong> | Justification: {req.justification}</p>
                    <span className="text-slate-400 text-[11px]">Requested by <strong>{req.requestedBy}</strong> ({req.requesterRole})</span>
                  </div>

                  {req.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleProcessApproval(req.id, "APPROVED")} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition">
                        Approve
                      </button>
                      <button onClick={() => handleProcessApproval(req.id, "REJECTED")} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* User Management */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" /> Provisioned Enterprise User Accounts
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateAccessReport}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  Generate Access Review Report
                </button>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Add User
                </button>
              </div>
            </div>

            {accessReport && (
              <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs space-y-1">
                <p className="font-bold text-cyan-300">Access Review Report ({accessReport.reportId})</p>
                <p className="text-slate-300">{accessReport.summaryText}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Directory Source</th>
                    <th className="p-3">MFA</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <p className="font-bold text-white">{u.fullName}</p>
                        <p className="text-slate-400 text-[11px] font-mono">{u.username} ({u.email})</p>
                      </td>
                      <td className="p-3 font-semibold text-cyan-300">{u.role}</td>
                      <td className="p-3 text-slate-300">{u.department}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-800">
                          {u.directorySource}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {u.mfaType}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-[11px]"
                        >
                          {u.status === "ACTIVE" ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 8 RBAC Roles Inspector */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" /> Standardized Commercial RBAC Roles Matrix (8 Roles)
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {rolesList.map((r) => (
                <div key={r.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="font-bold text-white text-xs">{r.title}</span>
                  <span className="block font-mono text-[10px] text-cyan-400">{r.id}</span>
                  <p className="text-[11px] text-slate-400 pt-1">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DIRECTORY TAB */}
      {activeSubTab === "directory" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {directoryConfigs.map((dir) => (
              <div key={dir.type} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{dir.type}</span>
                    <h3 className="font-bold text-white text-base">{dir.domain}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {dir.syncStatus}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <p>Server URL: <strong className="font-mono text-slate-200">{dir.serverUrl}</strong></p>
                  <p>Bind DN: <strong className="font-mono text-slate-300">{dir.bindDn}</strong></p>
                  <p>Sync Interval: <strong className="text-cyan-400">{dir.syncIntervalMinutes} minutes</strong></p>
                </div>

                <button
                  onClick={() => handleSyncDirectory(dir.type)}
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Trigger Enterprise AD Sync Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LICENSING TAB */}
      {activeSubTab === "licensing" && licenseStatus && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Active License Deployment</span>
                <h2 className="text-xl font-extrabold text-white">{licenseStatus.customerName}</h2>
                <p className="text-xs text-slate-400 font-mono">Deployment ID: {licenseStatus.deploymentId}</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {licenseStatus.tier}
                </span>
                <p className="text-xs text-slate-400 mt-1">Days Remaining: <strong className="text-emerald-400 font-bold">{licenseStatus.daysRemaining} days</strong></p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" /> Product Key & Offline Key Activation (.awmkey)
            </h3>

            <form onSubmit={handleActivateLicense} className="space-y-4 text-xs max-w-lg">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Customer / Licensee Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enterprise Client Corp"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Product Key String or .awmkey Token Payload</label>
                <input
                  type="text"
                  required
                  placeholder="AWM-ENT-2026-9921-A82F-7741-X992"
                  value={activationKey}
                  onChange={(e) => setActivationKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-cyan-300 text-white focus:border-cyan-500"
                />
              </div>

              <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow">
                Validate & Activate License
              </button>

              {licenseMsg && (
                <p className={`text-xs font-semibold ${licenseMsg.success ? "text-emerald-400" : "text-rose-400"}`}>
                  {licenseMsg.text}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* LIFECYCLE & UPDATES TAB */}
      {activeSubTab === "lifecycle" && (
        <div className="space-y-6">
          {/* Component Health Checks */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" /> Platform Component Health Checks
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {componentHealth.map((comp) => (
                <div key={comp.componentId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white text-sm">{comp.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {comp.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-400 text-[11px]">
                    <p>CPU Usage: <strong className="text-cyan-400">{comp.cpuUsagePercent}%</strong> | RAM: <strong className="text-cyan-400">{comp.memoryUsageMb} MB</strong></p>
                    <p>Version: <strong className="text-slate-200">{comp.version}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Software Update Packages */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" /> Offline Update Package Manager (.awmpkg) & Rollback
            </h2>

            <form onSubmit={handleApplyUpdatePackage} className="flex gap-3 max-w-lg text-xs">
              <input
                type="text"
                required
                placeholder="awm_update_v6.3.0_lts.awmpkg"
                value={offlinePackageName}
                onChange={(e) => setOfflinePackageName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-cyan-300 text-white focus:border-cyan-500"
              />
              <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow">
                Apply Update Package
              </button>
            </form>

            {updateMsg && <p className="text-xs font-bold text-emerald-400">{updateMsg}</p>}

            {/* Rollback Snapshots */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-300">Rollback Snapshot Points:</h3>
              {snapshots.map((snap) => (
                <div key={snap.snapshotId} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono text-cyan-300 font-bold">{snap.snapshotId}</span>
                    <p className="text-slate-400 text-[11px]">Version: {snap.preUpdateVersion} | Created: {new Date(snap.createdTime).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleRollback(snap.snapshotId)}
                    className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-semibold rounded-xl transition"
                  >
                    Restore Snapshot
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ORGANIZATIONS TAB */}
      {activeSubTab === "organizations" && (
        <div className="space-y-6">
          <div className="grid gap-4">
            {organizations.map((org) => (
              <div key={org.orgId} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{org.orgId}</span>
                    <h3 className="font-extrabold text-white text-lg">{org.name}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {org.subscriptionTier}
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-400">Data Isolation Policy:</span>
                    <p className="font-bold text-white mt-0.5">{org.dataIsolationPolicy}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Monitored Assets:</span>
                    <p className="font-bold text-cyan-400 mt-0.5">{org.totalMonitoredAssets.toLocaleString()} Endpoints</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Incident SLA:</span>
                    <p className="font-bold text-emerald-400 mt-0.5">{org.customSla.criticalIncidentResponseMinutes} Minutes Target</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300">Active SOC Deployments:</h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    {org.activeDeployments.map((dep: any) => (
                      <div key={dep.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">{dep.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{dep.status}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{dep.region} ({dep.type})</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" /> Provision Enterprise User Account
              </h3>
              <button onClick={() => setShowAddUser(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="analyst.smith"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Alex Smith"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex.smith@awm-ai-soc.internal"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Commercial Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500"
                >
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.id}>{r.title} ({r.id})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl">
                  Provision User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
