<#
.SYNOPSIS
  Railway CLI passthrough that works on Windows.

.DESCRIPTION
  Forwards every argument to the real railway.exe with $env:_ set, which the
  `railway/iac` SDK needs in order to detect the CLI version (see
  scripts/_railway-env.ps1 for the details).

  The npm scripts in package.json all go through this. Plain `railway ...` still
  works for anything that does not evaluate .railway/railway.ts - only the IaC
  commands (`config plan`, `config apply`, `config pull`) need the fix.

.EXAMPLE
  .\scripts\railway.ps1 config plan --verbose
#>

$ErrorActionPreference = 'Stop'
$exe = & (Join-Path $PSScriptRoot '_railway-env.ps1')

& $exe @args
exit $LASTEXITCODE
