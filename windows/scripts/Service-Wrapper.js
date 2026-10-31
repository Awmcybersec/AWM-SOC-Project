/**
 * AWM AI SOC SENIOR - Windows Service Node Manager
 * Runs and monitors the core server process as a background service.
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const logDir = process.env.AWM_LOG_DIR || "C:\\ProgramData\\AWM-AI-SOC-SENIOR\\logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const outLogPath = path.join(logDir, "awm-service-stdout.log");
const errLogPath = path.join(logDir, "awm-service-stderr.log");

const outStream = fs.createWriteStream(outLogPath, { flags: "a" });
const errStream = fs.createWriteStream(errLogPath, { flags: "a" });

console.log("[AWM Windows Service] Starting AWM AI SOC Senior Engine...");

const serverScript = path.join(__dirname, "..", "..", "dist", "server.cjs");

function startChild() {
  const child = spawn(process.execPath, [serverScript], {
    env: { ...process.env, NODE_ENV: "production", PORT: "3000" },
    cwd: path.join(__dirname, "..", ".."),
  });

  child.stdout.pipe(outStream);
  child.stderr.pipe(errStream);

  child.on("exit", (code, signal) => {
    console.error(`[AWM Windows Service] Server exited with code ${code}, signal ${signal}. Restarting in 5s...`);
    setTimeout(startChild, 5000);
  });
}

startChild();
