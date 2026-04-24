@echo off
title Update Poker Online - Elite Poker
echo ========================================
echo    Updating Elite Poker Project
echo ========================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git is not installed or not in PATH. Please install Git first.
    pause
    exit /b 1
)

echo [1/3] Pulling latest changes from GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo Failed to pull updates. Check your internet and repository.
    pause
    exit /b 1
)
echo.

echo [2/3] Updating backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo [3/3] Updating frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo ========================================
echo    Update completed successfully!
echo ========================================
echo.
echo You may need to restart the game servers if they were running.
echo To start: double-click start-poker.bat
echo.
pause