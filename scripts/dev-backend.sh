#!/bin/bash

# Development script for backend only
echo "🚀 Starting TaDa Backend Development Environment..."

# Check if we're in the right directory
if [ ! -d "backend" ]; then
  echo "❌ Please run this script from TaDa root directory"
  exit 1
fi

# Start PostgreSQL with Docker
echo "📊 Starting PostgreSQL..."
docker-compose up postgres -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to start..."
sleep 5

# Start backend in development mode
echo "🔧 Starting NestJS backend..."
cd backend
npm install
npm run start:dev 