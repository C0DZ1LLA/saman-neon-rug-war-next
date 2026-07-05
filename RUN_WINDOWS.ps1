$ErrorActionPreference = "Stop"
Write-Host "=== Saman Neon Rug War Next ===" -ForegroundColor Cyan
Write-Host "Project: $PSScriptRoot" -ForegroundColor DarkCyan
Set-Location $PSScriptRoot

if (-not (Test-Path ".\node_modules")) {
  Write-Host "Installing dependencies..." -ForegroundColor Yellow
  npm install
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Select-Object -First 1 -ExpandProperty IPAddress)

Write-Host ""
Write-Host "PC URL:     http://localhost:3000" -ForegroundColor Green
if ($ip) { Write-Host "Phone URL:  http://$ip`:3000" -ForegroundColor Green }
Write-Host ""
Write-Host "Phone and PC must be on the same Wi-Fi/network." -ForegroundColor DarkYellow
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

npm run dev
