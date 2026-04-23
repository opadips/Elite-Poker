#!/bin/bash

echo "Starting Poker Online..."

#
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# 
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# 
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# 
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd backend && npm start; exec bash"
    gnome-terminal -- bash -c "cd frontend && npm run dev; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -e "cd backend && npm start; exec bash" &
    xterm -e "cd frontend && npm run dev; exec bash" &
elif command -v konsole &> /dev/null; then
    konsole --new-tab -e "cd backend && npm start" &
    konsole --new-tab -e "cd frontend && npm run dev" &
else
    echo "No known terminal emulator found. Running in background..."
    cd backend && npm start &
    cd frontend && npm run dev &
fi

echo "Servers started. Access the game at http://localhost:5173"