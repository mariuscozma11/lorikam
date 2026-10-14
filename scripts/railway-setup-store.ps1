<#
.SYNOPSIS
  One-time store setup, executed inside the running Railway backend container.

.DESCRIPTION
  Runs the seed/config scripts the store needs once, plus (optionally) the first
  admin user. Every seed is idempotent, so re-running this is safe.

  Requires a backend deploy that is already live and healthy.

  Runs over plain `ssh`, not `railway ssh`. `railway ssh` insists on a TTY and
  hangs silently without one (so it cannot be used from CI or an agent), but
  `railway ssh config` emits an ordinary OpenSSH host block, and `ssh host
  <command>` needs no TTY at all. The block is refreshed on every run because it
  embeds the project/environment/service IDs, which change if the service is
  recreated.

  First run needs an SSH key registered with Railway:
    ssh-keygen -t ed25519      # if you have no ~/.ssh/id_ed25519
    railway ssh keys add

.PARAMETER AdminEmail
  Email for the admin user. Ignored when -NoAdmin is passed.

.PARAMETER AdminPassword
  Password for the admin user. Generated and printed once when omitted.

.PARAMETER NoAdmin
  Only run the seeds; do not create an admin user.

.EXAMPLE
  npm.cmd run setup:store
  .\scripts\railway-setup-store.ps1 -AdminEmail me@lorikam.ro -NoAdmin
#>
[CmdletBinding()]
param(
  [string]$AdminEmail = 'admin@lorikam.ro',
  [string]$AdminPassword,
  [switch]$NoAdmin
)

$ErrorActionPreference = 'Stop'
$service = 'backend'
$sshAlias = "railway-$service"
$key = Join-Path $env:USERPROFILE '.ssh\id_ed25519'

function Step { param($m) Write-Host "`n=== $m" -ForegroundColor Cyan }
function Ok   { param($m) Write-Host "  ok  $m" -ForegroundColor Green }
function Warn { param($m) Write-Host "  !   $m" -ForegroundColor Yellow }

$rw = & (Join-Path $PSScriptRoot '_railway-env.ps1')

Step 'Refreshing the SSH config block'
if (-not (Test-Path $key)) {
  throw "No SSH key at $key. Create one with:  ssh-keygen -t ed25519   then:  railway ssh keys add"
}
& $rw ssh config --service $service -i $key | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'railway ssh config failed.' }
Ok "host '$sshAlias' -> ssh.railway.com"

function Invoke-InContainer {
  param([string]$Label, [string]$Command, [switch]$Tolerate)

  Step $Label
  # accept-new, not 'no': still pins the host key after first contact, but never
  # blocks on the yes/no prompt, which would hang a non-interactive run.
  ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes $sshAlias $Command
  if ($LASTEXITCODE -ne 0) {
    if ($Tolerate) { return $false }
    throw "$Label failed (exit $LASTEXITCODE). See the output above."
  }
  Ok $Label
  return $true
}

# The container's workdir is the built server (.medusa/server), where `medusa
# build` compiled src/ to JavaScript - so the seeds are .js here and .ts in the
# repo. Try both, and print the directory if neither is found, rather than
# failing with a bare exit code.
#
# The remote command MUST be a single line: a multi-line string does not survive
# argument passing and the container sees only its first line, dying with
# `Syntax error: end of file unexpected (expecting "fi")`.
function Invoke-Seed {
  param([string]$Label, [string]$Script)

  $js = "./src/scripts/$Script.js"
  $ts = "./src/scripts/$Script.ts"
  $cmd = "if [ -f $js ]; then echo running $js; npx medusa exec $js; " +
         "elif [ -f $ts ]; then echo running $ts; npx medusa exec $ts; " +
         "else echo NOT_FOUND $Script; pwd; ls -la src/scripts; exit 1; fi"

  Invoke-InContainer -Label $Label -Command $cmd | Out-Null
}

# Order matters and is not obvious:
#
#   seed                  creates store currencies, the Romania/Europa regions,
#                         tax regions, the stock location and - critically - the
#                         "Livrare Lorikam" fulfillment set with its service
#                         zone. It also prints the storefront publishable key.
#   seed-variant-presets  croi / size presets.
#   setup-shipping        NEEDS seed's service zone. Without it, it aborts with
#                         "No service zone found. Run seed.ts first."
#   setup-tax             21% RO, tax-inclusive prices on both regions.
Invoke-Seed 'Base store: currencies, regions, tax regions, stock location, fulfillment set' 'seed'
Invoke-Seed 'Seed croi / size presets' 'seed-variant-presets'
Invoke-Seed 'Shipping zones RO+EU, methods, delivery profile' 'setup-shipping'
Invoke-Seed 'Tax: 21% RO, prices VAT-inclusive' 'setup-tax'

if (-not $NoAdmin) {
  $generated = $false
  if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
    $bytes = [byte[]]::new(18)
    # ::Create().GetBytes() rather than ::Fill() - Fill is .NET Core only, and
    # Windows PowerShell 5.1 runs on .NET Framework.
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $AdminPassword = [Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')
    $generated = $true
  }

  Step "Create admin user $AdminEmail"

  # The output has to be inspected, not the exit code: `npx medusa user` prints
  # a MedusaError and still exits 0 when the email already exists. Trusting the
  # exit code made this report success and print a password that was never set,
  # which is worse than failing.
  # ErrorActionPreference is relaxed only around this call. In PowerShell 5.1,
  # `2>&1` on a native command wraps each stderr line in an ErrorRecord and sets
  # $? to false even on exit 0, which under 'Stop' aborts the script before the
  # output can be inspected at all.
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $output = ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes $sshAlias `
      "npx medusa user -e '$AdminEmail' -p '$AdminPassword'" 2>&1
  } finally {
    $ErrorActionPreference = $prev
  }
  $output | ForEach-Object { Write-Host $_ }
  $text = $output | Out-String

  if ($text -match 'already exists') {
    Warn "$AdminEmail already exists - password NOT changed, nothing else affected."
    Warn "To reset it, use the admin UI, or delete the user and re-run."
  } elseif ($text -match 'User created successfully') {
    Ok 'Admin user created.'
    if ($generated) {
      Write-Host "`n  Password (shown once, store it in your password manager):" -ForegroundColor Yellow
      Write-Host "    $AdminPassword" -ForegroundColor Yellow
    }
  } else {
    throw "Could not tell whether the admin user was created. Review the output above."
  }
}

Write-Host @"

Seeds done. The publishable key is printed in the 'Base store' output above
(pk_...) - paste it into Vercel as NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY and
redeploy the storefront.

Remaining admin UI work at /app on the backend domain:
  - Sales channel / stock location wiring, if you want more than the defaults
  - Stripe webhook -> https://api.lorikam.ro/hooks/payment/stripe_stripe

Optional extra seeds (not run automatically):
  ssh $sshAlias "npx medusa exec ./src/scripts/seed-colors.js"
  ssh $sshAlias "npx medusa exec ./src/scripts/seed-content-pages.js"

"@ -ForegroundColor Cyan
