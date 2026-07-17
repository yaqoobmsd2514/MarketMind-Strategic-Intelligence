@echo off
echo ========================================
echo    MarketMind - Starting Project
echo ========================================
echo.
echo Starting Backend Server...
start "MarketMind Backend" cmd /k "cd marketmind-backend && npm install && node server.js"
echo.
timeout /t 4 /nobreak > nul
echo Starting Frontend...
start "MarketMind Frontend" cmd /k "cd marketmind-frontend && npm install && npm run dev"
echo.
timeout /t 5 /nobreak > nul
echo.
echo ========================================
echo  Backend:  http://localhost:4000
echo  Frontend: http://localhost:3000
echo ========================================
echo.
echo Opening browser...
start http://localhost:3000
echo.
pause
