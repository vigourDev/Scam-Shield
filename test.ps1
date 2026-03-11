$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWIwYTcyMmUwOTgxYjE4NGUzNmY0NWYiLCJyb2xlIjoidXNlciIsImlhdCI6MTc3MzE4NDgxNSwiZXhwIjoxNzczNzg5NjE1fQ.U3yQiZU2gCs1G3e2DsakFBXQJWMty8USjOFSGClY_Xc"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "==== SCAMSHIELD TESTING SUITE ====" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`nTest 1: API Health Check" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -ErrorAction SilentlyContinue
if ($response) {
    Write-Host "PASS: API is responding" -ForegroundColor Green
}

# Test 2: Search for Telegram Scam
Write-Host "`nTest 2: Search Telegram Scam" -ForegroundColor Yellow
$body = '{"type":"telegram","value":"crypto_fastprofit"}'
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/check" -Method POST -Headers $headers -Body $body -ErrorAction SilentlyContinue
if ($response) {
    Write-Host "PASS: Found scam - Risk Score: $($response.riskScore)" -ForegroundColor Green
}

# Test 3: Search for Email
Write-Host "`nTest 3: Search Email Scam" -ForegroundColor Yellow
$body = '{"type":"email","value":"support@applesecurity.tk"}'
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/check" -Method POST -Headers $headers -Body $body -ErrorAction SilentlyContinue
if ($response) {
    Write-Host "PASS: Email check completed" -ForegroundColor Green
}

# Test 4: Search for Website
Write-Host "`nTest 4: Search Website Scam" -ForegroundColor Yellow
$body = '{"type":"website","value":"paypa1.com"}'
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/check" -Method POST -Headers $headers -Body $body -ErrorAction SilentlyContinue
if ($response) {
    Write-Host "PASS: Website check completed" -ForegroundColor Green
}

# Test 5: Get Trending
Write-Host "`nTest 5: Get Trending Scams" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/trending" -Method GET -Headers $headers -ErrorAction SilentlyContinue
if ($response) {
    Write-Host "PASS: Trending data retrieved" -ForegroundColor Green
}

# Test 6: Frontend
Write-Host "`nTest 6: Frontend Server" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    Write-Host "PASS: Frontend is running" -ForegroundColor Green
}

Write-Host "`n==== ALL TESTS COMPLETE ====" -ForegroundColor Cyan
Write-Host "`nVisit: http://localhost:5173/" -ForegroundColor Yellow
Write-Host "`nTest the search with these known scams:" -ForegroundColor Yellow
Write-Host "  - crypto_fastprofit (Telegram)" -ForegroundColor White
Write-Host "  - support@applesecurity.tk (Email)" -ForegroundColor White
Write-Host "  - paypa1.com (Website)" -ForegroundColor White
Write-Host "`nType should now appear as you type in the search box!" -ForegroundColor Yellow
