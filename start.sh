#!/bin/bash
# Start script voor Render deployment

set -e

echo "🚀 Starting Eventify..."

# Ensure Prisma Client is generated
npx prisma generate

# Start Next.js server
echo "▶️ Starting Next.js server..."
npm start
