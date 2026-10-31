/**
 * Master Windows Build & Package Script
 * AWM AI SOC SENIOR Enterprise Platform
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("==========================================================================");
console.log(" [AWM AI SOC SENIOR] Building Windows Enterprise Package");
console.log("==========================================================================");

const rootDir = path.join(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const distElectronDir = path.join(rootDir, "dist-electron");
const distInstallerDir = path.join(rootDir, "release");

function removeDirectory(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      return;
    } catch (err) {
      if (attempt === maxAttempts) {
        console.warn(`Warning: Failed to remove ${dir} after ${maxAttempts} attempts.`, err.message);
        return;
      }
      if (err.code === "EPERM" || err.code === "EBUSY") {
        console.warn(`Warning: ${dir} is busy or locked (attempt ${attempt}). Retrying...`);
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
      } else {
        throw err;
      }
    }
  }
}

function removeIfExists(target) {
  try {
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  } catch (err) {
    // best-effort cleanup, don't throw here
    console.warn(`Warning: could not remove ${target}: ${err.message}`);
  }
}

// Step 1: Clean build directories
console.log("\n[1/5] Cleaning dist & build output directories...");
removeDirectory(distDir);
removeDirectory(distElectronDir);
removeDirectory(distInstallerDir);

// Step 2: Build Vite Frontend
console.log("\n[2/5] Compiling Web Dashboard Frontend (Vite)...");
execSync("npx vite build", { stdio: "inherit", cwd: rootDir });

// Step 3: Bundle Node Backend Server into CJS
console.log("\n[3/5] Bundling Backend Server Engine (esbuild -> dist/server.cjs)...");
  execSync(
  "npx esbuild server.ts --bundle --platform=node --format=cjs --sourcemap --external:vite --outfile=dist/server.cjs",
  { stdio: "inherit", cwd: rootDir }
);

// Step 4: Compile Electron Desktop Main & Preload scripts
console.log("\n[4/5] Compiling Desktop Client (Electron)...");
fs.mkdirSync(distElectronDir, { recursive: true });
try {
  execSync(
    "npx esbuild electron/main.ts electron/preload.ts --bundle --platform=node --format=cjs --packages=external --outdir=dist-electron",
    { stdio: "inherit", cwd: rootDir }
  );
} catch (err) {
  console.warn("Electron bundle warning (non-fatal):", err.message);
}

// Step 5: Generate Installer Spec & Setup Package Output
console.log("\n[5/5] Generating Windows Installer Executable...");

// Pre-clean any leftover temp unpack directories that can block renames on Windows
removeIfExists(path.join(distInstallerDir, "win-unpacked.tmp"));
removeIfExists(path.join(distInstallerDir, "win-unpacked"));

try {
  execSync(
    "npx electron-builder --win",
    { stdio: "inherit", cwd: rootDir }
  );
} catch (err) {
  // If packaging failed due to EPERM on rename, attempt a best-effort cleanup and rethrow
  console.warn("Packaging error, attempting cleanup before rethrowing...");
  try {
    removeIfExists(path.join(distInstallerDir, "win-unpacked.tmp"));
    removeIfExists(path.join(distInstallerDir, "win-unpacked"));
  } catch (cleanupErr) {
    console.warn(`Cleanup failed: ${cleanupErr.message}`);
  }
  throw err;
}

console.log("\n==========================================================================");
console.log(" [SUCCESS] Windows Build Completed Successfully!");
console.log(" Executable Desktop Client: dist-electron/main.js -> AWM AI SOC SENIOR.exe");
console.log(" Setup Deployment Package: release/AWM-AI-SOC-SENIOR-Setup.exe");
console.log(" Service Installer:        windows/scripts/Install-Service.ps1");
console.log(" PostgreSQL Init Script:   windows/scripts/Init-PostgreSQL.ps1");
console.log("==========================================================================");
