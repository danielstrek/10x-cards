# Get Access Token - Quick login helper
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   Get Access Token from Supabase" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Configuration
$supabaseUrl = Read-Host "Enter Supabase URL (or press Enter for http://localhost:54321)"
if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    $supabaseUrl = "http://localhost:54321"
}

Write-Host "`nTo get anon key:" -ForegroundColor Yellow
Write-Host "  Local: run 'npx supabase start' and copy anon key"
Write-Host "  Cloud: Supabase Dashboard → Settings → API → anon/public key`n"

$anonKey = Read-Host "Enter Supabase Anon Key"
if ([string]::IsNullOrWhiteSpace($anonKey)) {
    Write-Host "Error: Anon key is required!" -ForegroundColor Red
    exit 1
}

# User credentials
$email = Read-Host "Enter email (or press Enter for test@example.com)"
if ([string]::IsNullOrWhiteSpace($email)) {
    $email = "test@example.com"
}

$password = Read-Host "Enter password (or press Enter for Test123456!)"
if ([string]::IsNullOrWhiteSpace($password)) {
    $password = "Test123456!"
}

Write-Host "`nAttempting login..." -ForegroundColor Yellow
Write-Host "  URL: $supabaseUrl"
Write-Host "  Email: $email`n"

# Login
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=password" `
        -Method POST `
        -Headers @{
            "apikey" = $anonKey
            "Content-Type" = "application/json"
        } `
        -Body $loginBody
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host ""
    
    # Display token
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "Access Token:" -ForegroundColor Green
    Write-Host $response.access_token -ForegroundColor White
    Write-Host ""
    
    # Display user info
    Write-Host "User ID:" -ForegroundColor Green
    Write-Host $response.user.id -ForegroundColor White
    Write-Host ""
    
    Write-Host "Email:" -ForegroundColor Green
    Write-Host $response.user.email -ForegroundColor White
    Write-Host ""
    
    Write-Host "Token expires at:" -ForegroundColor Green
    $expiresAt = [DateTimeOffset]::FromUnixTimeSeconds($response.expires_at).LocalDateTime
    Write-Host $expiresAt.ToString("yyyy-MM-dd HH:mm:ss") -ForegroundColor White
    Write-Host "============================================`n" -ForegroundColor Cyan
    
    # Copy to clipboard
    try {
        $response.access_token | Set-Clipboard
        Write-Host "✓ Token copied to clipboard!" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Could not copy to clipboard" -ForegroundColor Yellow
    }
    
    # Save to environment variable
    $saveToEnv = Read-Host "`nSave to environment variable? (y/n)"
    if ($saveToEnv -eq "y" -or $saveToEnv -eq "Y") {
        $env:TEST_TOKEN = $response.access_token
        $env:TEST_USER_ID = $response.user.id
        Write-Host "✓ Saved to `$env:TEST_TOKEN and `$env:TEST_USER_ID" -ForegroundColor Green
        Write-Host "  (Available only in this PowerShell session)" -ForegroundColor Gray
    }
    
    # Create config file
    Write-Host ""
    $saveToFile = Read-Host "Save to test-config.ps1 file? (y/n)"
    if ($saveToFile -eq "y" -or $saveToFile -eq "Y") {
        $config = @"
# Test Configuration - Generated $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# This file contains sensitive tokens - DO NOT commit to git!

`$env:SUPABASE_URL = "$supabaseUrl"
`$env:SUPABASE_ANON_KEY = "$anonKey"
`$env:TEST_TOKEN = "$($response.access_token)"
`$env:TEST_USER_ID = "$($response.user.id)"
`$env:TEST_EMAIL = "$($response.user.email)"

Write-Host "✓ Test configuration loaded" -ForegroundColor Green
Write-Host "  Token expires at: $(([DateTimeOffset]::FromUnixTimeSeconds($($response.expires_at)).LocalDateTime).ToString("yyyy-MM-dd HH:mm:ss"))" -ForegroundColor Gray

# Quick test function
function Test-Token {
    Write-Host "`nTesting token..." -ForegroundColor Yellow
    `$testUrl = "http://localhost:3000/api/flashcards"
    `$testBody = @{
        generationId = 1
        flashcards = @()
    } | ConvertTo-Json
    
    try {
        `$response = Invoke-WebRequest -Uri `$testUrl -Method POST ``
            -Headers @{ "Authorization" = "Bearer `$env:TEST_TOKEN"; "Content-Type" = "application/json" } ``
            -Body `$testBody -UseBasicParsing
        Write-Host "✗ Token works but request failed validation (expected)" -ForegroundColor Yellow
    } catch {
        if (`$_.Exception.Response.StatusCode.value__ -eq 400) {
            Write-Host "✓ Token is valid (got expected 400 for empty flashcards)" -ForegroundColor Green
        } elseif (`$_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "✗ Token is invalid or expired" -ForegroundColor Red
        } else {
            Write-Host "? Got status: `$(`$_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        }
    }
}
"@
        
        $config | Out-File -FilePath "test-config.ps1" -Encoding UTF8
        Write-Host "✓ Saved to test-config.ps1" -ForegroundColor Green
        Write-Host ""
        Write-Host "To use in future sessions:" -ForegroundColor Yellow
        Write-Host "  . .\test-config.ps1" -ForegroundColor Gray
        Write-Host "  Test-Token" -ForegroundColor Gray
    }
    
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Make sure you have a generation in database (see SETUP-TEST-DATA.md)"
    Write-Host "2. Run: .\test-quick.ps1"
    Write-Host "3. Use the token above when prompted`n"
    
} catch {
    Write-Host "✗ Login failed!" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $stream.ReadToEnd()
        
        Write-Host "Status: $statusCode" -ForegroundColor Red
        Write-Host "Response:" -ForegroundColor Red
        try {
            $errorBody | ConvertFrom-Json | ConvertTo-Json -Depth 10
        } catch {
            $errorBody
        }
        Write-Host ""
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
    
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - User doesn't exist (create in Supabase Dashboard → Authentication)"
    Write-Host "  - Wrong email/password"
    Write-Host "  - Wrong anon key"
    Write-Host "  - Supabase not running (run 'npx supabase start')"
    Write-Host "  - Wrong Supabase URL`n"
    
    exit 1
}

