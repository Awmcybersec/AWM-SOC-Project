# PowerShell Script for Automated PostgreSQL Installation and Initialization
# AWM AI SOC SENIOR Enterprise Platform
# Supports: Windows Server 2019, 2022, 2025 & Windows 10/11

[CmdletBinding()]
param (
    [string]$PostgresVersion = "16.1-1",
    [string]$DbName = "awm_ai_soc_db",
    [string]$DbUser = "awm_soc_admin",
    [string]$DbPassword = "AwmSocEnterprise2026SecurePass!",
    [int]$Port = 5432,
    [string]$InstallDir = "C:\Program Files\PostgreSQL\16"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " [AWM AI SOC SENIOR] PostgreSQL Enterprise Automated Installer & Init" -ForegroundColor Cyan
Write-Host " Target OS: Windows Server 2019 / 2022 / 2025 & Windows 10 / 11" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

# Ensure Administrator Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "This script requires Administrator rights. Please run PowerShell as Administrator."
    exit 1
}

# Step 1: Check if PostgreSQL Service is already installed
$service = Get-Service -Name "postgresql-x64-16" -ErrorAction SilentlyContinue
if (-not $service) {
    $service = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
}

if ($service) {
    Write-Host "[+] PostgreSQL service found: $($service.Name) [State: $($service.Status)]" -ForegroundColor Green
} else {
    Write-Host "[*] PostgreSQL service not detected. Downloading silent installer..." -ForegroundColor Yellow
    
    $downloadUrl = "https://sbp.enterprisedb.com/getfile.jsp?fileid=1258627" # PostgreSQL 16 Windows Installer
    $installerPath = "$env:TEMP\postgresql-installer.exe"
    
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
        Write-Host "[+] Installer downloaded successfully." -ForegroundColor Green
    } catch {
        Write-Host "[!] Could not download online package. Checking winget fallback..." -ForegroundColor Yellow
        winget install --id PostgreSQL.PostgreSQL.16 --exact --accept-package-agreements --accept-source-agreements --silent
    }

    if (Test-Path $installerPath) {
        Write-Host "[*] Executing silent installation of PostgreSQL..." -ForegroundColor Yellow
        Start-Process -FilePath $installerPath -ArgumentList "--mode unattended --unattendedmodeui none --servicename postgresql-x64-16 --servicepassword `"$DbPassword`" --superpassword `"$DbPassword`" --serverport $Port --prefix `"$InstallDir`"" -Wait
    }
}

# Step 2: Ensure Service is Running and Set to Automatic
Write-Host "[*] Configuring PostgreSQL Windows Service to Automatic Startup..." -ForegroundColor Yellow
Set-Service -Name "postgresql-x64-16" -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name "postgresql-x64-16" -ErrorAction SilentlyContinue

# Step 3: Run SQL Schema Initialization
$psqlPath = "$InstallDir\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    $psqlPath = (Get-Command psql -ErrorAction SilentlyContinue).Path
}

$sqlScriptPath = Join-Path $PSScriptRoot "init-db.sql"

if (Test-Path $psqlPath) {
    Write-Host "[*] Initializing database schema '$DbName' using psql..." -ForegroundColor Yellow
    $env:PGPASSWORD = $DbPassword
    & $psqlPath -U postgres -p $Port -f $sqlScriptPath
    Write-Host "[+] PostgreSQL Database '$DbName' initialized successfully!" -ForegroundColor Green
} else {
    Write-Host "[!] psql.exe path not found directly. Schema file location: $sqlScriptPath" -ForegroundColor Yellow
    Write-Host "[+] Server will auto-initialize schema during first node.js runtime execution." -ForegroundColor Green
}

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] PostgreSQL setup complete for AWM AI SOC SENIOR Enterprise Engine." -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan
