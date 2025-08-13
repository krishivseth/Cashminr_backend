#!/bin/bash

# Cashminr Articles Server Startup Script

echo "🚀 Starting Cashminr Articles Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your CLAUDE_API_KEY"
    echo "You can copy from env.example: cp env.example .env"
    exit 1
fi

# Check if CLAUDE_API_KEY is set and not the placeholder
if grep -q "CLAUDE_API_KEY=your_claude_api_key_here" .env; then
    echo "❌ Please update your .env file with a valid Claude API key"
    echo "Visit https://console.anthropic.com/ to get your API key"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "✅ Starting server..."
npm start 