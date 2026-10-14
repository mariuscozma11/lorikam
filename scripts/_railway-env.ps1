<#
  Dot-source this before calling the Railway CLI. Sets $env:_ and returns the
  path to the real railway.exe.

  Why this exists - a Windows bug in the `railway` npm SDK:

  .railway/railway.ts imports `railway/iac`, and that module refuses to load
  unless it can confirm the CLI is >= 5.42.1. It checks by running
  `execFileSync(process.env._ || "railway", ["--version"])`. On Windows
  `process.env._` is unset (it is a POSIX shell convention), so it falls back to
  the bare name "railway" - which resolves to railway.cmd / railway.ps1, not an
  executable. execFileSync does not do shell or PATHEXT resolution, so the probe
  throws, and the SDK misreports a perfectly current CLI as too old:

    Error: This version of railway/iac requires Railway CLI 5.42.1 or newer.

  Pointing $env:_ at the actual .exe makes the probe succeed.
#>

$ErrorActionPreference = 'Stop'

$command = Get-Command railway -ErrorAction SilentlyContinue
if (-not $command) {
  throw "Railway CLI not found. Install it with:  npm install -g @railway/cli"
}

$exe = $command.Source

# Walk from the npm shim to the binary it wraps.
if ($exe -notmatch '\.exe$') {
  $candidate = Join-Path (Split-Path -Parent $exe) 'node_modules\@railway\cli\bin\railway.exe'
  if (Test-Path $candidate) {
    $exe = (Resolve-Path $candidate).Path
  }
}

$env:_ = $exe
$exe
