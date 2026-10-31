import { windowsLogger } from "../windows/windowsLogger.js";

export interface SocDeploymentEnvironment {
  id: string;
  name: string;
  region: string;
  type: "Cloud Run Container" | "K8s High Availability Cluster" | "BareMetal Windows Service" | "Air-Gapped Sovereign Cloud";
  activeEdgeNodes: number;
  dailyIngestGb: number;
  slaTargetMinutes: number; // e.g. 15 min incident containment SLA
  status: "ONLINE" | "DEGRADED" | "MAINTENANCE";
}

export interface CustomerOrganization {
  orgId: string;
  name: string;
  subscriptionTier: "Enterprise Pro" | "Government Sovereign" | "MSSP Multi-Client";
  primaryContactEmail: string;
  dataIsolationPolicy: "Strict Tenant VPC Partition" | "Tenant Isolated Key Encryption" | "Air-Gapped Local Sink";
  totalMonitoredAssets: number;
  activeDeployments: SocDeploymentEnvironment[];
  customSla: {
    criticalIncidentResponseMinutes: number;
    logRetentionDays: number;
    uptimeSlaPercentage: number;
  };
}

class OrganizationEngine {
  private organizations: CustomerOrganization[] = [
    {
      orgId: "ORG-AWM-GLOBAL",
      name: "Global Defense Enterprise Services Corp",
      subscriptionTier: "Enterprise Pro",
      primaryContactEmail: "soc-admin@defense-enterprise.com",
      dataIsolationPolicy: "Tenant Isolated Key Encryption",
      totalMonitoredAssets: 3420,
      customSla: {
        criticalIncidentResponseMinutes: 15,
        logRetentionDays: 365,
        uptimeSlaPercentage: 99.99,
      },
      activeDeployments: [
        {
          id: "DEP-US-EAST",
          name: "US-East Production Primary SOC",
          region: "us-east1 (Virginia)",
          type: "K8s High Availability Cluster",
          activeEdgeNodes: 24,
          dailyIngestGb: 1420.5,
          slaTargetMinutes: 15,
          status: "ONLINE",
        },
        {
          id: "DEP-EU-WEST",
          name: "EU Sovereign Data Center SOC",
          region: "europe-west3 (Frankfurt)",
          type: "Air-Gapped Sovereign Cloud",
          activeEdgeNodes: 12,
          dailyIngestGb: 880.2,
          slaTargetMinutes: 15,
          status: "ONLINE",
        },
        {
          id: "DEP-APAC-SG",
          name: "APAC Regional Edge Node",
          region: "asia-southeast1 (Singapore)",
          type: "Cloud Run Container",
          activeEdgeNodes: 8,
          dailyIngestGb: 540.0,
          slaTargetMinutes: 20,
          status: "ONLINE",
        },
      ],
    },
    {
      orgId: "ORG-FINANCE-CORP",
      name: "Apex Global Financial Banking Corp",
      subscriptionTier: "Government Sovereign",
      primaryContactEmail: "security@apex-bank.com",
      dataIsolationPolicy: "Strict Tenant VPC Partition",
      totalMonitoredAssets: 1850,
      customSla: {
        criticalIncidentResponseMinutes: 10,
        logRetentionDays: 730,
        uptimeSlaPercentage: 99.999,
      },
      activeDeployments: [
        {
          id: "DEP-FIN-PRIMARY",
          name: "NYC Financial Hub BareMetal Vault",
          region: "us-east4 (New York)",
          type: "BareMetal Windows Service",
          activeEdgeNodes: 16,
          dailyIngestGb: 2100.0,
          slaTargetMinutes: 10,
          status: "ONLINE",
        },
      ],
    },
  ];

  public getOrganizations(): CustomerOrganization[] {
    return this.organizations;
  }

  public getOrganizationById(orgId: string): CustomerOrganization | undefined {
    return this.organizations.find((o) => o.orgId === orgId);
  }

  public createOrganization(data: Partial<CustomerOrganization>): CustomerOrganization {
    const newOrg: CustomerOrganization = {
      orgId: `ORG-${Date.now().toString(36).toUpperCase()}`,
      name: data.name || "New Enterprise Organization",
      subscriptionTier: data.subscriptionTier || "Enterprise Pro",
      primaryContactEmail: data.primaryContactEmail || "admin@organization.com",
      dataIsolationPolicy: data.dataIsolationPolicy || "Strict Tenant VPC Partition",
      totalMonitoredAssets: data.totalMonitoredAssets || 100,
      customSla: data.customSla || {
        criticalIncidentResponseMinutes: 15,
        logRetentionDays: 365,
        uptimeSlaPercentage: 99.9,
      },
      activeDeployments: data.activeDeployments || [
        {
          id: `DEP-${Math.floor(Math.random() * 900 + 100)}`,
          name: "Primary Enterprise Deployment Node",
          region: "us-central1",
          type: "Cloud Run Container",
          activeEdgeNodes: 4,
          dailyIngestGb: 100,
          slaTargetMinutes: 15,
          status: "ONLINE",
        },
      ],
    };

    this.organizations.push(newOrg);
    windowsLogger.audit("ORG_MGMT", `Created new Customer Organization: '${newOrg.name}' (${newOrg.orgId})`);
    return newOrg;
  }
}

export const organizationEngine = new OrganizationEngine();
