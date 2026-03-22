#!/bin/bash

# Quick setup script for Railway deployment
# This prepares your project for deployment

echo "🚀 AI Assessment Creator - Deployment Setup"
echo "==========================================="

# 1. Initialize git if not already done
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - AI Assessment Creator"
fi

# 2. Create .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file (you'll need to fill in GROQ_API_KEY)..."
    cp .env.example .env
    echo "⚠️  Update .env with your GROQ_API_KEY from https://console.groq.com"
fi

# 3. Test local build
echo "🏗️  Testing Docker build..."
docker-compose -f docker-compose.prod.yml build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get your Groq API key from https://console.groq.com"
echo "2. Update .env with your GROQ_API_KEY"
echo "3. Push to GitHub: git push -u origin main"
echo "4. Deploy to Railway.app:"
echo "   - Sign up at https://railway.app"
echo "   - Create new project from GitHub repo"
echo "   - Railway auto-detects docker-compose.yml"
echo "   - Add environment variables in Railway dashboard"
echo "   - Deploy!"
echo ""
echo "Once deployed, share the Railway frontend URL with your users!"
