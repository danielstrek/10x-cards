# Quick Test Script for POST /api/flashcards
# Usage: .\test-quick.ps1

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   Quick Test - POST /api/flashcards" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Configuration
$token = Read-Host "Enter access token (or press Enter to use test token)"
if ([string]::IsNullOrWhiteSpace($token)) {
    $token = "test-token-123"
}

$generationId = Read-Host "Enter generation ID (or press Enter to use 1)"
if ([string]::IsNullOrWhiteSpace($generationId)) {
    $generationId = 1
}

$apiUrl = "http://localhost:3000/api/flashcards"

Write-Host "`nUsing:" -ForegroundColor Yellow
Write-Host "  API URL: $apiUrl"
Write-Host "  Generation ID: $generationId"
Write-Host "  Token: $($token.Substring(0, [Math]::Min(20, $token.Length)))...`n"

# Helper function to display response
function Show-Response {
    param($Response, $StatusCode)
    
    if ($StatusCode -ge 200 -and $StatusCode -lt 300) {
        Write-Host "[OK] Status: $StatusCode" -ForegroundColor Green
    } elseif ($StatusCode -ge 400) {
        Write-Host "[ERROR] Status: $StatusCode" -ForegroundColor Red
    } else {
        Write-Host "Status: $StatusCode" -ForegroundColor Yellow
    }
    
    try {
        $Response | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } catch {
        $Response
    }
}

# Menu
while ($true) {
    Write-Host "`n--- Select test ---" -ForegroundColor Cyan
    Write-Host "1. Success - Create 3 flashcards (different sources)"
    Write-Host "2. Success - Create 1 flashcard"
    Write-Host "3. Error - Empty front field (400)"
    Write-Host "4. Error - Front too long >200 chars (400)"
    Write-Host "5. Error - Empty flashcards array (400)"
    Write-Host "6. Error - No auth token (401)"
    Write-Host "7. Error - Invalid token (401)"
    Write-Host "8. Error - Non-existent generation (404)"
    Write-Host "9. Edge Case - Max length (200/500 chars)"
    Write-Host "10. Edge Case - 100 flashcards (max)"
    Write-Host "11. Custom request (JSON)"
    Write-Host "0. Exit"
    
    $choice = Read-Host "`nChoice"
    
    switch ($choice) {
        "0" {
            Write-Host "`nGoodbye!`n" -ForegroundColor Cyan
            exit
        }
        
        "1" {
            Write-Host "`n[Test 1] Creating 3 flashcards..." -ForegroundColor Yellow
            $body = @{
                generationId = [int]$generationId
                flashcards = @(
                    @{ front = "What is TypeScript?"; back = "A typed superset of JavaScript"; source = "ai-full" },
                    @{ front = "What is Astro?"; back = "A modern web framework"; source = "ai-edited" },
                    @{ front = "What is Supabase?"; back = "Open-source Firebase alternative"; source = "manual" }
                )
            } | ConvertTo-Json -Depth 10
            
            try {
                $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
                    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
                    -Body $body -UseBasicParsing
                Show-Response -Response $response.Content -StatusCode $response.StatusCode
            } catch {
                if ($_.Exception.Response) {
                    $statusCode = $_.Exception.Response.StatusCode.value__
                    $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                    $body = $stream.ReadToEnd()
                    Show-Response -Response $body -StatusCode $statusCode
                } else {
                    Write-Host "[ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        
        "2" {
            Write-Host "`n[Test 2] Creating 1 flashcard..." -ForegroundColor Yellow
            $body = @{
                generationId = [int]$generationId
                flashcards = @(
                    @{ front = "Quick test question"; back = "Quick test answer"; source = "ai-full" }
                )
            } | ConvertTo-Json -Depth 10
            
            try {
                $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
                    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
                    -Body $body -UseBasicParsing
                Show-Response -Response $response.Content -StatusCode $response.StatusCode
            } catch {
                if ($_.Exception.Response) {
                    $statusCode = $_.Exception.Response.StatusCode.value__
                    $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                    $body = $stream.ReadToEnd()
                    Show-Response -Response $body -StatusCode $statusCode
                } else {
                    Write-Host "[ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        
        "3" {
            Write-Host "`n[Test 3] Empty front field..." -ForegroundColor Yellow
            $body = @{
                generationId = [int]$generationId
                flashcards = @( @{ front = ""; back = "Answer"; source = "ai-full" } )
            } | ConvertTo-Json -Depth 10
            
            try {
                $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
                    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
                    -Body $body -UseBasicParsing
                Show-Response -Response $response.Content -StatusCode $response.StatusCode
            } catch {
                if ($_.Exception.Response) {
                    $statusCode = $_.Exception.Response.StatusCode.value__
                    $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                    $body = $stream.ReadToEnd()
                    Show-Response -Response $body -StatusCode $statusCode
                } else {
                    Write-Host "[ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        
        "4" {
            Write-Host "`n[Test 4] Front too long (250 chars)..." -ForegroundColor Yellow
            $longFront = "A" * 250
            $body = @{
                generationId = [int]$generationId
                flashcards = @( @{ front = $longFront; back = "Answer"; source = "ai-full" } )
            } | ConvertTo-Json -Depth 10
            
            try {
                $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
                    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
                    -Body $body -UseBasicParsing
                Show-Response -Response $response.Content -StatusCode $response.StatusCode
            } catch {
                if ($_.Exception.Response) {
                    $statusCode = $_.Exception.Response.StatusCode.value__
                    $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                    $body = $stream.ReadToEnd()
                    Show-Response -Response $body -StatusCode $statusCode
                } else {
                    Write-Host "[ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        
        "5" {
            Write-Host "`n[Test 5] Empty flashcards array..." -ForegroundColor Yellow
            $body = @{
                generationId = [int]$generationId
                flashcards = @()
            } | ConvertTo-Json -Depth 10
            
            try {
                $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
                    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
                    -Body $body -UseBasicParsing
                Show-Response -Response $response.Content -StatusCode $response.StatusCode
            } catch {
                if ($_.Exception.Response) {
                    $statusCode = $_.Exception.Response.StatusCode.value__
                    $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                    $body = $stream.ReadToEnd()
                    Show-Response -Response $body -StatusCode $statusCode
                } else {
                    Write-Host "[ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        
        "6" {
            Write-Host "`n[Test 6] No auth token..." -ForegroundColor Yellow
            $body = @{
                generationId = [int]$generationId
                flashcards = @( @{ front = "Q"; back = "A"; source = "ai-full" } )
            } | ConvertTo-Json -Depth 10
            
            try {
                $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
                    -Headers @{ "Content-Type" = "application/json" } `
                    -Body $body -UseBasicParsing
                Show-Response -Response $response.Content -StatusCode $response.StatusCode
            } catch {
                if ($_.Exception.Response) {
                    $statusCode = $_.Exception.Response.StatusCode.value__
                    $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                    $body = $stream.ReadToEnd()
                    Show-Response -Response $body -StatusCode $statusCode
                } else {
                    Write-Host "[ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        
        "7" {
            Write-Host "`n[Test 7] Invalid token..." -ForegroundColor Yellow
            $body = @{
                generationId = [int]$generationId
                flashcards = @( @{ front = "Q"; back = "A"; source = "ai-full" } )
            } | ConvertTo-Json -Depth 10
            
            try {
                $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
                    -Headers @{ "Authorization" = "Bearer invalid-token-xyz"; "Content-Type" = "application/json" } `
                    -Body $body -UseBasicParsing
                Show-Response -Response $response.Content -StatusCode $response.StatusCode
            } catch {
                if ($_.Exception.Response) {
                    $statusCode = $_.Exception.Response.StatusCode.value__
                    $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                    $body = $stream.ReadToEnd()
                    Show-Response -Response $body -StatusCode $statusCode
                } else {
                    Write-Host "[ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        
        "8" {
            Write-Host "`n[Test 8] Non-existent generation..." -ForegroundColor Yellow
            $body = @{
                generationId = 999999
                flashcards = @( @{ front = "Q"; back = "A"; source = "ai-full" } )
            } | ConvertTo-Json -Depth 10
            
            try {
                $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
                    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
                    -Body $body -UseBasicParsing
                Show-Response -Response $response.Content -StatusCode $response.StatusCode
            } catch {
                if ($_.Exception.Response) {
                    $statusCode = $_.Exception.Response.StatusCode.value__
                    $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                    $body = $stream.ReadToEnd()
                    Show-Response -Response $body -StatusCode $statusCode
                } else {
                    Write-Host "[ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        
        "9" {
            Write-Host "`n[Test 9] Max length strings (200/500)..." -ForegroundColor Yellow
            $body = @{
                generationId = [int]$generationId
                flashcards = @( @{ front = "Q" * 200; back = "A" * 500; source = "ai-full" } )
            } | ConvertTo-Json -Depth 10
            
            try {
                $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
                    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
                    -Body $body -UseBasicParsing
                Show-Response -Response $response.Content -StatusCode $response.StatusCode
            } catch {
                if ($_.Exception.Response) {
                    $statusCode = $_.Exception.Response.StatusCode.value__
                    $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                    $body = $stream.ReadToEnd()
                    Show-Response -Response $body -StatusCode $statusCode
                } else {
                    Write-Host "[ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        
        "10" {
            Write-Host "`n[Test 10] 100 flashcards (max)..." -ForegroundColor Yellow
            $flashcards = @()
            for ($i = 1; $i -le 100; $i++) {
                $flashcards += @{ front = "Q$i"; back = "A$i"; source = "ai-full" }
            }
            $body = @{
                generationId = [int]$generationId
                flashcards = $flashcards
            } | ConvertTo-Json -Depth 10
            
            try {
                $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
                    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
                    -Body $body -UseBasicParsing
                Show-Response -Response $response.Content -StatusCode $response.StatusCode
            } catch {
                if ($_.Exception.Response) {
                    $statusCode = $_.Exception.Response.StatusCode.value__
                    $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                    $body = $stream.ReadToEnd()
                    Show-Response -Response $body -StatusCode $statusCode
                } else {
                    Write-Host "[ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        
        "11" {
            Write-Host "`nPaste JSON body (press Enter twice to finish):" -ForegroundColor Yellow
            $lines = @()
            while ($true) {
                $line = Read-Host
                if ([string]::IsNullOrWhiteSpace($line)) { break }
                $lines += $line
            }
            $customBody = $lines -join "`n"
            
            try {
                $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
                    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
                    -Body $customBody -UseBasicParsing
                Show-Response -Response $response.Content -StatusCode $response.StatusCode
            } catch {
                if ($_.Exception.Response) {
                    $statusCode = $_.Exception.Response.StatusCode.value__
                    $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                    $body = $stream.ReadToEnd()
                    Show-Response -Response $body -StatusCode $statusCode
                } else {
                    Write-Host "[ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
        
        default {
            Write-Host "`nInvalid choice. Try again." -ForegroundColor Red
        }
    }
}

