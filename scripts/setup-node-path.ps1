# setup-node-path.ps1
#
# Ensures the Node.js installation (extracted portable zip) is on the User PATH
# so node, npm, and npx resolve by name in any new terminal.
#
# Node was extracted to:
#   C:\Users\stacy\nodejs\node-v26.13.0-win-x64\   (node.exe, npm, npx live here)
#
# Usage (run in PowerShell):
#   .\scripts\setup-node-path.ps1
# or, if execution policy blocks it:
#   powershell -ExecutionPolicy Bypass -File .\scripts\setup-node-path.ps1
#
# IMPORTANT: User PATH changes only affect NEW processes. After running this,
# close and reopen your terminal, then verify with:  node --version  npm --version  npx --version

$ErrorActionPreference = 'Stop'

$nodeBin = 'C:\Users\stacy\nodejs\node-v26.13.0-win-x64'
$nodeExe = Join-Path $nodeBin 'node.exe'

Write-Host '=== MediFind AI - Node PATH setup ===' -ForegroundColor Cyan
Write-Host ''

# 1. Confirm node.exe exists at the expected location
if (-not (Test-Path $nodeExe)) {
    Write-Error "node.exe not found at: $nodeExe`n  (Did you extract to a different folder version?)"
    exit 1
}
Write-Host "Found node.exe: $nodeExe" -ForegroundColor Green

# 2. Report node version via full path (works regardless of PATH)
$nodeVer = & $nodeExe --version 2>&1
Write-Host "node version (full path): $nodeVer" -ForegroundColor Green

# 3. Read current User PATH from registry
$userPath = [Environment]::GetEnvironmentVariable('PATH', 'User')

if ($null -eq $userPath) {
    Write-Host 'User PATH not set yet; creating it...' -ForegroundColor Yellow
    $newPath = $nodeBin
} elseif ($userPath -split ';' | Where-Object { $_ -eq $nodeBin }) {
    Write-Host "User PATH already contains: $nodeBin" -ForegroundColor Green
    $newPath = $null
} else {
    Write-Host "Adding to User PATH: $nodeBin" -ForegroundColor Yellow
    $newPath = $userPath + ';' + $nodeBin
}

# 4. Persist to User PATH via .NET (takes effect in new terminals)
if ($null -ne $newPath) {
    [Environment]::SetEnvironmentVariable('PATH', $newPath, 'User')
    Write-Host 'User PATH saved (registry).' -ForegroundColor Green
}

# 5. Verify registry now contains the node bin
$verify = [Environment]::GetEnvironmentVariable('PATH', 'User')
if ($verify -split ';' | Where-Object { $_ -eq $nodeBin }) {
    Write-Host "VERIFIED: User PATH in registry contains $nodeBin" -ForegroundColor Green
} else {
    Write-Error "VERIFICATION FAILED: $nodeBin not found in User PATH registry."
    exit 1
}

Write-Host ''
Write-Host '=== NEXT STEP ===' -ForegroundColor Cyan
Write-Host 'Close this terminal and open a NEW one, then run:'
Write-Host '  node --version'
Write-Host '  npm --version'
Write-Host '  npx --version'
Write-Host ''
Write-Host 'All should resolve by name (no full path needed).' -ForegroundColor Green
