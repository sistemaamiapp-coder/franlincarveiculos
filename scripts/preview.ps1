#Requires -Version 5.1
<#
.SYNOPSIS
Serve a raiz do Franlin Car Veículos em http://127.0.0.1:8080.
.DESCRIPTION
Requer Python no PATH. Este script não instala programas.
#>

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

$python = Get-Command python -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $python) {
    [Console]::Error.WriteLine('Python não encontrado no PATH. Instale o Python separadamente ou use outro servidor HTTP. Este script não faz instalações.')
    exit 1
}

$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
    Write-Host 'Franlin Car Veículos disponível em http://127.0.0.1:8080'
    Write-Host 'Pressione Ctrl+C para encerrar.'
    & $python.Source -m http.server 8080 --bind 127.0.0.1
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
