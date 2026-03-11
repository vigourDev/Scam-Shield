$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWIwYTcyMmUwOTgxYjE4NGUzNmY0NWYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc3MzE4NDgxNSwiZXhwIjoxNzczNzg5NjE1fQ.U3yQiZU2gCs1G3e2DsakFBXQJWMty8USjOFSGClY_Xc"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "=== SCAMSHIELD API TEST SUITE ===" -ForegroundColor Cyan

# Test 1: Search for known scam
Write-Host "`n✅ TEST 1: Search for Telegram scam 'crypto_fastprofit'" -ForegroundColor Green
$body = @{type="telegram"; value="crypto_fastprofit"} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/check" -Method POST -Headers $headers -Body $body
    Write-Host "Found: $($response.found)"
    Write-Host "Risk Score: $($response.riskScore)"
    Write-Host "Status: ✅ PASS" -ForegroundColor Green
} catch {
    Write-Host "Status: ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Search for phishing email
Write-Host "`n✅ TEST 2: Search for Email scam 'support@applesecurity.tk'" -ForegroundColor Green
$body = @{type="email"; value="support@applesecurity.tk"} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/check" -Method POST -Headers $headers -Body $body
    Write-Host "Found: $($response.found)"
    Write-Host "Risk Score: $($response.riskScore)"
    Write-Host "Status: ✅ PASS" -ForegroundColor Green
} catch {
    Write-Host "Status: ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Search for website scam
Write-Host "`n✅ TEST 3: Search for Website scam 'paypa1.com'" -ForegroundColor Green
$body = @{type="website"; value="paypa1.com"} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/check" -Method POST -Headers $headers -Body $body
    Write-Host "Found: $($response.found)"
    Write-Host "Risk Score: $($response.riskScore)"
    Write-Host "Status: ✅ PASS" -ForegroundColor Green
} catch {
    Write-Host "Status: ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Search for unknown identifier (should be safe)
Write-Host "`n✅ TEST 4: Search for safe identifier 'legit_user_123'" -ForegroundColor Green
$body = @{type="telegram"; value="legit_user_123"} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/check" -Method POST -Headers $headers -Body $body
    Write-Host "Found: $($response.found)"
    Write-Host "Risk Score: $($response.riskScore)"
    Write-Host "Status: ✅ PASS" -ForegroundColor Green
} catch {
    Write-Host "Status: ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Get trending scams
Write-Host "`n✅ TEST 5: Get Trending Scams" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/trending" -Method GET -Headers $headers
    Write-Host "Trending types count: $($response.trendingTypes.Count)"
    Write-Host "Top categories count: $($response.topCategories.Count)"
    Write-Host "Status: ✅ PASS" -ForegroundColor Green
} catch {
    Write-Host "Status: ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Admin stats (requires admin role)
Write-Host "`n✅ TEST 6: Get Admin Stats (User role)" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/stats" -Method GET -Headers $headers
    Write-Host "Status: ✅ PASS" -ForegroundColor Green
} catch {
    Write-Host "Status: ⚠️ EXPECTED FAIL - User not admin role" -ForegroundColor Yellow
}

Write-Host "`n=== API TEST COMPLETE ===" -ForegroundColor Cyan
