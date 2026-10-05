; Codryn Desktop — Inno Setup script (Windows, per-user).
;
; Mirrors the Linux packaging style (packaging/nfpm.yaml):
;   `wails build` produces a plain binary, this script wraps it
;   into a Start Menu installer. No Wails `-nsis` involved.
;
; Build from the repo root (Codryn-Desktop/).
; The MIT license page is generated from ..\..\LICENSE (Inno requires a
; .txt/.rtf extension and ours is extensionless):
;   $t = ((Get-Content -Raw LICENSE) -replace '(?<!\r)\n', "`r`n").TrimEnd("`r","`n") + "`r`n"
;   Set-Content packaging\windows\LICENSE.txt $t -Encoding ascii -NoNewline
; Dev (fallback 0.0.0-dev, no env needed):
;   wails build
;   <generate LICENSE.txt as above>
;   iscc packaging\windows\codryn.iss
; Release (single version source, leading "v" stripped by internal/version):
;   $env:CODRYN_VERSION = 'v1.2.3'
;   go run ./packaging/tools/version --sync-wails-json
;   wails build
;   $ver = go run ./packaging/tools/version
;   <generate LICENSE.txt as above>
;   iscc /DAppVersion=$ver packaging\windows\codryn.iss
; AppVersion defaults to 0.0.0-dev for local builds.
;
; Silent install (for a future install.ps1 backend installer):
;   codryn-desktop-<ver>-setup-windows-amd64.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /LOG="%TEMP%\codryn-install.log"
; Use /SILENT instead of /VERYSILENT to show progress. /DIR="..." overrides the install folder.

#ifndef AppVersion
  #define AppVersion "0.0.0-dev"
#endif

; LICENSE.txt is generated at build time from ..\..\LICENSE (see above).
; Guarded so local builds without it still compile, just without a license page.
#if FileExists(SourcePath + "LICENSE.txt")
  #define HasLicenseFile
#endif

[Setup]
AppId={{A51FA20A-D89A-46E6-9576-ABDF2D861D4D}
AppName=Codryn
AppVerName=Codryn {#AppVersion}
AppVersion={#AppVersion}
AppPublisher=Codryn
DefaultDirName={autopf}\Codryn
DefaultGroupName=Codryn
PrivilegesRequired=lowest
MinVersion=10.0
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
WizardStyle=modern
Compression=lzma2/max
SolidCompression=yes
CloseApplications=yes
OutputDir=..\..\build\bin
OutputBaseFilename=codryn-desktop-{#AppVersion}-setup-windows-amd64
SetupIconFile=..\..\build\windows\icon.ico
UninstallDisplayIcon={app}\codryn-desktop.exe
UninstallDisplayName=Codryn
#ifdef HasLicenseFile
LicenseFile=LICENSE.txt
#endif

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\..\build\bin\codryn-desktop.exe"; DestDir: "{app}"; Flags: ignoreversion

; Start Menu only — no desktop icon on purpose (same choice as the Linux .deb).
[Icons]
Name: "{userprograms}\Codryn\Codryn"; Filename: "{app}\codryn-desktop.exe"
Name: "{userprograms}\Codryn\Uninstall Codryn"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\codryn-desktop.exe"; Description: "{cm:LaunchProgram,Codryn}"; Flags: nowait postinstall skipifsilent

[Code]
const
  WebView2ClientStateID = '{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';
  WebView2DownloadUrl = 'https://go.microsoft.com/fwlink/p/?LinkId=2124703';

function IsWebView2Installed(): Boolean;
begin
  Result :=
    RegValueExists(HKLM, 'SOFTWARE\Microsoft\EdgeUpdate\ClientState\' + WebView2ClientStateID, 'pv') or
    RegValueExists(HKCU, 'SOFTWARE\Microsoft\EdgeUpdate\ClientState\' + WebView2ClientStateID, 'pv') or
    RegValueExists(HKLM, 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\ClientState\' + WebView2ClientStateID, 'pv');
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  Msg: String;
begin
  if CurStep = ssPostInstall then
  begin
    if not IsWebView2Installed() then
    begin
      Msg := 'WebView2 Runtime was not detected.' + #13#10 + #13#10 +
        'Codryn was installed successfully, but it will not run until you install WebView2 manually:' + #13#10 +
        WebView2DownloadUrl;
      if WizardSilent() then
        { Silent (/SILENT or /VERYSILENT) installs must not block on a dialog,
          so the future install.ps1 backend never hangs. The warning goes to
          the /LOG= file instead; install.ps1 should surface it to the user. }
        Log('WARNING: ' + Msg)
      else
        MsgBox(Msg, mbInformation, MB_OK);
    end;
  end;
end;
