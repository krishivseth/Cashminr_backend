#!/bin/bash

echo "🚀 Starting Cashminr Articles Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your OPENAI_API_KEY"
    echo "You can copy from env.example and add your actual API key"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if OPENAI_API_KEY is set and not the placeholder
if grep -q "OPENAI_API_KEY=your_openai_api_key_here" .env; then
    echo "❌ Please edit .env and add your actual OPENAI_API_KEY"
    exit 1
fi

echo "✅ Environment configured correctly"
echo "🚀 Starting server..."
echo "📝 Article generation scheduled for every hour"
echo "🔗 Health check: http://localhost:3001/health"

npm start 