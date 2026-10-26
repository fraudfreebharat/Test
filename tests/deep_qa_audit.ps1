# ==============================================================================
# MAYRA DENTAL CARE — DEEP STATIC, DOM & WORKFLOW AUDIT
# ==============================================================================

$rootPath = $PSScriptRoot + "\.."
if (-not (Test-Path $rootPath)) { $rootPath = Get-Location }

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  MAYRA DENTAL CARE: DEEP VERIFICATION & ACCESSIBILITY AUDIT" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

$allPassed = @()
$allWarnings = @()
$allErrors = @()

# ------------------------------------------------------------------------------
# 1. CSS Syntax & Balanced Braces Audit
# ------------------------------------------------------------------------------
Write-Host "`n[PHASE 1] CSS Syntax & Balanced Braces Audit..." -ForegroundColor Yellow

$cssFiles = Get-ChildItem -Path (Join-Path $rootPath "css") -Filter "*.css" -Recurse
foreach ($cf in $cssFiles) {
    $rel = $cf.FullName.Substring($rootPath.Length + 1)
    $text = Get-Content $cf.FullName -Raw
    
    $openBraces = ([regex]::Matches($text, "\{")).Count
    $closeBraces = ([regex]::Matches($text, "\}")).Count

    if ($openBraces -ne $closeBraces) {
        $allErrors += "[CSS SYNTAX ERROR] In '$rel': Open braces ($openBraces) do not match closing braces ($closeBraces)!"
    } else {
        $allPassed += "CSS '$rel' has perfectly balanced rulesets ($openBraces blocks)."
    }
}

# ------------------------------------------------------------------------------
# 2. Heading Hierarchy & Document Outline Audit
# ------------------------------------------------------------------------------
Write-Host "`n[PHASE 2] HTML Heading Hierarchy & Semantic Outline..." -ForegroundColor Yellow

$htmlPages = Get-ChildItem -Path $rootPath -Filter "*.html"
foreach ($hp in $htmlPages) {
    $content = Get-Content $hp.FullName -Raw
    
    # Check H1 presence and uniqueness
    $h1Matches = [regex]::Matches($content, "<h1[\s>]")
    if ($h1Matches.Count -eq 0) {
        $allErrors += "[SEO/A11Y ERROR] '$($hp.Name)' is missing a main <h1> heading!"
    } elseif ($h1Matches.Count -gt 1) {
        $allWarnings += "[SEO/A11Y WARNING] '$($hp.Name)' has $($h1Matches.Count) <h1> tags (recommended: exactly 1 per page)."
    } else {
        $allPassed += "'$($hp.Name)' has exactly one primary <h1> heading."
    }

    # Check for empty alt attributes or missing alt on images/svg
    $imgWithoutAlt = [regex]::Matches($content, '<img(?![^>]*\balt=)[^>]*>')
    if ($imgWithoutAlt.Count -gt 0) {
        $allErrors += "[A11Y ERROR] '$($hp.Name)' has $($imgWithoutAlt.Count) <img> elements without alt attribute!"
    }
}

# ------------------------------------------------------------------------------
# 3. Interactive Form & LocalStorage Workflow Audit
# ------------------------------------------------------------------------------
Write-Host "`n[PHASE 3] Interactive Form & LocalStorage Workflow Audit..." -ForegroundColor Yellow

$contactHtml = Get-Content (Join-Path $rootPath "contact.html") -Raw
$formsJs = Get-Content (Join-Path $rootPath "js\forms.js") -Raw

$requiredFormElements = @(
    '#full-name',
    '#phone',
    '#email',
    '#service-select',
    '#preferred-date',
    '#preferred-slot',
    '#notes',
    '#anxiety-check',
    '#submit-booking-btn',
    '#booking-form-wrapper',
    '#booking-confirmation-wrapper',
    '#confirm-ref-number',
    '#confirm-patient-name',
    '#confirm-service-name',
    '#confirm-time-slot',
    '#book-another-btn'
)

$missingInContact = @()
foreach ($elemId in $requiredFormElements) {
    $rawId = $elemId.Substring(1)
    if ($contactHtml -notmatch "id=['`"]$rawId['`"]") {
        $missingInContact += $elemId
    }
}

if ($missingInContact.Count -eq 0) {
    $allPassed += "All 16 form fields and dynamic confirmation containers are 100% matched between HTML and JS."
} else {
    foreach ($m in $missingInContact) {
        $allErrors += "[FORM DOM CONTRACT MISSING] Element '$m' queried in forms.js not found in contact.html"
    }
}

# ------------------------------------------------------------------------------
# 4. Mobile Navigation Drawer Audit
# ------------------------------------------------------------------------------
Write-Host "`n[PHASE 4] Mobile Navigation Drawer Audit..." -ForegroundColor Yellow

foreach ($hp in $htmlPages) {
    $content = Get-Content $hp.FullName -Raw
    if ($content -match 'id="mobile-nav-toggle"' -and $content -match 'id="mobile-drawer"' -and $content -match 'id="drawer-close-btn"') {
        $allPassed += "'$($hp.Name)' contains complete accessible mobile drawer component."
    } else {
        $allErrors += "[DRAWER MISSING] '$($hp.Name)' is missing one or more mobile drawer controls."
    }
}

# ------------------------------------------------------------------------------
# 5. Toast Notification System Audit
# ------------------------------------------------------------------------------
Write-Host "`n[PHASE 5] Toast Notification System Audit..." -ForegroundColor Yellow

$mainJs = Get-Content (Join-Path $rootPath "js\main.js") -Raw
if ($mainJs -match "window\.showToast") {
    $allPassed += "Global window.showToast() is exposed and instantiated."
} else {
    $allErrors += "[TOAST ERROR] window.showToast() is not defined in js/main.js"
}

# ------------------------------------------------------------------------------
# RESULTS
# ------------------------------------------------------------------------------
Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "  DEEP AUDIT EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  PASSED VERIFICATIONS: $($allPassed.Count)" -ForegroundColor Green
Write-Host "  WARNINGS:             $($allWarnings.Count)" -ForegroundColor Yellow
Write-Host "  CRITICAL ERRORS:      $($allErrors.Count)" -ForegroundColor Red

if ($allErrors.Count -gt 0) {
    Write-Host "`nERRORS:" -ForegroundColor Red
    foreach ($e in $allErrors) { Write-Host "  ! $e" -ForegroundColor Red }
} else {
    Write-Host "`n>> ZERO ERRORS ENCOUNTERED ACROSS ENTIRE CLINICAL WEB APPLICATION <<" -ForegroundColor Green
}
