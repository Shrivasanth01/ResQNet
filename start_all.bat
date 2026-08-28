@echo off
echo =====================================================
echo        ResQNet Complete Local Host Launcher          
echo =====================================================

set ROOT_DIR=%~dp0

echo [1/3] Launching FastAPI Backend (Port 8000)...
start "ResQNet FastAPI Backend (Port 8000)" cmd /k "cd /d %ROOT_DIR%backend && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Launching Command Center Dashboard (Port 3000)...
start "ResQNet Disaster Command Center (Port 3000)" cmd /k "cd /d %ROOT_DIR%dashboard && npm run dev"

echo [3/3] Launching Mobile Edge Client (Port 8081)...
start "ResQNet Mobile Node Web (Port 8081)" cmd /k "cd /d %ROOT_DIR%mobile && npx expo start --web"

echo.
echo All services launched!
echo - Backend API & Docs: http://localhost:8000/docs
echo - Command Center:     http://localhost:3000
echo - Mobile Web App:     http://localhost:8081
pause
