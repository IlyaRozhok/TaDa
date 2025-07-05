#!/bin/bash

echo "🎯 Setting up TaDa Rental Platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Install frontend dependencies (when ready)
# echo "📦 Installing frontend dependencies..."
# cd frontend && npm install && cd ..

# Copy environment file
echo "⚙️  Setting up environment..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from .env.example"
    echo "📝 Please edit backend/.env with your configuration"
fi

# Create uploads directory
mkdir -p uploads
echo "📁 Created uploads directory"

echo "✅ Setup complete!"
echo ""
echo "🚀 To start development:"
echo "   npm run docker:up    # Full stack with Docker"
echo "   npm run dev:backend  # Backend only"
echo "   ./scripts/dev-backend.sh  # Backend with database"
echo ""
echo "📚 Documentation: http://localhost:5000/api/docs" 