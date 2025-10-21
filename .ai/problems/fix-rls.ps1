# Fix RLS - Quick migration script
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   Fix RLS - Disable Row Level Security" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "This script will disable RLS on all tables." -ForegroundColor Yellow
Write-Host "Make sure you have Supabase running and accessible.`n"

$supabaseUrl = Read-Host "Enter Supabase URL (e.g., http://localhost:54321)"
if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    Write-Host "Error: Supabase URL is required!" -ForegroundColor Red
    exit 1
}

Write-Host "`nChoose authentication method:" -ForegroundColor Yellow
Write-Host "1. Service Role Key (recommended)"
Write-Host "2. Access Token (from logged-in user)"
$authChoice = Read-Host "Choice (1 or 2)"

$authKey = ""
if ($authChoice -eq "1") {
    $authKey = Read-Host "Enter Service Role Key"
} elseif ($authChoice -eq "2") {
    $authKey = Read-Host "Enter Access Token"
} else {
    Write-Host "Invalid choice!" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($authKey)) {
    Write-Host "Error: Authentication key is required!" -ForegroundColor Red
    exit 1
}

Write-Host "`nExecuting migration..." -ForegroundColor Yellow

$sql = @"
-- Disable RLS on all tables
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS Enabled' 
        ELSE '✅ RLS Disabled' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('generations', 'flashcards', 'generation_error_logs')
ORDER BY tablename;
"@

Write-Host "SQL to execute:" -ForegroundColor Cyan
Write-Host $sql -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Execute this SQL? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

# Try using SQL Editor endpoint (if available)
$sqlEditorUrl = "$supabaseUrl/rest/v1/rpc/exec_sql"

try {
    # Note: This might not work depending on Supabase setup
    # Alternative: User should run this manually in Supabase Dashboard
    Write-Host "`nAttempting to execute via API..." -ForegroundColor Yellow
    
    $body = @{
        query = $sql
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri $sqlEditorUrl `
        -Method POST `
        -Headers @{
            "apikey" = $authKey
            "Authorization" = "Bearer $authKey"
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "✓ Migration executed successfully!" -ForegroundColor Green
    Write-Host $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "✗ API execution failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nPlease execute manually:" -ForegroundColor Yellow
    Write-Host "1. Open Supabase Dashboard" -ForegroundColor Yellow
    Write-Host "2. Go to SQL Editor" -ForegroundColor Yellow
    Write-Host "3. Copy and paste the SQL below:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $sql -ForegroundColor Green
    Write-Host ""
    Write-Host "4. Click 'Run'" -ForegroundColor Yellow
    
    # Copy to clipboard if possible
    try {
        $sql | Set-Clipboard
        Write-Host "`n✓ SQL copied to clipboard!" -ForegroundColor Green
    } catch {
        # Clipboard not available, that's ok
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify RLS is disabled (run verification SQL)"
Write-Host "2. Create test generation in database"
Write-Host "3. Run: .\test-quick.ps1"
Write-Host "============================================`n" -ForegroundColor Cyan

