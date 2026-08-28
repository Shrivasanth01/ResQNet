# ResQNet Complete Local Host Launch Script

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "       ResQNet Complete Local Host Launcher          " -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan

$ROOT_DIR = Get-Location

# 1. Start FastAPI Backend (Port 8000)
Write-Host "[1/3] Starting FastAPI Central Cloud Backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\backend'; .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# 2. Start Disaster Command Center Dashboard (Port 3000)
Write-Host "[2/3] Starting Next.js Command Center Dashboard on http://localhost:3000 ..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\dashboard'; npm run dev"

# 3. Start ResQNet Mobile Node Web Client (Port 8081)
Write-Host "[3/3] Starting Expo Mobile Client on http://localhost:8081 ..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\mobile'; npx expo start --web"

Write-Host "`nAll 3 ResQNet services are spinning up in separate windows!" -ForegroundColor Yellow
Write-Host "- Backend API & Swagger Docs : http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "- Disaster Command Center     : http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Mobile Node Web App        : http://localhost:8081" -ForegroundColor Cyan
