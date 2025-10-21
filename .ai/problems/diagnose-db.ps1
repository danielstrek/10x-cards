# Diagnose Database - Check generations and auth
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   Database Diagnostics" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$token = Read-Host "Enter access token (or press Enter to use test token)"
if ([string]::IsNullOrWhiteSpace($token)) {
    $token = "test-token-123"
}

Write-Host "`nChecking user authentication..." -ForegroundColor Yellow
Write-Host "Token: $($token.Substring(0, [Math]::Min(20, $token.Length)))...`n"

# Test auth by calling a simple endpoint
$apiUrl = "http://localhost:3000/api/flashcards"

try {
    # Try to get user info by making a test request
    $testBody = @{
        generationId = 1
        flashcards = @()
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
        -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
        -Body $testBody -UseBasicParsing
} catch {
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $body = $stream.ReadToEnd()
        
        Write-Host "Response Status: $statusCode" -ForegroundColor $(if ($statusCode -eq 401) { "Red" } else { "Yellow" })
        Write-Host "Response Body:" -ForegroundColor Yellow
        try {
            $body | ConvertFrom-Json | ConvertTo-Json -Depth 10
        } catch {
            $body
        }
    } else {
        Write-Host "[ERROR] Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n`n============================================" -ForegroundColor Cyan
Write-Host "   Next Steps" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "1. Check Supabase Dashboard → Authentication → Users"
Write-Host "2. Check Supabase Dashboard → Table Editor → generations"
Write-Host "3. Run this SQL to create test data:`n"

Write-Host @"
-- First, get your user ID from the token
-- Then create a test generation:

INSERT INTO generations (
  user_id,
  model,
  source_text_hash,
  source_text_length,
  generated_count,
  generation_duration,
  accepted_unedited_count,
  accepted_edited_count
) VALUES (
  'YOUR_USER_ID_HERE',  -- ⚠️ Replace with your actual user ID
  'gpt-4',
  'test-hash-' || gen_random_uuid()::text,
  1500,
  10,
  2500,
  0,
  0
) RETURNING id, user_id, model, created_at;
"@ -ForegroundColor Green

Write-Host "`n4. Update the returned 'id' in your test script`n"

