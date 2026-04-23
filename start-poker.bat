@echo off
title Poker Server Launcher
echo Starting Poker Online...

:: 
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js and try again.
    pause
    exit /b 1
)

:: 
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

:: 
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

:: اجرای بک‌اند در یک پنجره جدید
echo Starting backend server...
start "Poker Backend" cmd /k "cd backend && npm start"

::
timeout /t 2 /nobreak >nul

::
echo Starting frontend dev server...
start "Poker Frontend" cmd /k "cd frontend && npm run dev"

echo Both servers started. Wait a few seconds, then open http://localhost:5173
pause