import crypto from "crypto";
import os from "os";

export interface MachineFingerprintData {
  machineId: string;
  hostname: string;
  platform: string;
  arch: string;
  cpus: number;
  totalMemoryBytes: number;
  cpuModel: string;
  hardwareHash: string;
  generatedAt: string;
}

export class MachineFingerprintEngine {
  public static generateFingerprint(): MachineFingerprintData {
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const cpuModel = cpus.length > 0 ? cpus[0].model : "Generic x64 CPU";

    // Combine hardware signals into HMAC SHA-256 fingerprint signature
    const rawSignals = `${hostname}|${platform}|${arch}|${cpuModel}|${cpus.length}|${totalMem}`;
    const hardwareHash = crypto
      .createHmac("sha256", "AWM-HW-SECRET-KEY-2026")
      .update(rawSignals)
      .digest("hex")
      .toUpperCase();

    const machineId = `AWM-HW-${hardwareHash.substring(0, 8)}-${hardwareHash.substring(8, 16)}`;

    return {
      machineId,
      hostname,
      platform,
      arch,
      cpus: cpus.length,
      totalMemoryBytes: totalMem,
      cpuModel,
      hardwareHash,
      generatedAt: new Date().toISOString(),
    };
  }

  public static verifyBinding(storedFingerprintHash: string): boolean {
    const current = this.generateFingerprint();
    return current.hardwareHash === storedFingerprintHash;
  }
}
