#!/bin/bash

# Jivan - Quick Start Script
# This script helps you start both backend and mobile app

echo "🏥 Jivan Healthcare Concierge - Quick Start"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check for OpenAI API key in backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found!"
    echo ""
    echo "Creating backend/.env file..."
    echo "OPENAI_API_KEY=your_key_here" > backend/.env
    echo "PORT=3000" >> backend/.env
    echo ""
    echo "📝 Please edit backend/.env and add your OpenAI API key"
    echo "   Get your key from: https://platform.openai.com/api-keys"
    echo ""
    read -p "Press Enter after you've added your API key..."
fi

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
    echo "✅ Backend dependencies installed"
    echo ""
fi

# Install mobile dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing mobile dependencies..."
    npm install
    echo "✅ Mobile dependencies installed"
    echo ""
fi

echo "🚀 Starting services..."
echo ""
echo "Backend will run on: http://localhost:3000"
echo "Mobile app will open in Expo"
echo ""
echo "To stop: Press Ctrl+C in both terminal windows"
echo ""

# Start backend in background
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start mobile app
echo ""
echo "Starting mobile app..."
cd ..
npm start

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT

