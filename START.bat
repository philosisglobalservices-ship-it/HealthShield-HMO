@echo off
echo ================================================
echo  HealthShield Nigeria HMO Platform
echo  Starting development servers...
echo ================================================
echo.

:: Start backend
echo [1/2] Starting backend on http://localhost:5000...
start "HMO Backend" cmd /k "cd /d "%~dp0backend" && set BROWSER=none && npm run dev"

:: Wait 3 seconds
timeout /t 3 /nobreak > nul

:: Start frontend  
echo [2/2] Starting frontend on http://localhost:3000...
start "HMO Frontend" cmd /k "cd /d "%~dp0frontend" && set BROWSER=none && npm start"

echo.
echo ================================================
echo  Servers starting in separate windows.
echo.
echo  Backend:   http://localhost:5000/api/health
echo  Frontend:  http://localhost:3000
echo.
echo  Demo Login:
echo    Email:    admin@healthshield.ng
echo    Password: Admin@123
echo ================================================
echo.
pause
