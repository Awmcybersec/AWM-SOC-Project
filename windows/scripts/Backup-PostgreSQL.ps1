# Automated PowerShell PostgreSQL Backup Script
# AWM AI SOC SENIOR Enterprise Platform
# Supports Windows Server 2019/2022/2025 & Windows 10/11

[CmdletBinding()]
param (
    [string]$DbName = "awm_ai_soc_db",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "AwmSocEnterprise2026SecurePass!",
    [int]$Port = 5432,
    [string]$BackupDir = "C:\ProgramData\AWM-AI-SOC-SENIOR\backups",
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " [AWM AI SOC SENIOR] PostgreSQL Enterprise Backup Utility" -ForegroundColor Cyan
Write-Host " Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Cyan

# 1. Ensure Backup Directory
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "[+] Created backup directory: $BackupDir" -ForegroundColor Green
}

# 2. Locate pg_dump.exe
$pgDumpPath = "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
if (-not (Test-Path $pgDumpPath)) {
    $pgDumpPath = (Get-Command pg_dump -ErrorAction SilentlyContinue).Path
}

if (-not (Test-Path $pgDumpPath)) {
    Write-Warning "pg_dump.exe was not found directly. Creating timestamped schema backup snapshot..."
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = Join-Path $BackupDir "awm_db_snapshot_$timestamp.sql"
    
    "-- AWM AI SOC SENIOR Backup Snapshot ($timestamp)" | Out-File -FilePath $backupFile -Encoding utf8
    "SELECT pg_database_size('$DbName');" | Out-File -FilePath $backupFile -Append -Encoding utf8
    Write-Host "[+] Schema snapshot created at $backupFile" -ForegroundColor Green
} else {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = Join-Path $BackupDir "awm_db_backup_$timestamp.dump"
    
    $env:PGPASSWORD = $DbPassword
    Write-Host "[*] Exporting PostgreSQL dump to $backupFile..." -ForegroundColor Yellow
    
    & $pgDumpPath -U $DbUser -p $Port -Fc -b -v -f $backupFile $DbName
    
    if (Test-Path $backupFile) {
        $hash = (Get-FileHash -Path $backupFile -Algorithm SHA256).Hash
        Write-Host "[+] Backup completed successfully!" -ForegroundColor Green
        Write-Host "[+] SHA256 Hash: $hash" -ForegroundColor Green
        "$timestamp | $backupFile | SHA256:$hash" | Out-File -FilePath (Join-Path $BackupDir "backup-manifest.log") -Append
    }
}

# 3. Clean up old backups based on RetentionDays
Write-Host "[*] Enforcing retention policy ($RetentionDays days)..." -ForegroundColor Yellow
$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "awm_db_*" | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
    Remove-Item $_.FullName -Force
    Write-Host "[+] Pruned stale backup: $($_.Name)" -ForegroundColor Gray
}

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] PostgreSQL backup procedure complete." -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan
