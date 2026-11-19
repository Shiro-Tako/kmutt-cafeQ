$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$localDirectory = Join-Path $projectRoot '.local'
if (Test-Path -LiteralPath $localDirectory) {
  New-Item -ItemType File -Force -Path (Join-Path $localDirectory 'stop-server') | Out-Null
  Write-Host 'Requested shutdown of CafeQ, tunnel, and MySQL.'
}
