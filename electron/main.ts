import { app, BrowserWindow, Tray, Menu, ipcMain, shell, Notification, dialog } from "electron";
import path from "path";
import fs from "fs";
import http from "http";
import { spawn, ChildProcess } from "child_process";
import dotenv from "dotenv";

const PORT = Number(process.env.PORT || 3000);
const SERVER_URL = `http://127.0.0.1:${PORT}`;
const HEALTH_PATH = "/api/health";
const HEALTH_CHECK_RETRY_MS = 1000;

const HEALTH_CHECK_TIMEOUT_MS = 20000;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverProcess: ChildProcess | null = null;
let logFilePath = "";

if (process.env.DISABLE_HARDWARE_ACCELERATION === "true") {
  app.disableHardwareAcceleration();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

type EnvLoadResult = {
  env: NodeJS.ProcessEnv;
  source: string | null;
  filePath: string | null;
};

function getBackendServerPath(): string {
  if (!app.isPackaged) {
    return path.resolve(__dirname, "..", "..", "dist", "server.cjs");
  }

  const unpackedPath = path.join(process.resourcesPath, "app.asar.unpacked", "dist", "server.cjs");
  const resourcesPath = path.join(process.resourcesPath, "dist", "server.cjs");

  if (fs.existsSync(unpackedPath)) {
    return unpackedPath;
  }

  return resourcesPath;
}

function loadEnvironment(): EnvLoadResult {
  const searchLocations = [
    { source: "process.cwd()", filePath: path.resolve(process.cwd(), ".env") },
    { source: "app.getPath('userData')", filePath: path.join(app.getPath("userData"), ".env") },
    { source: "resources/config/.env", filePath: path.join(process.resourcesPath, "config", ".env") },
    { source: "resources/app.asar.unpacked/config/.env", filePath: path.join(process.resourcesPath, "app.asar.unpacked", "config", ".env") },
  ];

  for (const location of searchLocations) {
    try {
      if (fs.existsSync(location.filePath)) {
        const fileContents = fs.readFileSync(location.filePath, "utf8");
        const parsedEnv = dotenv.parse(fileContents);
        return {
          env: parsedEnv,
          source: location.source,
          filePath: location.filePath,
        };
      }
    } catch (error) {
      appendLog(`Env load failure at ${location.filePath}: ${String(error)}`);
    }
  }

  return {
    env: {},
    source: null,
    filePath: null,
  };
}

function getPostgresEnvStatus(env: NodeJS.ProcessEnv): string {
  const requiredKeys = ["POSTGRES_PASSWORD", "POSTGRES_USER", "POSTGRES_DB"];
  const missingKeys = requiredKeys.filter((key) => !env[key] || env[key].trim() === "");

  if (missingKeys.length === 0) {
    return "PostgreSQL connection status: required environment variables are present.";
  }

  return `PostgreSQL connection status: missing ${missingKeys.join(", ")}.`;
}

async function ensureLogFile(): Promise<void> {
  const logDir = path.join(app.getPath("userData"), "logs");
  logFilePath = path.join(logDir, "electron-startup.log");
  await fs.promises.mkdir(logDir, { recursive: true });
}

async function appendLog(message: string): Promise<void> {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  try {
    await fs.promises.appendFile(logFilePath, entry, "utf8");
  } catch {
    // Do not block startup for log failures.
  }
}

function spawnBackend(serverPath: string, extraEnv: NodeJS.ProcessEnv = {}): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    try {
     const nodeExecutable = "node";

const child = spawn(nodeExecutable, [serverPath], {
  cwd: path.dirname(serverPath),
  windowsHide: true,
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    ...extraEnv,
    ...loadEnvironment().env,
    NODE_ENV: "production",
    PORT: String(PORT),
  }
});

        // Capture stdout for debugging
        if (child.stdout) {
          child.stdout.on("data", async (chunk: Buffer) => {
            const text = chunk.toString("utf8");
            await appendLog(`Backend stdout: ${text}`);
          });
        }

        // Capture stderr for debugging
        if (child.stderr) {
          child.stderr.on("data", async (chunk: Buffer) => {
            const text = chunk.toString("utf8");
            await appendLog(`Backend stderr: ${text}`);
          });
        }

        child.on("error", async (error) => {
          await appendLog(`Backend process error: ${error.message}`);
          reject(error);
        });

        child.on("exit", async (code, signal) => {
  await appendLog(
    `Backend exited. cwd=${path.dirname(serverPath)} code=${code} signal=${signal}`
  );
});
        resolve(child);
      } catch (error) {
        reject(error);
      }
  });
}

function checkServerHealth(): Promise<number | null> {
  return new Promise((resolve) => {
    const request = http.get(`${SERVER_URL}${HEALTH_PATH}`, (response) => {
      response.on("data", () => {
        // consume body if any
      });
      resolve(response.statusCode ?? null);
    });

    request.on("error", () => resolve(null));
    request.setTimeout(2000, () => {
      request.destroy();
      resolve(null);
    });
  });
}

async function waitForServerReady(): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < HEALTH_CHECK_TIMEOUT_MS) {
    if (serverProcess && serverProcess.killed) {
      throw new Error("Backend process was killed before health checks succeeded.");
    }

    const statusCode = await checkServerHealth();
    const healthy = statusCode === 200;
    await appendLog(`Health check result: ${healthy ? "OK" : "NOT OK"} (status=${statusCode ?? "none"})`);

    if (healthy) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, HEALTH_CHECK_RETRY_MS));
  }

  throw new Error(`Backend did not become ready within ${HEALTH_CHECK_TIMEOUT_MS / 1000} seconds.`);
}

async function startBackendServer(): Promise<void> {
  const backendPath = getBackendServerPath();
  await appendLog(`Backend path: ${backendPath}`);
  await appendLog(`app.getAppPath(): ${app.getAppPath()}`);
  await appendLog(`process.resourcesPath: ${process.resourcesPath}`);
  await appendLog(`Backend path exists: ${fs.existsSync(backendPath)}`);

  if (!fs.existsSync(backendPath)) {
    throw new Error(`Backend executable not found at ${backendPath}`);
  }

  const loadedEnv = loadEnvironment();
  const effectiveEnv = { ...process.env, ...loadedEnv.env };
  if (loadedEnv.source) {
    Object.assign(process.env, loadedEnv.env);
  }

  await appendLog(`Env loaded source: ${loadedEnv.source ?? "none"}${loadedEnv.filePath ? ` (${loadedEnv.filePath})` : ""}`);
  await appendLog(getPostgresEnvStatus(effectiveEnv));

  const existingStatus = await checkServerHealth();
  if (existingStatus === 200) {
    await appendLog(`Backend already running on ${SERVER_URL}`);
    return;
  }

  if (serverProcess && !serverProcess.killed) {
    await appendLog(`Backend process already started pid=${serverProcess.pid}`);
    return;
  }

  serverProcess = await spawnBackend(backendPath, loadedEnv.env);
  await appendLog(`Backend process started pid=${serverProcess.pid}`);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "AWM AI SOC SENIOR - Enterprise Security Platform",
    backgroundColor: "#0B1220",
    show: false,
    icon: path.join(__dirname, "../public/favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.on("did-fail-load", async (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame) {
      await appendLog(`Dashboard failed to load: ${errorCode} ${errorDescription} ${validatedURL}`);
      showStartupError(`Dashboard failed to load from ${SERVER_URL}.\n${errorDescription} (${errorCode})`);
    }
  });

  mainWindow.loadURL(SERVER_URL).catch(async (error) => {
    await appendLog(`loadURL failed: ${String(error)}`);
    showStartupError(`Unable to load the dashboard from ${SERVER_URL}.\n${String(error)}`);
  });
}

function createTray(): void {
  try {
    const iconPath = path.join(__dirname, "../public/favicon.ico");
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      { label: "AWM AI SOC SENIOR - Running", enabled: false },
      { type: "separator" },
      {
        label: "Open SOC Dashboard",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        },
      },
      {
        label: "Check Windows Service Status",
        click: async () => {
          const statusCode = await checkServerHealth();
          new Notification({
            title: "AWM Service Status",
            body: statusCode === 200 ? "AWM AI SOC Senior Engine is running smoothly." : "Service unreachable on port 3000.",
          }).show();
        },
      },
      { type: "separator" },
      {
        label: "Exit Client",
        click: () => {
          app.quit();
        },
      },
    ]);

    tray.setToolTip("AWM AI SOC SENIOR Engine");
    tray.setContextMenu(contextMenu);
  } catch (err) {
    appendLog(`Could not create tray icon: ${String(err)}`);
  }
}

function showStartupError(message: string): void {
  appendLog(`Startup error: ${message}`);
  dialog.showErrorBox("AWM AI SOC SENIOR Startup Error", message);
}
app.whenReady().then(async () => {
await ensureLogFile();
await appendLog("App startup");
await appendLog(`Node path check: ${process.env.PATH}`);

try {
    await startBackendServer();
    await waitForServerReady();
    await appendLog("Backend health check passed");
    createWindow();
    createTray();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showStartupError(`Failed to start backend server. ${message}`);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  if (serverProcess && !serverProcess.killed) {
    try {
      serverProcess.kill();
    } catch {
      // ignore kill failures.
    }
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("get-app-version", () => "1.0.0 Enterprise");
ipcMain.handle("check-service-status", async () => {
  return (await checkServerHealth()) === 200 ? "Running" : "Stopped";
});
