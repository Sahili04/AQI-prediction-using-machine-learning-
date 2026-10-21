@echo off
echo ========================================================
echo   Air Quality Prediction System (AQI ML Project)
echo ========================================================
echo.
echo Starting FastAPI Backend and Vite Frontend...
echo.

:: Launch Backend
start "AQI Prediction - Backend (Port 8000)" cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"

:: Launch Frontend
start "AQI Prediction - Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Backend URL:  http://127.0.0.1:8000
echo API Docs:     http://127.0.0.1:8000/docs
echo Frontend URL: http://localhost:5173
echo.
echo Both servers have been launched in separate windows!
echo Keep those windows open while using the application.
echo ========================================================
pause
