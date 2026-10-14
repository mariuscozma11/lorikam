<#
.SYNOPSIS
  One-time Railway bootstrap for the Lorikam backend.

.DESCRIPTION
  Creates (or links) the Railway project, applies .railway/railway.ts, adds the
  custom domain, then fills in the secrets that deliberately are not in git.

  Safe to re-run: the project is only created when nothing is linked, the domain
  only when it is missing, and each secret only when it has no value (pass
  -Force to overwrite).

  Ordering matters and is the whole reason this script exists. `config apply`
  creates the service, but secrets can only be set on a service that already
  exists - and Medusa refuses to boot in production without JWT_SECRET /
  COOKIE_SECRET (see medusa-config.ts). So the first deploy is expected to fail
  for a minute until step 5 lands and redeploys.

.PARAMETER Force
  Overwrite secrets that already have a value in Railway.

.PARAMETER SkipApply
  Only reconcile domain + secrets; do not touch infrastructure.

.PARAMETER Yes
  Apply without the confirmation prompt. For scripted or agent-driven runs;
  review `npm run plan` first.

.EXAMPLE
  npm run bootstrap
  .\scripts\railway-bootstrap.ps1 -Force
#>
[CmdletBinding()]
param(
  [switch]$Force,
  [switch]$SkipApply,
  [switch]$Yes
)

$ErrorActionPreference = 'Stop'
$service = 'backend'
$domain = 'api.lorikam.ro'
$port = 9000
$repoRoot = Split-Path -Parent $PSScriptRoot

function Step { param($m) Write-Host "`n=== $m" -ForegroundColor Cyan }
function Ok   { param($m) Write-Host "  ok  $m" -ForegroundColor Green }
function Warn { param($m) Write-Host "  !   $m" -ForegroundColor Yellow }

# A URL-safe 48-byte secret. Medusa puts these in JWTs and cookies, so base64's
# '+' and '/' are swapped out to keep them header- and cookie-clean.
function New-Secret {
  $bytes = [byte[]]::new(48)
  # ::Create().GetBytes() rather than ::Fill() - Fill is .NET Core only, and
  # Windows PowerShell 5.1 runs on .NET Framework ("does not contain a method
  # named 'Fill'").
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  [Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')
}

Set-Location $repoRoot

# --- 1. Preconditions ----------------------------------------------------
Step '1/6  Checking the Railway CLI'

# Also sets $env:_, without which `config apply` cannot load railway/iac on
# Windows. See scripts/_railway-env.ps1.
$rw = & (Join-Path $PSScriptRoot '_railway-env.ps1')
Ok "$(& $rw --version)  ($rw)"

if (-not (Test-Path (Join-Path $repoRoot 'node_modules/railway'))) {
  Warn 'railway SDK missing - installing (required to evaluate .railway/railway.ts).'
  npm install
  if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' }
}

& $rw whoami | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Not logged in. Run  railway login  (opens a browser), then re-run this script."
}
Ok (& $rw whoami)

# --- 2. Project ----------------------------------------------------------
Step '2/6  Linking the Railway project'
& $rw status --json 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Warn 'No project linked to this directory - creating "lorikam".'
  & $rw init --name lorikam
  if ($LASTEXITCODE -ne 0) { throw 'railway init failed.' }
  Ok 'Project created and linked.'
} else {
  Ok 'Project already linked (no new project created).'
}

# --- 3. Infrastructure ---------------------------------------------------
if (-not $SkipApply) {
  Step '3/6  Applying .railway/railway.ts (Postgres, Redis, volume, backend)'
  Write-Host '      Railway prints the plan and asks before changing anything.'
  if ($Yes) { & $rw config apply --yes } else { & $rw config apply }
  if ($LASTEXITCODE -ne 0) { throw 'railway config apply failed - nothing was changed.' }
  Ok 'Infrastructure applied.'
} else {
  Step '3/6  Skipping infrastructure (-SkipApply)'
}

# --- 4. Custom domain ----------------------------------------------------
# Not in railway.ts: Railway rejects custom-domain registration from IaC.
Step "4/6  Custom domain $domain"
$domainList = & $rw domain list --service $service 2>&1 | Out-String
if ($domainList -match [regex]::Escape($domain)) {
  Ok "$domain already registered."
} else {
  & $rw domain $domain --service $service --port $port
  if ($LASTEXITCODE -ne 0) { Warn "Could not add $domain - add it from the dashboard." }
  else { Ok "$domain added." }
}

# --- 5. Secrets ----------------------------------------------------------
Step '5/6  Reconciling secrets'

$existing = @{}
$raw = & $rw variables list --service $service --json 2>&1 | Out-String
if ($LASTEXITCODE -eq 0) {
  try {
    foreach ($p in ($raw | ConvertFrom-Json).PSObject.Properties) {
      if ($p.Value -and "$($p.Value)".Trim() -ne '') { $existing[$p.Name] = $true }
    }
  } catch {
    Warn 'Could not parse existing variables; treating all as unset.'
  }
} else {
  Warn "Could not read variables for '$service' yet (it may still be building)."
}

function Set-RailwayVar {
  param([string]$Key, [string]$Value, [switch]$Secret)

  if ($existing.ContainsKey($Key) -and -not $Force) {
    Ok "$Key already set (use -Force to overwrite)"
    return $false
  }
  if ([string]::IsNullOrWhiteSpace($Value)) {
    Warn "$Key skipped - no value supplied."
    return $false
  }
  # --skip-deploys: batch everything into the single redeploy in step 6 rather
  # than kicking off one build per variable.
  & $rw variables set "$Key=$Value" --service $service --skip-deploys | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to set $Key." }
  if ($Secret) { Ok "$Key set (generated, not printed)" } else { Ok "$Key set" }
  return $true
}

$changed = $false
$changed = (Set-RailwayVar -Key 'JWT_SECRET'    -Value (New-Secret) -Secret) -or $changed
$changed = (Set-RailwayVar -Key 'COOKIE_SECRET' -Value (New-Secret) -Secret) -or $changed

# Third-party keys come from an untracked file, so this stays non-interactive
# and the keys never land in shell history or git.
$envFile = Join-Path $repoRoot '.env.railway'
if (Test-Path $envFile) {
  Write-Host '      Reading third-party keys from .env.railway'
  foreach ($line in Get-Content $envFile) {
    $t = $line.Trim()
    if ($t -eq '' -or $t.StartsWith('#')) { continue }
    $i = $t.IndexOf('=')
    if ($i -lt 1) { continue }
    $k = $t.Substring(0, $i).Trim()
    $v = $t.Substring($i + 1).Trim().Trim('"').Trim("'")
    $changed = (Set-RailwayVar -Key $k -Value $v) -or $changed
  }
} else {
  Warn 'No .env.railway - STRIPE_API_KEY / STRIPE_WEBHOOK_SECRET / RESEND_API_KEY not set.'
  Warn 'Medusa still boots without them (no Stripe provider, emails go to the log).'
  Warn 'Create .env.railway (gitignored) and re-run to enable payments and email.'
}

# --- 6. Redeploy ---------------------------------------------------------
Step '6/6  Redeploying with the new variables'
if ($changed) {
  & $rw redeploy --service $service --yes
  if ($LASTEXITCODE -ne 0) { Warn 'Redeploy failed; trigger one from the dashboard.' }
  else { Ok 'Redeploy triggered.' }
} else {
  Ok 'No variables changed - no redeploy needed.'
}

Write-Host @"

Done. Next:

  npm run logs:build           # watch the image build
  npm run logs                 # watch the app boot
  npm run domain               # the CNAME to add in DNS

Once /health answers, seed the store:

  npm run setup:store

"@ -ForegroundColor Cyan
