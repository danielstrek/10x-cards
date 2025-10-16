# Test script for POST /api/flashcards endpoint
# Usage: .\test-flashcards-endpoint.ps1 -Token "your_token" -GenerationId 123

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$true)]
    [int]$GenerationId
)

$ApiUrl = "http://localhost:4321/api/flashcards"

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Testing POST /api/flashcards endpoint" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "URL: $ApiUrl"
Write-Host "Generation ID: $GenerationId"
Write-Host ""

# Test 1: Success case
Write-Host "`nTest 1: Success - Creating 2 flashcards" -ForegroundColor Yellow
$body = @{
    generationId = $GenerationId
    flashcards = @(
        @{
            front = "What is TypeScript?"
            back = "A typed superset of JavaScript"
            source = "ai-full"
        },
        @{
            front = "What is Astro?"
            back = "A modern web framework"
            source = "ai-edited"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri $ApiUrl -Method POST `
        -Headers @{
            "Authorization" = "Bearer $Token"
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -UseBasicParsing

    if ($response.StatusCode -eq 201) {
        Write-Host "✓ Success (201 Created)" -ForegroundColor Green
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    }
} catch {
    Write-Host "✗ Failed (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    $_.Exception.Response
}

# Test 2: Validation error - front too long
Write-Host "`nTest 2: Validation Error - Front too long (>200 chars)" -ForegroundColor Yellow
$longFront = "A" * 250
$body = @{
    generationId = $GenerationId
    flashcards = @(
        @{
            front = $longFront
            back = "Answer"
            source = "ai-full"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri $ApiUrl -Method POST `
        -Headers @{
            "Authorization" = "Bearer $Token"
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -UseBasicParsing
    
    Write-Host "✗ Should have been rejected" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "✓ Correctly rejected (400 Bad Request)" -ForegroundColor Green
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $streamReader.ReadToEnd() | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } else {
        Write-Host "✗ Unexpected response (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    }
}

# Test 3: Validation error - empty array
Write-Host "`nTest 3: Validation Error - Empty flashcards array" -ForegroundColor Yellow
$body = @{
    generationId = $GenerationId
    flashcards = @()
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri $ApiUrl -Method POST `
        -Headers @{
            "Authorization" = "Bearer $Token"
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -UseBasicParsing
    
    Write-Host "✗ Should have been rejected" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "✓ Correctly rejected (400 Bad Request)" -ForegroundColor Green
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $streamReader.ReadToEnd() | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } else {
        Write-Host "✗ Unexpected response (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    }
}

# Test 4: Auth error - no token
Write-Host "`nTest 4: Auth Error - No token" -ForegroundColor Yellow
$body = @{
    generationId = $GenerationId
    flashcards = @(
        @{
            front = "Q"
            back = "A"
            source = "ai-full"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri $ApiUrl -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -UseBasicParsing
    
    Write-Host "✗ Should have been rejected" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "✓ Correctly rejected (401 Unauthorized)" -ForegroundColor Green
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $streamReader.ReadToEnd() | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } else {
        Write-Host "✗ Unexpected response (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    }
}

# Test 5: Not found - invalid generation ID
Write-Host "`nTest 5: Not Found - Invalid generation ID" -ForegroundColor Yellow
$body = @{
    generationId = 999999
    flashcards = @(
        @{
            front = "Q"
            back = "A"
            source = "ai-full"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri $ApiUrl -Method POST `
        -Headers @{
            "Authorization" = "Bearer $Token"
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -UseBasicParsing
    
    Write-Host "✗ Should have been rejected" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "✓ Correctly rejected (404 Not Found)" -ForegroundColor Green
        $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $streamReader.ReadToEnd() | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } else {
        Write-Host "✗ Unexpected response (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Testing Complete!" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

