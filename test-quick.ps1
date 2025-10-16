# Quick Test Script for POST /api/flashcards
# Usage: .\test-quick.ps1

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   Quick Test - POST /api/flashcards" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Konfiguracja - UZUPEŁNIJ TE WARTOŚCI!
$token = Read-Host "Podaj access token (lub naciśnij Enter aby użyć testowego)"
if ([string]::IsNullOrWhiteSpace($token)) {
    $token = "test-token-123"  # Testowy token - nie zadziała, ale pokaże błąd auth
}

$generationId = Read-Host "Podaj generation ID (lub naciśnij Enter aby użyć 1)"
if ([string]::IsNullOrWhiteSpace($generationId)) {
    $generationId = 1
}

$apiUrl = "http://localhost:4321/api/flashcards"

Write-Host "`nUżywam:" -ForegroundColor Yellow
Write-Host "  API URL: $apiUrl"
Write-Host "  Generation ID: $generationId"
Write-Host "  Token: $($token.Substring(0, [Math]::Min(20, $token.Length)))...`n"

# Funkcja pomocnicza do wyświetlania odpowiedzi
function Show-Response {
    param($Response, $StatusCode)
    
    if ($StatusCode -ge 200 -and $StatusCode -lt 300) {
        Write-Host "✓ Status: $StatusCode" -ForegroundColor Green
    } elseif ($StatusCode -ge 400) {
        Write-Host "✗ Status: $StatusCode" -ForegroundColor Red
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
    Write-Host "`n--- Wybierz test ---" -ForegroundColor Cyan
    Write-Host "1. Success - Utwórz 3 flashcards (różne source)"
    Write-Host "2. Success - Utwórz 1 flashcard"
    Write-Host "3. Error - Puste pole front (400)"
    Write-Host "4. Error - Front za długie >200 chars (400)"
    Write-Host "5. Error - Pusta tablica flashcards (400)"
    Write-Host "6. Error - Brak tokena (401)"
    Write-Host "7. Error - Nieprawidłowy token (401)"
    Write-Host "8. Error - Nieistniejąca generacja (404)"
    Write-Host "9. Edge Case - Max długość (200/500 chars)"
    Write-Host "10. Edge Case - 100 flashcards (max)"
    Write-Host "11. Własny request (JSON)"
    Write-Host "0. Wyjście"
    
    $choice = Read-Host "`nWybór"
    
    switch ($choice) {
        "0" {
            Write-Host "`nDo zobaczenia! 👋`n" -ForegroundColor Cyan
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
                $statusCode = $_.Exception.Response.StatusCode.value__
                $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $body = $stream.ReadToEnd()
                Show-Response -Response $body -StatusCode $statusCode
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
                $statusCode = $_.Exception.Response.StatusCode.value__
                $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $body = $stream.ReadToEnd()
                Show-Response -Response $body -StatusCode $statusCode
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
                $statusCode = $_.Exception.Response.StatusCode.value__
                $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $body = $stream.ReadToEnd()
                Show-Response -Response $body -StatusCode $statusCode
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
                $statusCode = $_.Exception.Response.StatusCode.value__
                $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $body = $stream.ReadToEnd()
                Show-Response -Response $body -StatusCode $statusCode
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
                $statusCode = $_.Exception.Response.StatusCode.value__
                $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $body = $stream.ReadToEnd()
                Show-Response -Response $body -StatusCode $statusCode
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
                $statusCode = $_.Exception.Response.StatusCode.value__
                $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $body = $stream.ReadToEnd()
                Show-Response -Response $body -StatusCode $statusCode
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
                $statusCode = $_.Exception.Response.StatusCode.value__
                $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $body = $stream.ReadToEnd()
                Show-Response -Response $body -StatusCode $statusCode
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
                $statusCode = $_.Exception.Response.StatusCode.value__
                $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $body = $stream.ReadToEnd()
                Show-Response -Response $body -StatusCode $statusCode
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
                $statusCode = $_.Exception.Response.StatusCode.value__
                $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $body = $stream.ReadToEnd()
                Show-Response -Response $body -StatusCode $statusCode
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
                $statusCode = $_.Exception.Response.StatusCode.value__
                $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $body = $stream.ReadToEnd()
                Show-Response -Response $body -StatusCode $statusCode
            }
        }
        
        "11" {
            Write-Host "`nWklej JSON body (Enter 2x aby zakończyć):" -ForegroundColor Yellow
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
                $statusCode = $_.Exception.Response.StatusCode.value__
                $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $body = $stream.ReadToEnd()
                Show-Response -Response $body -StatusCode $statusCode
            }
        }
        
        default {
            Write-Host "`nNieprawidłowy wybór. Spróbuj ponownie." -ForegroundColor Red
        }
    }
}

