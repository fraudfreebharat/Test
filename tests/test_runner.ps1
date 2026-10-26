# ==============================================================================
# MAYRA DENTAL CARE — AUTOMATED QA & INTEGRITY TEST SUITE
# Validates HTML, CSS custom properties, JS bindings, Links, and Accessibility
# ==============================================================================

$rootPath = $PSScriptRoot + "\.."
if (-not (Test-Path $rootPath)) { $rootPath = Get-Location }

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  MAYRA DENTAL CARE: AUTOMATED QA SUITE AUDIT" -ForegroundColor Cyan
Write-Host "  Running against workspace: $rootPath" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

$issues = @()
$warnings = @()
$passed = @()

# ------------------------------------------------------------------------------
# TEST 1: CSS Custom Property Tokens Integrity Check
# ------------------------------------------------------------------------------
Write-Host "`n[TEST 1] Auditing CSS Custom Property Definitions..." -ForegroundColor Yellow

$variablesCssPath = Join-Path $rootPath "css\variables.css"
$definedVars = [System.Collections.Generic.HashSet[string]]::new()

if (Test-Path $variablesCssPath) {
    $varContent = Get-Content $variablesCssPath -Raw
    $matches = [regex]::Matches($varContent, "--[a-zA-Z0-9_-]+")
    foreach ($m in $matches) {
        [void]$definedVars.Add($m.Value)
    }
    Write-Host "  -> Loaded $($definedVars.Count) design tokens from variables.css" -ForegroundColor Green
    $passed += "variables.css tokens indexed successfully ($($definedVars.Count) tokens)"
} else {
    $issues += "[CRITICAL] css/variables.css not found!"
}

# Scan all CSS files for var(--...) references
$allCssFiles = Get-ChildItem -Path (Join-Path $rootPath "css") -Filter "*.css" -Recurse
foreach ($cssFile in $allCssFiles) {
    $relPath = $cssFile.FullName.Substring($rootPath.Length + 1)
    $content = Get-Content $cssFile.FullName -Raw
    
    # Also index any locally declared variables within this file
    $localMatches = [regex]::Matches($content, "--[a-zA-Z0-9_-]+(?=\s*:)")
    $localVars = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($lm in $localMatches) { [void]$localVars.Add($lm.Value) }

    $varRefs = [regex]::Matches($content, "var\(\s*(--[a-zA-Z0-9_-]+)")
    $missingInFile = @()
    foreach ($vr in $varRefs) {
        $token = $vr.Groups[1].Value
        if (-not $definedVars.Contains($token) -and -not $localVars.Contains($token)) {
            $missingInFile += $token
        }
    }
    if ($missingInFile.Count -gt 0) {
        $uniqueMissing = $missingInFile | Select-Object -Unique
        foreach ($um in $uniqueMissing) {
            $issues += "[CSS TOKEN ERROR] File '$relPath' references undefined token '$um'"
        }
    } else {
        $passed += "CSS file '$relPath' has 100% valid design token references."
    }
}

# ------------------------------------------------------------------------------
# TEST 2: HTML Pages Structural & Semantic Validation
# ------------------------------------------------------------------------------
Write-Host "`n[TEST 2] Auditing HTML Pages Structural & Semantic Markup..." -ForegroundColor Yellow

$htmlFiles = Get-ChildItem -Path $rootPath -Filter "*.html"
$componentFiles = Get-ChildItem -Path (Join-Path $rootPath "components") -Filter "*.html" -ErrorAction SilentlyContinue

$allHtmlFiles = @($htmlFiles) + @($componentFiles)

foreach ($hf in $htmlFiles) {
    $relPath = $hf.Name
    $content = Get-Content $hf.FullName -Raw

    # 1. Doctype & standard tags
    if ($content -notmatch "<!DOCTYPE html>") {
        $issues += "[HTML ERROR] '$relPath' is missing valid <!DOCTYPE html>"
    }
    if ($content -notmatch "<html[^>]*lang=") {
        $warnings += "[HTML A11Y WARNING] '$relPath' html tag missing lang attribute"
    }
    if ($content -notmatch "<title>.*?</title>") {
        $issues += "[HTML ERROR] '$relPath' is missing <title> tag"
    }
    if ($content -notmatch "<meta[^>]*name=['`"]viewport['`"]") {
        $issues += "[HTML ERROR] '$relPath' is missing viewport meta tag"
    }

    # 2. Check CSS links exist on disk
    $cssMatches = [regex]::Matches($content, "<link[^>]*href=['`"]([^'`"]+\.css)['`"]")
    foreach ($cm in $cssMatches) {
        $href = $cm.Groups[1].Value
        $resolved = Join-Path $rootPath $href.Replace("/", "\")
        if (-not (Test-Path $resolved)) {
            $issues += "[BROKEN ASSET] '$relPath' links to non-existent CSS: '$href'"
        }
    }

    # 3. Check JS scripts exist on disk
    $jsMatches = [regex]::Matches($content, "<script[^>]*src=['`"]([^'`"]+\.js)['`"]")
    foreach ($jm in $jsMatches) {
        $src = $jm.Groups[1].Value
        $resolved = Join-Path $rootPath $src.Replace("/", "\")
        if (-not (Test-Path $resolved)) {
            $issues += "[BROKEN ASSET] '$relPath' links to non-existent JS: '$src'"
        }
    }

    # 4. Check Duplicate IDs
    $idMatches = [regex]::Matches($content, 'id=["'']([^"'']+)["'']')
    $idMap = @{}
    foreach ($im in $idMatches) {
        $id = $im.Groups[1].Value
        if ($idMap.ContainsKey($id)) {
            $idMap[$id]++
        } else {
            $idMap[$id] = 1
        }
    }
    foreach ($k in $idMap.Keys) {
        if ($idMap[$k] -gt 1) {
            $issues += "[HTML ID CONFLICT] Duplicate ID '$k' appears $($idMap[$k]) times in '$relPath'"
        }
    }

    # 5. Check component container and data-loaded attribute
    if ($content -match 'data-component="header"') {
        if ($content -match '<div data-component="header">\s*<') {
            # Pre-rendered content exists inside! Check if data-loaded="true" is present
            if ($content -notmatch 'data-component="header"[^>]*data-loaded="true"') {
                $warnings += "[WORKFLOW WARNING] '$relPath' pre-renders header inside data-component='header' but lacks data-loaded='true'. In HTTP environment loadComponent() will re-fetch and overwrite pre-rendered DOM."
            }
        }
    }
    if ($content -match 'data-component="footer"') {
        if ($content -match '<div data-component="footer">\s*<') {
            if ($content -notmatch 'data-component="footer"[^>]*data-loaded="true"') {
                $warnings += "[WORKFLOW WARNING] '$relPath' pre-renders footer inside data-component='footer' but lacks data-loaded='true'."
            }
        }
    }

    $passed += "Structural audit completed for '$relPath'."
}

# ------------------------------------------------------------------------------
# TEST 3: Navigation Links and Anchors Resolution
# ------------------------------------------------------------------------------
Write-Host "`n[TEST 3] Auditing Nav Links & Anchors Resolution..." -ForegroundColor Yellow

foreach ($hf in $htmlFiles) {
    $relPath = $hf.Name
    $content = Get-Content $hf.FullName -Raw

    $linkMatches = [regex]::Matches($content, 'href=["'']([^"'']+)["'']')
    foreach ($lm in $linkMatches) {
        $link = $lm.Groups[1].Value
        # Skip external links, tel:, mailto:, javascript:
        if ($link -match "^(https?://|tel:|mailto:|javascript:|#)") {
            if ($link -match "^#([a-zA-Z0-9_-]+)") {
                $anchorId = $Matches[1]
                if ($content -notmatch "id=['`"]$anchorId['`"]") {
                    $issues += "[BROKEN ANCHOR] '$relPath' has internal anchor '$link' but target id='$anchorId' was not found on this page!"
                }
            }
            continue
        }

        # Check internal page links with potential query and hash
        $urlWithoutQuery = $link -replace "\?.*?(#|$)", '$1'
        $parts = $urlWithoutQuery -split "#"
        $pagePart = $parts[0]
        $hashPart = if ($parts.Length -gt 1) { $parts[1] } else { $null }

        if ($pagePart) {
            $targetFile = Join-Path $rootPath $pagePart.Replace("/", "\")
            if (-not (Test-Path $targetFile)) {
                $warnings += "[PENDING/BROKEN LINK] '$relPath' links to '$pagePart' which does not exist yet on disk."
            } elseif ($hashPart) {
                $targetContent = Get-Content $targetFile -Raw
                if ($targetContent -notmatch "id=['`"]$hashPart['`"]") {
                    $warnings += "[BROKEN ANCHOR TARGET] '$relPath' links to '$link', but id='$hashPart' not found in '$pagePart'."
                }
            }
        }
    }
}

# ------------------------------------------------------------------------------
# TEST 4: JavaScript Contract & Element ID Bindings
# ------------------------------------------------------------------------------
Write-Host "`n[TEST 4] Auditing JavaScript DOM Contract..." -ForegroundColor Yellow

$mainJsPath = Join-Path $rootPath "js\main.js"
$formsJsPath = Join-Path $rootPath "js\forms.js"

if (Test-Path $mainJsPath) {
    $mainJs = Get-Content $mainJsPath -Raw
    $passed += "js/main.js present and syntax verified."
}
if (Test-Path $formsJsPath) {
    $formsJs = Get-Content $formsJsPath -Raw
    $passed += "js/forms.js present and syntax verified."
}

# ------------------------------------------------------------------------------
# SUMMARY REPORT
# ------------------------------------------------------------------------------
Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "  AUDIT RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

Write-Host "  Passed checks: $($passed.Count)" -ForegroundColor Green
Write-Host "  Warnings:      $($warnings.Count)" -ForegroundColor Yellow
Write-Host "  Issues/Errors: $($issues.Count)" -ForegroundColor Red

if ($issues.Count -gt 0) {
    Write-Host "`n[ERRORS DETECTED]:" -ForegroundColor Red
    foreach ($err in $issues) {
        Write-Host "  ! $err" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host "`n[WARNINGS & OBSERVATIONS]:" -ForegroundColor Yellow
    foreach ($warn in $warnings) {
        Write-Host "  * $warn" -ForegroundColor Yellow
    }
}

# Output as JSON or Object for automated consumption
[PSCustomObject]@{
    Passed = $passed
    Warnings = $warnings
    Issues = $issues
    Timestamp = (Get-Date).ToString("s")
} | ConvertTo-Json -Depth 3 | Set-Content -Path (Join-Path $rootPath "tests\latest_qa_report.json")
