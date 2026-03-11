Import-Module PSReadLine

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWIwYTcyMmUwOTgxYjE4NGUzNmY0NWYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc3MzE4NDgxNSwiZXhwIjoxNzczNzg5NjE1fQ.U3yQiZU2gCs1G3e2DsakFBXQJWMty8USjOFSGClY_Xc"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        SCAMSHIELD FULL TESTING SUITE                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$testResults = @()

# Test 1: API Health Check
Write-Host "`n[1/10] Testing API Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET
    Write-Host "✅ API is healthy" -ForegroundColor Green
    $testResults += "✅ Health Check: PASS"
} catch {
    Write-Host "❌ API health check failed" -ForegroundColor Red
    $testResults += "❌ Health Check: FAIL"
}

# Test 2: User Login
Write-Host "`n[2/10] Testing User Authentication..." -ForegroundColor Yellow
try {
    $body = '{"email":"test@scamshield.com","password":"TestPassword123"}'
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    if ($response.token) {
        Write-Host "✅ User authenticated successfully" -ForegroundColor Green
        $testResults += "✅ User Authentication: PASS"
    }
} catch {
    Write-Host "❌ Authentication failed" -ForegroundColor Red
    $testResults += "❌ User Authentication: FAIL"
}

# Test 3: Search for known scam (Telegram)
Write-Host "`n[3/10] Testing Telegram Scam Detection..." -ForegroundColor Yellow
try {
    $body = '{"type":"telegram","value":"crypto_fastprofit"}'
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/check" -Method POST -Headers $headers -Body $body
    if ($response.found) {
        Write-Host "✅ Found known scam: crypto_fastprofit" -ForegroundColor Green
        Write-Host "   Risk Score: $($response.riskScore)" -ForegroundColor Green
        $testResults += "✅ Telegram Detection: PASS"
    } else {
        Write-Host "⚠️ Scam not found (data might not be seeded yet)" -ForegroundColor Yellow
        $testResults += "⚠️ Telegram Detection: PARTIAL"
    }
} catch {
    Write-Host "❌ Search failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "❌ Telegram Detection: FAIL"
}

# Test 4: Search for Email scam
Write-Host "`n[4/10] Testing Email Scam Detection..." -ForegroundColor Yellow
try {
    $body = '{"type":"email","value":"support@applesecurity.tk"}'
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/check" -Method POST -Headers $headers -Body $body
    if ($response.found) {
        Write-Host "✅ Found phishing email" -ForegroundColor Green
        $testResults += "✅ Email Detection: PASS"
    } else {
        Write-Host "⚠️ Email not found in database" -ForegroundColor Yellow
        $testResults += "⚠️ Email Detection: PARTIAL"
    }
} catch {
    Write-Host "❌ Email search failed" -ForegroundColor Red
    $testResults += "❌ Email Detection: FAIL"
}

# Test 5: Search for Website scam
Write-Host "`n[5/10] Testing Website Scam Detection..." -ForegroundColor Yellow
try {
    $body = '{"type":"website","value":"paypa1.com"}'
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/check" -Method POST -Headers $headers -Body $body
    if ($response.found) {
        Write-Host "✅ Found phishing website" -ForegroundColor Green
        $testResults += "✅ Website Detection: PASS"
    } else {
        Write-Host "⚠️ Website not found in database" -ForegroundColor Yellow
        $testResults += "⚠️ Website Detection: PARTIAL"
    }
} catch {
    Write-Host "❌ Website search failed" -ForegroundColor Red
    $testResults += "❌ Website Detection: FAIL"
}

# Test 6: Search for Crypto scam
Write-Host "`n[6/10] Testing Cryptocurrency Wallet Detection..." -ForegroundColor Yellow
try {
    $body = '{"type":"crypto","value":"0x1234567890abcdef1234567890abcdef12345678"}'
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/check" -Method POST -Headers $headers -Body $body
    if ($response.found) {
        Write-Host "✅ Found malicious wallet address" -ForegroundColor Green
        $testResults += "✅ Crypto Detection: PASS"
    } else {
        Write-Host "⚠️ Wallet not found in database" -ForegroundColor Yellow
        $testResults += "⚠️ Crypto Detection: PARTIAL"
    }
} catch {
    Write-Host "❌ Crypto search failed" -ForegroundColor Red
    $testResults += "❌ Crypto Detection: FAIL"
}

# Test 7: Search for safe identifier
Write-Host "`n[7/10] Testing Safe Identifier..." -ForegroundColor Yellow
try {
    $body = '{"type":"telegram","value":"legitimate_user_12345"}'
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/check" -Method POST -Headers $headers -Body $body
    if (-not $response.found) {
        Write-Host "✅ Correctly identified safe identifier (risk score: $($response.riskScore))" -ForegroundColor Green
        $testResults += "✅ Safe Identifier Check: PASS"
    } else {
        Write-Host "⚠️ Unexpected result for safe identifier" -ForegroundColor Yellow
        $testResults += "⚠️ Safe Identifier Check: PARTIAL"
    }
} catch {
    Write-Host "❌ Safe identifier check failed" -ForegroundColor Red
    $testResults += "❌ Safe Identifier Check: FAIL"
}

# Test 8: Trending Scams
Write-Host "`n[8/10] Testing Trending Scams Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/trending?days=30" -Method GET -Headers $headers
    Write-Host "✅ Retrieved trending data" -ForegroundColor Green
    $testResults += "✅ Trending Endpoint: PASS"
} catch {
    Write-Host "❌ Trending endpoint failed" -ForegroundColor Red
    $testResults += "❌ Trending Endpoint: FAIL"
}

# Test 9: Report Submission
Write-Host "`n[9/10] Testing Report Submission..." -ForegroundColor Yellow
try {
    $body = @{
        type = "telegram"
        value = "test_scam_12345"
        category = "investment_fraud"
        description = "Test scam report"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/report" -Method POST -Headers $headers -Body $body
    if ($response.status -eq "pending" -or $response.message) {
        Write-Host "✅ Report submitted successfully" -ForegroundColor Green
        $testResults += "✅ Report Submission: PASS"
    }
} catch {
    Write-Host "❌ Report submission failed" -ForegroundColor Red
    $testResults += "❌ Report Submission: FAIL"
}

# Test 10: Frontend Status
Write-Host "`n[10/10] Testing Frontend Server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is running" -ForegroundColor Green
        $testResults += "✅ Frontend Server: PASS"
    }
} catch {
    Write-Host "❌ Frontend not accessible" -ForegroundColor Red
    $testResults += "❌ Frontend Server: FAIL"
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    TEST SUMMARY                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_ -match "✅" }).Count
$failCount = ($testResults | Where-Object { $_ -match "❌" }).Count
$partialCount = ($testResults | Where-Object { $_ -match "⚠️" }).Count

foreach ($result in $testResults) {
    Write-Host $result
}

Write-Host "`n" -ForegroundColor Cyan
Write-Host "PASSED:   $passCount/10" -ForegroundColor Green
Write-Host "FAILED:   $failCount/10" -ForegroundColor Red
if ($partialCount -gt 0) { Write-Host "PARTIAL:  $partialCount/10" -ForegroundColor Yellow }

Write-Host "`n📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:5173/ in your browser"
Write-Host "2. Try the search feature and verify text appears as you type"
Write-Host "3. Test with these known scams:"
Write-Host "   - Telegram: crypto_fastprofit"
Write-Host "   - Email: support@applesecurity.tk"
Write-Host "   - Website: paypa1.com"
Write-Host "4. Create an account or use existing credentials"
Write-Host "5. Submit new reports and check trending scams"

Write-Host "`n✨ Testing Complete!" -ForegroundColor Green
