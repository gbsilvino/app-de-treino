/**
 * create-shortcut.js
 * Generates a Windows .lnk shortcut on the Desktop that launches this
 * Electron app directly from the project folder (development mode).
 *
 * Usage:  node create-shortcut.js
 * npm:    npm run shortcut
 */

'use strict';

const { execFileSync } = require('child_process');
const fs   = require('fs');
const os   = require('os');
const path = require('path');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const projectDir  = __dirname;
const electronExe = path.join(projectDir, 'node_modules', 'electron', 'dist', 'electron.exe');
const desktopDir  = path.join(os.homedir(), 'Desktop');
const shortcutPath = path.join(desktopDir, 'GSPro Treinos.lnk');

// Prefer a project icon; fall back to the Electron default
const iconCandidates = ['icon.ico', 'assets/icon.ico', 'build/icon.ico'];
const iconPath = iconCandidates
  .map(p => path.join(projectDir, p))
  .find(p => fs.existsSync(p)) || electronExe;

// ---------------------------------------------------------------------------
// Validate pre-requisites
// ---------------------------------------------------------------------------

if (!fs.existsSync(electronExe)) {
  console.error(`[create-shortcut] Electron executable not found at:\n  ${electronExe}`);
  console.error('Run "npm install" first, then try again.');
  process.exit(1);
}

if (!fs.existsSync(desktopDir)) {
  console.error(`[create-shortcut] Desktop folder not found: ${desktopDir}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Build and run a PowerShell script (avoids all shell-escaping headaches)
// ---------------------------------------------------------------------------

const psScript = `
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut('${shortcutPath.replace(/'/g, "''")}')
$sc.TargetPath      = '${electronExe.replace(/'/g, "''")}'
$sc.Arguments       = '.'
$sc.WorkingDirectory = '${projectDir.replace(/'/g, "''")}'
$sc.IconLocation    = '${iconPath.replace(/'/g, "''")} ,0'
$sc.Description     = 'GSPro Treinos'
$sc.Save()
Write-Host '[create-shortcut] Shortcut created at: ${shortcutPath.replace(/'/g, "''")}'
`.trim();

const tmpScript = path.join(os.tmpdir(), 'gspro-create-shortcut.ps1');

try {
  fs.writeFileSync(tmpScript, psScript, { encoding: 'utf8' });

  execFileSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tmpScript],
    { stdio: 'inherit' }
  );
} catch (err) {
  console.error('[create-shortcut] Failed to create shortcut:', err.message);
  process.exit(1);
} finally {
  try { fs.unlinkSync(tmpScript); } catch (_) { /* ignore */ }
}
