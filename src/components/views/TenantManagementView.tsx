import React, { useState, useEffect } from 'react';
import logo from "../../assets/logo.jpg";
import {
  Building2,
  Users,
  Shield,
  Key,
  CreditCard,
  Settings,
  Activity,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Globe,
  UserCheck,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
  ShieldAlert,
  Server,
  Download,
  Sliders,
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED' | 'DELETED';
  tier: 'COMMUNITY' | 'PRO' | 'ENTERPRISE' | 'GOVERNMENT';
  max_agents: number;
  max_users: number;
  data_retention_days: number;
  created_at: string;
}

interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  roles: string[];
  status: string;
  mfa_enabled: boolean;
  last_login_at?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system_role: boolean;
}

interface License {
  id: string;
  tenant_id: string;
  license_key: string;
  plan_tier: string;
  max_endpoints: number;
  max_log_ingestion_gb_day: number;
  status: string;
  starts_at: string;
  expires_at: string;
}

interface TenantAuditLog {
  id: string;
  tenant_id: string;
  actor_user_id: string;
  action: string;
  resource_type: string;
  details: any;
  timestamp: string;
}

export const TenantManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'users' | 'roles' | 'licenses' | 'audit'>('tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('TNT-ACME-CORP');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [auditLogs, setAuditLogs] = useState<TenantAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal / Form States
  const [showCreateTenant, setShowCreateTenant] = useState<boolean>(false);
  const [newTenantName, setNewTenantName] = useState<string>('');
  const [newTenantDomain, setNewTenantDomain] = useState<string>('');
  const [newTenantTier, setNewTenantTier] = useState<Tenant['tier']>('ENTERPRISE');

  const [showCreateUser, setShowCreateUser] = useState<boolean>(false);
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserFullName, setNewUserFullName] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<string>('SECURITY_ANALYST');

  useEffect(() => {
    fetchTenantData();
  }, [selectedTenantId]);

  const fetchTenantData = async () => {
    setLoading(true);
    try {
      const [tRes, uRes, rRes, lRes, aRes] = await Promise.all([
        fetch('/api/tenants').then((r) => r.json()),
        fetch(`/api/users?tenantId=${selectedTenantId}`).then((r) => r.json()),
        fetch('/api/roles').then((r) => r.json()),
        fetch(`/api/licenses?tenantId=${selectedTenantId}`).then((r) => r.json()),
        fetch(`/api/tenants/audits?tenantId=${selectedTenantId}`).then((r) => r.json()),
      ]);

      setTenants(tRes || []);
      setUsers(uRes || []);
      setRoles(rRes || []);
      setLicenses(lRes || []);
      setAuditLogs(aRes || []);
    } catch (err) {
      console.error('Error fetching multi-tenant data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantDomain) return;

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTenantName,
          domain: newTenantDomain,
          tier: newTenantTier,
        }),
      });
      const data = await res.json();
      if (data.tenant) {
        setSelectedTenantId(data.tenant.id);
        setShowCreateTenant(false);
        setNewTenantName('');
        setNewTenantDomain('');
        fetchTenantData();
      }
    } catch (err) {
      console.error('Error creating tenant:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserFullName) return;

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          email: newUserEmail,
          fullName: newUserFullName,
          roles: [newUserRole],
        }),
      });
      setShowCreateUser(false);
      setNewUserEmail('');
      setNewUserFullName('');
      fetchTenantData();
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-12 flex items-center justify-center shrink-0">
              <img
                src={logo}
                alt="AWM Cybersecurity Official Logo"
                className="w-full h-full object-contain filter drop-shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Multi-Tenant Enterprise SaaS Console
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Global Tenant Isolation & RBAC
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Centralized multi-tenant management, IAM user provisioning, licensing, and security boundaries.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateTenant(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Provision Organization
          </button>
        </div>
      </div>

      {/* Tenant Context Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-4 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Tenant Context:</span>
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.domain}) - {t.tier}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
          <span>Tenant ID: <strong className="text-indigo-400">{selectedTenant?.id}</strong></span>
          <span>Max Agents: <strong className="text-white">{selectedTenant?.max_agents}</strong></span>
          <span>Retention: <strong className="text-white">{selectedTenant?.data_retention_days} Days</strong></span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'tenants'
              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" /> Organizations Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'users'
              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" /> IAM Users & Provisioning
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'roles'
              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" /> RBAC Roles & Matrix
        </button>
        <button
          onClick={() => setActiveTab('licenses')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'licenses'
              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Key className="w-4 h-4" /> Licenses & Quotas
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'audit'
              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" /> Tenant Audit Trails
        </button>
      </div>

      {/* TAB 1: TENANTS OVERVIEW */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tenants.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTenantId(t.id)}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  t.id === selectedTenantId
                    ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {t.tier}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-2">{t.name}</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> {t.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-mono mt-2">{t.domain}</p>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Max Agents: {t.max_agents}</span>
                  <span>Max Users: {t.max_users}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: IAM USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/80 p-4 border border-slate-800 rounded-xl">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Organization IAM Users ({users.length})
              </h2>
              <p className="text-xs text-slate-400">Identity and RBAC management for {selectedTenant?.name}.</p>
            </div>
            <button
              onClick={() => setShowCreateUser(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" /> Provision IAM User
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Assigned Roles</th>
                    <th className="px-4 py-3">MFA Status</th>
                    <th className="px-4 py-3">Account Status</th>
                    <th className="px-4 py-3 text-right">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono text-xs text-indigo-400 font-bold">{u.id}</td>
                      <td className="px-4 py-3 font-semibold text-white">{u.full_name}</td>
                      <td className="px-4 py-3 text-xs text-slate-300 font-mono">{u.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 rounded font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {u.mfa_enabled ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3" /> MFA Active
                          </span>
                        ) : (
                          <span className="text-amber-400 font-medium">MFA Disabled</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-400">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleTimeString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RBAC ROLES & MATRIX */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" /> Platform Role-Based Access Control (RBAC) Matrix
            </h2>
            <p className="text-xs text-slate-400">Predefined system roles and granular API permissions catalog.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <div key={role.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {role.id}
                  </span>
                  {role.is_system_role && (
                    <span className="text-xs text-slate-400 font-medium">System Role</span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white">{role.name}</h3>
                <p className="text-xs text-slate-400">{role.description}</p>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Granted Permissions
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((p, idx) => (
                      <span key={idx} className="text-xs font-mono bg-slate-950 text-cyan-400 px-2 py-0.5 rounded border border-slate-800">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LICENSES & QUOTAS */}
      {activeTab === 'licenses' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" /> Enterprise Software Licenses
            </h2>
            <p className="text-xs text-slate-400">Active AWM Cyber AI XDR subscription license keys and resource allocations.</p>
          </div>

          <div className="space-y-3">
            {licenses.map((lic) => (
              <div key={lic.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-400 font-bold">{lic.license_key}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {lic.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-300">
                  <div>Plan Tier: <strong className="text-white block">{lic.plan_tier}</strong></div>
                  <div>Max Endpoint Fleet: <strong className="text-white block">{lic.max_endpoints} Devices</strong></div>
                  <div>Log Ingestion SLA: <strong className="text-white block">{lic.max_log_ingestion_gb_day} GB/Day</strong></div>
                  <div>Expiration Date: <strong className="text-white block">{new Date(lic.expires_at).toLocaleDateString()}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Tenant Security Audit Log
            </h2>
            <p className="text-xs text-slate-400">Immutable record of administrative operations within {selectedTenant?.name}.</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-800/60">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-800/40 transition flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-indigo-400 font-bold">{log.action}</span>
                      <span className="text-xs text-slate-400 font-mono">Actor: {log.actor_user_id}</span>
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-1">
                      {JSON.stringify(log.details)}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE TENANT MODAL */}
      {showCreateTenant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center shrink-0">
                <img
                  src={logo}
                  alt="AWM Cybersecurity Logo"
                  className="w-full h-full object-contain rounded-md"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Provision New Organization
              </h3>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CyberSec Tech Solutions"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-sm text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Corporate Domain</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. cybersectech.com"
                  value={newTenantDomain}
                  onChange={(e) => setNewTenantDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-sm text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Subscription Tier</label>
                <select
                  value={newTenantTier}
                  onChange={(e) => setNewTenantTier(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-sm text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PRO">PRO XDR</option>
                  <option value="ENTERPRISE">ENTERPRISE XDR</option>
                  <option value="GOVERNMENT">GOVERNMENT DEFENSE</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTenant(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
                >
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Provision IAM User
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-sm text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sjenkins@acmefinancial.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-sm text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Assign Primary Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-sm text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TENANT_ADMIN">Tenant Administrator</option>
                  <option value="CISO">CISO / Compliance Officer</option>
                  <option value="SOC_MANAGER">SOC Manager</option>
                  <option value="SECURITY_ANALYST">Security Analyst</option>
                  <option value="INCIDENT_RESPONDER">Incident Responder</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="READ_ONLY">Read Only</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
