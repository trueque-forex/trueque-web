# verify-kyc.ps1
# Usage: .\verify-kyc.ps1
# Scans repo for references to /kyc/upload, inspects .next artifacts, clears .next (optional),
# starts dev server in a new window, waits for localhost:3000, and performs basic HTTP checks.

set -e

# --- configuration
$hostUrl = "http://localhost:3000"
$checkTimeoutSec = 60
$waitBetweenChecksSec = 1
$repoRoot = (Get-Location).Path
$searchPattern = "/kyc/upload"

Write-Host "Repo root: $repoRoot"
Write-Host "Searching for references to $searchPattern ..." -ForegroundColor Cyan

# 1) Search repo files (source)
$matches = Select-String -Path "$repoRoot\**\*" -Pattern $searchPattern -SimpleMatch -ErrorAction SilentlyContinue |
    Select-Object Path,LineNumber,Line
if ($matches) {
  Write-Host "Found references in source files:" -ForegroundColor Yellow
  $matches | ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber) -> $($_.Line)" }
} else {
  Write-Host "No direct references to $searchPattern found in source files." -ForegroundColor Green
}

# 2) Inspect .next artifacts if present
$nextTypes = "$repoRoot\.next\types"
if (Test-Path $nextTypes) {
  Write-Host "`nFound .next types artifacts. Showing any mentions of $searchPattern in .next:" -ForegroundColor Cyan
  Select-String -Path "$nextTypes\**\*" -Pattern "kyc/upload" -SimpleMatch -ErrorAction SilentlyContinue |
    Select-Object Path,LineNumber,Line | ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber) -> $($_.Line)" }
} else {
  Write-Host "`nNo .next types folder found." -ForegroundColor Green
}

# 3) Offer to remove .next (safe, non-destructive to source)
$removeNext = Read-Host "`nRemove .next cache now to ensure fresh build? (y/N)"
if ($removeNext -match '^[Yy]') {
  if (Test-Path "$repoRoot\.next") {
    Write-Host "Removing .next..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "$repoRoot\.next"
    Write-Host ".next removed." -ForegroundColor Green
  } else {
    Write-Host "No .next folder to remove." -ForegroundColor Green
  }
}

# 4) Start dev server in a new window if user wants
$startDev = Read-Host "`nStart 'npm run dev' in a new window now? This will open a separate terminal (recommended for interactive dev). (y/N)"
if ($startDev -match '^[Yy]') {
  Write-Host "Starting dev server (npm run dev) in a new window..." -ForegroundColor Yellow
  Start-Process -FilePath "npm" -ArgumentList "run","dev" -WorkingDirectory $repoRoot
  Write-Host "Dev server started in a new window. Waiting for $hostUrl to become available..." -ForegroundColor Green
} else {
  Write-Host "Skipping starting dev server. Ensure your dev server is running before continuing." -ForegroundColor Yellow
}

# 5) Wait for host to respond
$deadline = (Get-Date).AddSeconds($checkTimeoutSec)
while ((Get-Date) -lt $deadline) {
  try {
    $r = Invoke-WebRequest -Uri $hostUrl -Method Head -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) {
      Write-Host "`n$hostUrl is reachable." -ForegroundColor Green
      break
    }
  } catch {
    Start-Sleep -Seconds $waitBetweenChecksSec
  }
}
if ((Get-Date) -ge $deadline) {
  Write-Host "`nTimed out waiting for $hostUrl. Aborting HTTP checks." -ForegroundColor Red
  exit 1
}

# 6) Basic page checks
function Check-Get($path) {
  $url = "$hostUrl$path"
  Write-Host "`nGET $url" -ForegroundColor Cyan
  try {
    $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "Status: $($res.StatusCode)" -ForegroundColor Green
    return @{ ok = $true; status = $res.StatusCode; body = $res.Content }
  } catch {
    Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    return @{ ok = $false; status = 0; body = "" }
  }
}

# Check guide and form pages
$guide = Check-Get "/kyc/guide"
$form = Check-Get "/kyc/form"

# 7) Check internal API /api/kyc/status (expects session cookie to be sent by browser; from script we do not have it)
# Attempt a simple unauthenticated call and show result
$apiStatusUrl = "$hostUrl/api/kyc/status"
Write-Host "`nGET $apiStatusUrl (no cookies) - this checks endpoint availability" -ForegroundColor Cyan
try {
  $apiRes = Invoke-WebRequest -Uri $apiStatusUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
  Write-Host "Status: $($apiRes.StatusCode)" -ForegroundColor Green
  $body = $apiRes.Content
  Write-Host "Body preview: " + ($body.Substring(0, [Math]::Min(300, $body.Length))) -ForegroundColor Yellow
} catch {
  Write-Host "API status request failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 8) Summary and next steps
Write-Host "`n--- SUMMARY ---" -ForegroundColor Cyan
if ($matches) { Write-Host "Source references to /kyc/upload: FOUND" -ForegroundColor Yellow } else { Write-Host "Source references to /kyc/upload: NONE" -ForegroundColor Green }
if (Test-Path "$repoRoot\.next") { Write-Host ".next folder exists after checks." -ForegroundColor Yellow } else { Write-Host ".next folder does not exist." -ForegroundColor Green }
Write-Host "`nRecommended next steps:" -ForegroundColor Cyan
Write-Host "- If you still see references in source, update them before deleting legacy route." -ForegroundColor White
Write-Host "- If everything is clean, you can safely delete src/pages/kyc/upload.tsx and restart dev server." -ForegroundColor White
Write-Host "- Re-run the script to confirm no lingering references and that /kyc/guide and /kyc/form respond correctly." -ForegroundColor White

Write-Host "`nDone." -ForegroundColor Green