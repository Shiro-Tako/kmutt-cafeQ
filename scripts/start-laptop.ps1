$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
npm.cmd --prefix frontend run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node.exe scripts/start-laptop.mjs @args
