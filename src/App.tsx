import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { SplashScreen } from "./components/SplashScreen";
import { VoiceAssistantModal } from "./components/VoiceAssistantModal";
import type { ActiveTab } from "./types";
// Views
import { ExecutiveDashboardView } from "./components/views/ExecutiveDashboardView";
import { AiCopilotView } from "./components/views/AiCopilotView";
import { EdrView } from "./components/views/EdrView";
import { MalwareSandboxView } from "./components/views/MalwareSandboxView";
import { SiemLogsView } from "./components/views/SiemLogsView";
import { NidsHidsView } from "./components/views/NidsHidsView";
import { UebaView } from "./components/views/UebaView";
import { SoarPlaybooksView } from "./components/views/SoarPlaybooksView";
import { ThreatIntelView } from "./components/views/ThreatIntelView";
import { MitreAttackView } from "./components/views/MitreAttackView";
import { YaraSigmaView } from "./components/views/YaraSigmaView";
import { VulnerabilityView } from "./components/views/VulnerabilityView";
import { ComplianceView } from "./components/views/ComplianceView";
import { RbacAuditView } from "./components/views/RbacAuditView";
import { TenantManagementView } from "./components/views/TenantManagementView";
import { ArchitectureDocsView } from "./components/views/ArchitectureDocsView";
import { SocCommandCenterView } from "./components/views/SocCommandCenterView";
import { AutonomousResponseView } from "./components/views/AutonomousResponseView";
import { AIModelManagementView } from "./components/views/AIModelManagementView";
import { WindowsDeploymentView } from "./components/views/WindowsDeploymentView";
import { EnterpriseAdminView } from "./components/views/EnterpriseAdminView";
import { EnterpriseApiGatewayView } from "./components/views/EnterpriseApiGatewayView";
import { AdvancedAnalyticsView } from "./components/views/AdvancedAnalyticsView";
import { AdvancedSocDashboardView } from "./components/views/AdvancedSocDashboardView";
import { IncidentResponseView } from "./components/views/IncidentResponseView";
import { ThreatIntelPlatformView } from "./components/views/ThreatIntelPlatformView";
import { AiAnalystAssistantView } from "./components/views/AiAnalystAssistantView";
import { EnterpriseReportingView } from "./components/views/EnterpriseReportingView";
import { AutonomousSocOperationsView } from "./components/views/AutonomousSocOperationsView";
import { AdvancedThreatHuntingView } from "./components/views/AdvancedThreatHuntingView";
import { AutomationMarketplaceView } from "./components/views/AutomationMarketplaceView";
import { GlobalScaleArchitectureView } from "./components/views/GlobalScaleArchitectureView";


import {
  Alert,
  AlertStatus,
  SiemLog,
  Tenant,
  AuditLogEntry,
  SoarPlaybook,
} from "./types";

// Initial Datasets

export default function App() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [siemLogs, setSiemLogs] = useState<SiemLog[]>([]);
  const [malwareSamples, setMalwareSamples] = useState<any[]>([]);
  const [iocs, setIocs] = useState<any[]>([]);
  const [playbooks, setPlaybooks] = useState<SoarPlaybook[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [mitreTechniques, setMitreTechniques] = useState<any[]>([]);
  const [complianceFrameworks, setComplianceFrameworks] = useState<any[]>([]);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [isInitializing, setIsInitializing] = useState(true);

  const [activeTab, setActiveTab] =
  useState<ActiveTab>("dashboard");

  const [selectedRole, setSelectedRole] = useState(
    "SOC Lead / Principal Analyst"
  );

  const [isLiveSimulating, setIsLiveSimulating] = useState(true);

  const [selectedAlertForCopilot, setSelectedAlertForCopilot] =
    useState<Alert | null>(null);

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Live Stream Log Generator
 // useEffect(() => {
  ///  if (!isLiveSimulating) return;

   // const interval = setInterval(() => {
   //   const now = new Date();
    //  const timeStr = now.toISOString();

    //  const sampleLogSources = ["Windows Security", "Syslog Linux", "AWS CloudTrail", "PaloAlto Firewall", "K8s Audit"] as const;
    //  const sampleLevels = ["INFO", "WARN", "ERROR"] as const;
    //  const randomSrc = sampleLogSources[Math.floor(Math.random() * sampleLogSources.length)];
    //  const randomLevel = sampleLevels[Math.floor(Math.random() * sampleLevels.length)];
//const randomIp = `10.0.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 250)}`;

    //  const newLog: SiemLog = {
     //   id: `LOG-${Date.now().toString().slice(-6)}`,
///timestamp: timeStr,
     //   logSource: randomSrc,
    //    eventId: `${Math.floor(Math.random() * 8000 + 1000)}`,
    //    host: `SRV-NODE-${Math.floor(Math.random() * 10 + 1)}`,
    //    user: `user_${Math.floor(Math.random() * 5 + 1)}`,
   //     ip: randomIp,
   //     message: `Automated telemetry heartbeat check on ${randomSrc}. Traffic throughput normal.`,
//level: randomLevel,
  //      rawJson: `{"timestamp":"${timeStr}","source":"${randomSrc}","ip":"${randomIp}"}`,
    //  };

   //   setSiemLogs((prev) => [newLog, ...prev.slice(0, 49)]);

      // Ingest live log into backend SIEM engine
     // fetch("/api/siem/ingest", {
       // method: //"POST",
       // headers: { "Content-Type": "application/json" },
       // body: JSON.stringify({
        //  id: newLog.id,
        //  timestamp: newLog.timestamp,
        //  sourceType: newLog.logSource,
         // logSource: newLog.logSource,
        //  eventId: newLog.eventId,
         // host: newLog.host,
         // user: newLog.user,
         // sourceIp: newLog.ip,
        //  ip: newLog.ip,
//message: newLog.message,
        //  level: newLog.level,
        //  category: "Telemetry Heartbeat",
      //  }),
   //   }).catch(() => {});
//}, 6000);

   // return () => clearInterval(interval);
 // }, [isLiveSimulating]);

  // Update Alert Status Handler
  const handleUpdateAlertStatus = (id: string, newStatus: AlertStatus) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, status: newStatus } : alert))
    );

    // Audit log
    const audit: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString(),
      actor: selectedRole.split("/")[0].trim(),
      role: selectedRole,
      action: `Updated alert status for ${id} to ${newStatus}`,
      target: id,
      ipAddress: "127.0.0.1",
      hash: Math.random().toString(16).slice(2, 12),
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  // Run SOAR Playbook for Alert
  const handleExecutePlaybookForAlert = (targetAlert: Alert) => {
  setAlerts((prev) =>
    prev.map((a) =>
      a.id === targetAlert.id ? { ...a, status: "Mitigated" } : a
    )
  );

  const audit: AuditLogEntry = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toLocaleString(),
    actor: selectedRole.split("/")[0].trim(),
    role: selectedRole,
    action: `Executed SOAR Containment Playbook for alert ${targetAlert.id} (${targetAlert.title})`,
    target: targetAlert.device,
    ipAddress: targetAlert.sourceIp,
    hash: Math.random().toString(16).slice(2, 12),
  };

  setAuditLogs((prev) => [audit, ...prev]);
};

  // Run Playbook by ID
  const handleRunPlaybook = (pbId: string) => {
  const pb = playbooks.find((p) => p.id === pbId);
  if (!pb) return;

  setPlaybooks((prev) =>
    prev.map((p) =>
      p.id === pbId
        ? {
            ...p,
            lastExecuted: new Date().toISOString().replace("T", " ").slice(0, 16),
            totalRuns: p.totalRuns + 1,
          }
        : p
    )
  );
};

  // Trigger Manual Attack Event
  const triggerManualThreatEvent = () => {
  console.log("Manual threat generation disabled.");
};

  // Toggle Rule
  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const unassignedAlertsCount = alerts.filter((a) => a.status === "Unassigned").length;

  if (isInitializing) {
    return <SplashScreen onComplete={() => setIsInitializing(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 font-sans flex flex-col">
      {/* Top App Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tenants={tenants}
        selectedTenant={selectedTenant}
        setSelectedTenant={setSelectedTenant}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        isLiveSimulating={isLiveSimulating}
        setIsLiveSimulating={setIsLiveSimulating}
        criticalAlertsCount={alerts.filter((a) => a.severity === "Critical" && a.status !== "Mitigated").length}
        triggerManualThreatEvent={() => {}}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Menu */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unassignedAlertsCount={unassignedAlertsCount}
        />

        {/* Content Region */}
        <main className="flex-1 overflow-y-auto bg-[#0B1220]">
          {activeTab === "soc_command" && <SocCommandCenterView />}

          {activeTab === "incident_response" && <IncidentResponseView />}

          {activeTab === "ai_analyst_assistant" && <AiAnalystAssistantView />}

          {activeTab === "enterprise_reporting" && <EnterpriseReportingView />}

          {activeTab === "autonomous_response" && <AutonomousResponseView />}

          {activeTab === "ai_models" && <AIModelManagementView />}

          {activeTab === "dashboard" && (
            <ExecutiveDashboardView
              alerts={alerts}
              onUpdateAlertStatus={handleUpdateAlertStatus}
              onExecutePlaybookForAlert={handleExecutePlaybookForAlert}
              setActiveTab={setActiveTab}
              setSelectedAlertForCopilot={setSelectedAlertForCopilot}
            />
          )}

          {activeTab === "copilot" && (
            <AiCopilotView selectedAlert={selectedAlertForCopilot} />
          )}

          {activeTab === "edr" && <EdrView />}

          {activeTab === "malware" && (
            <MalwareSandboxView samples={malwareSamples} />
          )}

          {activeTab === "siem" && <SiemLogsView logs={siemLogs} />}

          {activeTab === "nids" && <NidsHidsView />}

          {activeTab === "ueba" && <UebaView />}

          {activeTab === "soar" && <SoarPlaybooksView />}

          {activeTab === "threat_intel" && <ThreatIntelPlatformView />}

          {activeTab === "mitre" && <MitreAttackView techniques={mitreTechniques} />}

          {activeTab === "yara_sigma" && (
            <YaraSigmaView rules={rules} onToggleRule={handleToggleRule} />
          )}

          {activeTab === "vulnerability" && <VulnerabilityView assets={assets} />}

          {activeTab === "compliance" && (
            <ComplianceView frameworks={complianceFrameworks} />
          )}

          {activeTab === "rbac_audit" && (
            <RbacAuditView tenants={tenants} auditLogs={auditLogs} />
          )}

          {activeTab === "tenant_management" && <TenantManagementView />}

          {activeTab === "windows_deployment" && <WindowsDeploymentView />}

          {activeTab === "enterprise_admin" && <EnterpriseAdminView />}

          {activeTab === "api_gateway" && <EnterpriseApiGatewayView />}

          {activeTab === "advanced_analytics" && <AdvancedAnalyticsView />}

          {activeTab === "autonomous_soc" && <AutonomousSocOperationsView />}

          {activeTab === "threat_hunting" && <AdvancedThreatHuntingView />}

          {activeTab === "marketplace" && <AutomationMarketplaceView />}

          {activeTab === "global_scale" && <GlobalScaleArchitectureView />}

          {activeTab === "architecture_docs" && <ArchitectureDocsView />}
        </main>
      </div>

      {/* Voice AI Assistant Modal Overlay */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        setActiveTab={setActiveTab}
        triggerManualThreatEvent={triggerManualThreatEvent}
        criticalAlertsCount={alerts.filter((a) => a.severity === "Critical" && a.status !== "Mitigated").length}
      />
    </div>
  );
}
