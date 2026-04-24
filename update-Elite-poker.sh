#!/bin/bash

echo "========================================"
echo "   Updating Elite Poker Project"
echo "========================================"
echo

if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install Git first."
    exit 1
fi

echo "[1/3] Pulling latest changes from GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "Failed to pull updates. Check your internet and repository."
    exit 1
fi
echo

echo "[2/3] Updating backend dependencies..."
cd backend && npm install
if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies."
    exit 1
fi
cd ..
echo

echo "[3/3] Updating frontend dependencies..."
cd frontend && npm install
if [ $? -ne 0 ]; then
    echo "Failed to install frontend dependencies."
    exit 1
fi
cd ..
echo

echo "========================================"
echo "   Update completed successfully!"
echo "========================================"
echo
echo "You may need to restart the game servers if they were running."
echo "To start: ./start-poker.sh"
echo