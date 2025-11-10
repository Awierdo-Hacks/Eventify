#!/bin/bash
# Build script voor Render deployment
# Dit script wordt automatisch uitgevoerd tijdens build op Render

set -e

echo "🔨 Starting Render build..."

# Installeer dependencies
echo "📦 Installing dependencies..."
npm ci

# Genereer Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build Next.js applicatie
echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
