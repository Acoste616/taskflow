Write-Host "Starting TaskFlow with Cloudflare..." -ForegroundColor Green

# Start backend
Write-Host "Starting backend..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -PassThru
Start-Sleep -Seconds 5

# Start Cloudflare tunnel
Write-Host "Starting Cloudflare tunnel..." -ForegroundColor Yellow
$job = Start-Job -ScriptBlock {
    & cloudflared tunnel --url http://localhost:3001
}

# Wait for tunnel and get output
Start-Sleep -Seconds 10
$output = Receive-Job -Job $job
$tunnelUrl = $output | Select-String -Pattern "https://[^`s]*\.trycloudflare\.com" | ForEach-Object { $_.Matches[0].Value }

if ($tunnelUrl) {
    Write-Host "Tunnel URL: $tunnelUrl" -ForegroundColor Green
    
    # Create .env file
    "VITE_API_URL=$tunnelUrl/api" | Out-File -FilePath "taskflow\.env" -Force
    
    # Start frontend
    Write-Host "Starting frontend..." -ForegroundColor Yellow
    Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd taskflow; npm run dev" -PassThru
    
    Write-Host ""
    Write-Host "=== READY ===" -ForegroundColor Green
    Write-Host "Backend API: $tunnelUrl/api" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "FOR ANDROID:" -ForegroundColor Yellow
    Write-Host "1. Install PWA from: http://YOUR-PC-IP:5173/mobile" -ForegroundColor White
    Write-Host "2. Or use API URL: $tunnelUrl/api/bookmarks/quick" -ForegroundColor White
} else {
    Write-Host "Failed to get tunnel URL" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Red
Read-Host