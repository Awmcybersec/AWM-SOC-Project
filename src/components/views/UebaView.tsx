import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  Bot,
  MapPin,
  Clock,
  KeyRound,
  Activity,
  Sparkles,
  Search,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Globe,
  RefreshCw,
  Laptop,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Terminal,
  Filter,
  UserCheck,
} from 'lucide-react';
import { UebaUser, UebaAnomaly, UebaLoginEvent, UebaEntityEvent } from '../../server/uebaEngine';

export const UebaView: React.FC = () => {
  const [users, setUsers] = useState<UebaUser[]>([]);
  const [anomalies, setAnomalies] = useState<UebaAnomaly[]>([]);
  const [selectedUser, setSelectedUser] = useState<UebaUser | null>(null);
  const [loginEvents, setLoginEvents] = useState<UebaLoginEvent[]>([]);
  const [entityEvents, setEntityEvents] = useState<UebaEntityEvent[]>([]);
  const [stats, setStats] = useState<{
    totalMonitoredEntities: number;
    highRiskUsers: number;
    totalAnomaliesDetected: number;
    activeCriticalAnomalies: number;
    averageUserRiskScore: number;
  }>({
    totalMonitoredEntities: 0,
    highRiskUsers: 0,
    totalAnomaliesDetected: 0,
    activeCriticalAnomalies: 0,
    averageUserRiskScore: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [isAiInvestigating, setIsAiInvestigating] = useState(false);
  const [aiReport, setAiReport] = useState<{
    ai_investigation_summary: string;
    evidence_breakdown: string[];
    mitre_attack_mapping: string;
    recommended_soar_playbooks: string[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'timeline' | 'anomalies' | 'hunting'>('leaderboard');
  const [simulationMsg, setSimulationMsg] = useState<string | null>(null);

  // Fetch Initial UEBA Telemetry
  const fetchUebaData = async () => {
    try {
      const [uRes, aRes, sRes] = await Promise.all([
        fetch('/api/ueba/users'),
        fetch('/api/ueba/anomalies'),
        fetch('/api/ueba/stats'),
      ]);

      if (uRes.ok) {
        const uData: UebaUser[] = await uRes.json();
        setUsers(uData);
        if (!selectedUser && uData.length > 0) {
          setSelectedUser(uData[0]);
        }
      }

      if (aRes.ok) {
        const aData: UebaAnomaly[] = await aRes.json();
        setAnomalies(aData);
      }

      if (sRes.ok) {
        const sData = await sRes.json();
        setStats(sData);
      }
    } catch (err) {
      console.warn('UEBA view fetch error:', err);
    }
  };

  useEffect(() => {
    fetchUebaData();
    const interval = setInterval(fetchUebaData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch details when selected user changes
  useEffect(() => {
    if (!selectedUser) return;
    const fetchUserDetails = async () => {
      try {
        const [lRes, eRes] = await Promise.all([
          fetch(`/api/ueba/events?userId=${selectedUser.id}`),
          fetch(`/api/ueba/anomalies?userId=${selectedUser.id}`),
        ]);
        if (lRes.ok) {
          const lData = await lRes.json();
          setLoginEvents(Array.isArray(lData) ? lData : []);
        }
      } catch (err) {
        console.warn('Failed to load details for user', err);
      }
    };
    fetchUserDetails();
  }, [selectedUser]);

  // AI Investigation Call
  const handleAiInvestigation = async (userToInvestigate: UebaUser) => {
    setIsAiInvestigating(true);
    setAiReport(null);
    try {
      const res = await fetch('/api/ueba/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userToInvestigate.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiReport(data);
      }
    } catch (err) {
      console.error('UEBA AI investigation error', err);
    } finally {
      setIsAiInvestigating(false);
    }
  };

  // Simulate Attack Scenario
  const handleSimulateAttack = async (type: 'IMPOSSIBLE_TRAVEL' | 'BRUTE_FORCE') => {
    try {
      setSimulationMsg(`Injecting ${type} identity attack telemetry...`);
      const targetUser = selectedUser || users[0];

      if (type === 'IMPOSSIBLE_TRAVEL') {
        await fetch('/api/ueba/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: targetUser.id,
            geo_location: 'Beijing, China',
            source_ip: '202.108.22.5',
            login_status: 'SUCCESS',
            auth_method: 'PASSWORD_BASIC',
          }),
        });
      } else {
        await fetch('/api/ueba/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: targetUser.id,
            geo_location: 'Unknown Tor Node',
            source_ip: '185.220.101.99',
            login_status: 'FAILURE',
            auth_method: 'BRUTE_FORCE_ATTEMPT',
          }),
        });
      }

      await fetchUebaData();
      setTimeout(() => setSimulationMsg(null), 4000);
    } catch (err) {
      setSimulationMsg('Failed to inject simulation telemetry');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSev = severityFilter === 'ALL' || u.risk_level === severityFilter;
    return matchesSearch && matchesSev;
  });

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 bg-slate-950 text-slate-100 min-h-screen font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                User & Entity Behavior Analytics (UEBA)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  ML-Engine v2.4
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                AI Behavioral Profiling, Impossible Travel Detection, and Identity Threat Protection (ITDR)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSimulateAttack('IMPOSSIBLE_TRAVEL')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900/50 transition-colors text-xs font-semibold"
          >
            <Zap className="w-4 h-4 text-red-400" />
            Simulate Impossible Travel
          </button>
          <button
            onClick={() => handleSimulateAttack('BRUTE_FORCE')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300 hover:bg-amber-900/50 transition-colors text-xs font-semibold"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Simulate Brute Force
          </button>
          <button
            onClick={fetchUebaData}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {simulationMsg && (
        <div className="bg-purple-900/30 border border-purple-500/40 text-purple-200 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 animate-pulse">
          <Activity className="w-4 h-4 text-purple-400" />
          {simulationMsg}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Monitored Identities</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{stats.totalMonitoredEntities}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-400" /> AD / LDAP + SAML Clouds
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>High-Risk Users</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{stats.highRiskUsers}</div>
          <div className="text-[11px] text-amber-500/80 mt-1 font-mono">Risk Score &gt;= 65/100</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Detected Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-2">{stats.totalAnomaliesDetected}</div>
          <div className="text-[11px] text-slate-500 mt-1">Learned baseline deviations</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Critical Identity Alerts</span>
            <Zap className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">{stats.activeCriticalAnomalies}</div>
          <div className="text-[11px] text-red-500/80 mt-1 font-mono">Immediate SOAR Required</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Average Entity Risk</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 mt-2">{stats.averageUserRiskScore} / 100</div>
          <div className="text-[11px] text-slate-500 mt-1">Enterprise Risk Index</div>
        </div>
      </div>

      {/* Main View Tab Navigation */}
      <div className="flex border-b border-slate-800 text-sm font-medium">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'leaderboard'
              ? 'border-purple-500 text-purple-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> User Risk Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'timeline'
              ? 'border-purple-500 text-purple-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" /> Behavioral Timeline
        </button>
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'anomalies'
              ? 'border-purple-500 text-purple-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> ML Anomaly Stream ({anomalies.length})
        </button>
      </div>

      {/* TAB 1: User Risk Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Table: Users List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search user, department, role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="CRITICAL">Critical Risk</option>
                  <option value="HIGH">High Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="LOW">Low Risk</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono">
                  <tr>
                    <th className="py-3 px-4">Entity User</th>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? 'bg-purple-950/20 border-l-2 border-purple-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {user.username}
                          {user.is_admin && (
                            <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[10px] font-mono border border-red-500/30">
                              ADMIN
                            </span>
                          )}
                          {user.is_dormant && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/30">
                              DORMANT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{user.role}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{user.account_type}</td>
                      <td className="py-3.5 px-4 text-slate-300">{user.department}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getRiskBadgeColor(
                              user.risk_level
                            )}`}
                          >
                            {user.risk_score} / 100
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase">{user.risk_level}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                            handleAiInvestigation(user);
                          }}
                          className="px-2.5 py-1 rounded bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 text-[11px] font-semibold transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <Bot className="w-3.5 h-3.5 text-purple-400" />
                          AWM AI Assistant Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Selected User Profile & AWM AI Copilot Summary */}
          <div className="space-y-4">
            {selectedUser ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      {selectedUser.username}
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {selectedUser.id}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedUser.role}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg text-center font-bold text-xs border ${getRiskBadgeColor(
                      selectedUser.risk_level
                    )}`}
                  >
                    Risk {selectedUser.risk_score}/100
                  </div>
                </div>

                {/* Behavioral Baseline Summary */}
                <div className="space-y-2 text-xs">
                  <h3 className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" /> Learned Behavioral Baseline
                  </h3>
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Working Hours:</span>
                      <span className="font-mono">{selectedUser.normal_working_hours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Known Locations:</span>
                      <span>{selectedUser.usual_locations.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Endpoint:</span>
                      <span className="font-mono text-cyan-400">{selectedUser.usual_devices.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* AI Investigation Callout */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleAiInvestigation(selectedUser)}
                    disabled={isAiInvestigating}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 disabled:opacity-50"
                  >
                    {isAiInvestigating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        AWM AI Analyzing Telemetry...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-purple-200" />
                        Run AWM AI Assistant Identity Investigation
                      </>
                    )}
                  </button>

                  {aiReport && (
                    <div className="bg-purple-950/30 border border-purple-500/40 rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex items-center gap-2 text-purple-300 font-semibold border-b border-purple-500/30 pb-2">
                        <Bot className="w-4 h-4 text-purple-400" />
                        AWM AI Assistant Identity Verdict
                      </div>
                      <p className="text-slate-300 leading-relaxed">{aiReport.ai_investigation_summary}</p>

                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold text-purple-400">Threat Evidence:</div>
                        <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
                          {aiReport.evidence_breakdown.map((ev, idx) => (
                            <li key={idx}>{ev}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="text-[11px] bg-slate-950/60 p-2 rounded border border-purple-500/20 text-slate-300 font-mono">
                        <span className="text-slate-500">MITRE ATT&CK: </span>
                        {aiReport.mitre_attack_mapping}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-semibold text-emerald-400">Recommended SOAR Action:</div>
                        {aiReport.recommended_soar_playbooks.map((pb, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px]"
                          >
                            <span>{pb}</span>
                            <button
                              onClick={() => alert(`Triggered SOAR Action: ${pb}`)}
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                            >
                              Execute
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl text-slate-500 text-xs">
                Select an entity to view behavioral baselines and trigger AI investigation
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Behavioral Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Authentication & Location Jump Timeline
                {selectedUser && <span className="text-xs text-purple-400">({selectedUser.username})</span>}
              </h2>
            </div>

            <div className="relative border-l-2 border-slate-800 pl-6 ml-3 space-y-6 text-xs">
              {loginEvents.map((event) => (
                <div key={event.id} className="relative group">
                  <div
                    className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 bg-slate-950 ${
                      event.is_impossible_travel
                        ? 'border-red-500 bg-red-500 animate-ping'
                        : event.login_status === 'SUCCESS'
                        ? 'border-emerald-500'
                        : 'border-amber-500'
                    }`}
                  />
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                      <span>{new Date(event.timestamp).toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <Globe className="w-3 h-3 text-cyan-400" /> {event.geo_location}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-medium text-slate-200">
                      <span>Status: {event.login_status}</span>
                      <span className="text-slate-500">|</span>
                      <span>IP: {event.source_ip}</span>
                      <span className="text-slate-500">|</span>
                      <span>Auth: {event.auth_method}</span>
                    </div>

                    {event.is_impossible_travel && (
                      <div className="bg-red-950/40 border border-red-500/40 text-red-300 p-2 rounded text-[11px] flex items-center gap-2 font-semibold">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        CRITICAL ANOMALY: Impossible Travel velocity violation detected between consecutive logins
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ML Anomaly Stream */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User Entity</th>
                  <th className="py-3 px-4">Anomaly Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {anomalies.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{a.user_id}</td>
                    <td className="py-3 px-4 font-mono text-purple-300">{a.anomaly_type}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadgeColor(a.severity)}`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-400">{a.confidence_score}%</td>
                    <td className="py-3 px-4 text-slate-300 max-w-md truncate">{a.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
