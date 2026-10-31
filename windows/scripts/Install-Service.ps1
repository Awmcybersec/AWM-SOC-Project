# PowerShell Script to Install "AWM AI SOC Senior Engine" as a Windows Service
# Supports Windows Server 2019 / 2022 / 2025 & Windows 10 / 11

[CmdletBinding()]
param (
    [string]$ServiceName = "AWMAISOCSeniorEngine",
    [string]$DisplayName = "AWM AI SOC Senior Engine",
    [string]$Description = "Enterprise Autonomous AI Security Operations Center Engine Service.",
    [string]$Port = "3000",
    [string]$LogDir = "C:\ProgramData\AWM-AI-SOC-SENIOR\logs"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " [AWM AI SOC SENIOR] Windows Service Automated Installer" -ForegroundColor Cyan
Write-Host " Target Service Name: $DisplayName" -ForegroundColor Cyan
Write-Host " Target OS: Windows Server 2019/2022/2025 & Windows 10/11" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

# 1. Require Administrator Rights
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Administrator privileges are required to install Windows Services. Please run PowerShell as Administrator."
    exit 1
}

# 2. Ensure Log & Config Directories Exist
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    Write-Host "[+] Created log directory: $LogDir" -ForegroundColor Green
}

# 3. Locate Node.js & Server Executable
$appRoot = Resolve-Path "$PSScriptRoot\..\.."
$serverCjs = Join-Path $appRoot "dist\server.cjs"

if (-not (Test-Path $serverCjs)) {
    Write-Host "[*] Building server production bundle (dist/server.cjs)..." -ForegroundColor Yellow
    Push-Location $appRoot
    npm run build
    Pop-Location
}

$nodePath = (Get-Command node.exe -ErrorAction SilentlyContinue).Path
if (-not $nodePath) {
    $nodePath = "C:\Program Files\nodejs\node.exe"
}

if (-not (Test-Path $nodePath)) {
    Write-Error "Node.exe was not found. Please install Node.js v18+ on this Windows machine."
    exit 1
}

# 4. Check if service already exists
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[*] Service '$ServiceName' already exists. Stopping and re-configuring..." -ForegroundColor Yellow
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $ServiceName | Out-Null
    Start-Sleep -Seconds 2
}

# 5. Register Service via Service Control Manager (sc.exe or nssm / WinSW)
Write-Host "[*] Registering automatic Windows Service '$DisplayName'..." -ForegroundColor Yellow

$binPath = "`"$nodePath`" `"$serverCjs`""

# Use sc.exe to create the service
$scArgs = @(
    "create", $ServiceName,
    "binPath=", $binPath,
    "displayName=", "`"$DisplayName`"",
    "start=", "auto",
    "obj=", "LocalSystem"
)

$res = Start-Process -FilePath "sc.exe" -ArgumentList $scArgs -NoNewWindow -Wait -PassThru
if ($res.ExitCode -eq 0) {
    Write-Host "[+] Service '$ServiceName' successfully created." -ForegroundColor Green
} else {
    Write-Host "[!] SC.exe returned code $($res.ExitCode). Fallback to WinSW / PowerShell Service Registration." -ForegroundColor Yellow
    New-Service -Name $ServiceName -BinaryPathName $binPath -DisplayName $DisplayName -Description $Description -StartupType Automatic
}

# 6. Set Description & Recovery Actions
sc.exe description $ServiceName $Description | Out-Null
sc.exe failure $ServiceName reset= 86400 actions= restart/10000/restart/30000/restart/60000 | Out-Null

# 7. Add Windows Defender Firewall Exception for Port 3000
Write-Host "[*] Configuring Windows Defender Firewall Rule for Port $Port..." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "AWM AI SOC Senior Engine (Port $Port)" -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "AWM AI SOC Senior Engine (Port $Port)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -Profile Any | Out-Null
Write-Host "[+] Inbound Firewall rule added for Port $Port." -ForegroundColor Green

# 8. Start Service
Write-Host "[*] Starting Windows Service '$ServiceName'..." -ForegroundColor Yellow
Start-Service -Name $ServiceName

$finalService = Get-Service -Name $ServiceName
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] Windows Service is now $($finalService.Status)!" -ForegroundColor Green
Write-Host " Service Name: $($finalService.Name)" -ForegroundColor Green
Write-Host " Log Directory: $LogDir" -ForegroundColor Green
Write-Host " Web SOC Dashboard: http://localhost:$Port" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan
