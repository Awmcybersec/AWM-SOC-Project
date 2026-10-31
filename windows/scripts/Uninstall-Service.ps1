# PowerShell Script to Uninstall "AWM AI SOC Senior Engine" Windows Service
# Supports Windows Server 2019 / 2022 / 2025 & Windows 10 / 11

[CmdletBinding()]
param (
    [string]$ServiceName = "AWMAISOCSeniorEngine",
    [string]$DisplayName = "AWM AI SOC Senior Engine"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " [AWM AI SOC SENIOR] Windows Service Uninstaller" -ForegroundColor Cyan
Write-Host " Target Service Name: $DisplayName" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

# Require Administrator Rights
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Administrator privileges are required to uninstall Windows Services. Please run PowerShell as Administrator."
    exit 1
}

$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "[!] Service '$ServiceName' is not installed." -ForegroundColor Yellow
    exit 0
}

Write-Host "[*] Stopping service '$ServiceName'..." -ForegroundColor Yellow
if ($service.Status -ne "Stopped") {
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "[*] Deleting Windows Service registration..." -ForegroundColor Yellow
$res = Start-Process -FilePath "sc.exe" -ArgumentList "delete", $ServiceName -NoNewWindow -Wait -PassThru

if ($res.ExitCode -eq 0) {
    Write-Host "[+] Service '$ServiceName' successfully removed." -ForegroundColor Green
} else {
    Remove-Service -Name $ServiceName -ErrorAction SilentlyContinue
}

# Remove Firewall Rule
Write-Host "[*] Cleaning up Windows Firewall rules..." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "AWM AI SOC Senior Engine (Port 3000)" -ErrorAction SilentlyContinue

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] Uninstallation completed successfully." -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan
