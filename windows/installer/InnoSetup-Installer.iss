; ============================================================================
; AWM AI SOC SENIOR - Enterprise Inno Setup Compiler Script (.iss)
; Supports: Windows Server 2019 / 2022 / 2025 & Windows 10 / 11 (x64)
; ============================================================================

#define MyAppName "AWM AI SOC SENIOR"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "AWM AI Cyber Security Corp"
#define MyAppURL "https://awm-ai-soc-senior.internal"
#define MyAppExeName "AWM AI SOC SENIOR.exe"
#define MyServiceName "AWMAISOCSeniorEngine"

[Setup]
AppId={{2A98C71F-5E1B-4E90-B8B7-9102A6F10992}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\AWM-AI-SOC-SENIOR
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=..\..\WINDOWS_DEPLOYMENT_GUIDE.md
OutputDir=..\..\dist-installer
OutputBaseFilename=AWM-AI-SOC-SENIOR-Setup
SetupIconFile=..\..\public\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "installservice"; Description: "Install and Start AWM AI SOC Senior Engine Windows Service (Recommended)"; GroupDescription: "Windows Service Configuration:"; Flags: checked
Name: "initpostgres"; Description: "Initialize Local PostgreSQL Enterprise Database (awm_ai_soc_db)"; GroupDescription: "Database Setup:"; Flags: checked

[Files]
; Server CJS Bundle & Node Executable
Source: "..\..\dist\server.cjs"; DestDir: "{app}\dist"; Flags: ignoreversion
Source: "..\..\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\config\*"; DestDir: "{app}\config"; Flags: ignoreversion recursesubdirs
Source: "..\..\windows\*"; DestDir: "{app}\windows"; Flags: ignoreversion recursesubdirs
Source: "..\..\dist-electron\*"; DestDir: "{app}\dist-electron"; Flags: ignoreversion recursesubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\dist-electron\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\dist-electron\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Step 1: Run PostgreSQL Silent Installation and Schema Creation
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\windows\scripts\Init-PostgreSQL.ps1"" -DbName awm_ai_soc_db"; Tasks: initpostgres; Flags: runhidden waituntilterminated

; Step 2: Register & Launch Windows Service
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\windows\scripts\Install-Service.ps1"""; Tasks: installservice; Flags: runhidden waituntilterminated

; Step 3: Launch Desktop Client App after completion
Filename: "{app}\dist-electron\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Step 1: Stop and Remove Windows Service
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\windows\scripts\Uninstall-Service.ps1"""; Flags: runhidden waituntilterminated

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    Log('AWM AI SOC SENIOR Enterprise Installation completed successfully.');
  end;
end;
