# 🚀 Deployment Guide

## Option 1: Railway.app (Recommended - Easiest)

Railway.app is the best option because it supports Docker natively and can handle your full docker-compose setup.

### Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/ai-assessment-creator.git
   git push -u origin main
   ```

2. **Create Railway Account** (free tier available)
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Create a new project from your GitHub repo

3. **Configure Environment Variables in Railway**
   - Go to your project settings
   - Add these environment variables:
     - `GROQ_API_KEY` - Get from https://console.groq.com
     - `MONGODB_URI` - Leave empty (Railway's MongoDB plugin will fill this)
     - `REDIS_URL` - Leave empty (Railway's Redis plugin will fill this)
     - `FRONTEND_URL` - Set to your Railway frontend deployment URL (e.g., `https://ai-assessment-frontend.up.railway.app`)
     - `PORT` - Set to `4000`

4. **Add MongoDB & Redis Plugins**
   - In Railway: Click "Add" → Select "MongoDB"
   - In Railway: Click "Add" → Select "Redis"
   - Railway automatically populates `MONGODB_URI` and `REDIS_URL` variables

5. **Deploy Frontend & Backend Separately**
   - Create 2 services in Railway:
     - **Frontend Service**: Build command: `npm run install:all && npm run build:frontend`, Start: `cd frontend && npm start`
     - **Backend Service**: Build command: `npm run build:backend`, Start: `npm start`
   - Link services: Backend service environment should have FRONTEND_URL pointing to Frontend service URL

6. **Get Your Shareable Link**
   - Your frontend URL is your deployment link to share
   - Example: `https://ai-assessment-frontend-prod.up.railway.app`

---

## Option 2: Vercel + Render (Alternative)

If you prefer splitting services across platforms:

### Frontend (Vercel):
1. Push repo to GitHub
2. Connect to Vercel: [vercel.com/new](https://vercel.com/new)
3. Select your GitHub repo
4. Set `NEXT_PUBLIC_API_URL` to your backend URL
5. Deploy

### Backend (Render):
1. Create account at [render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repo
4. Build command: `npm run build:backend`
5. Start command: `npm start`
6. Add environment variables (MongoDB + Redis addresses)

---

## Option 3: Docker on DigitalOcean (Most Control)

1. Create DigitalOcean Droplet (Ubuntu 22.04)
2. SSH into droplet and install Docker
3. Upload docker-compose.yml
4. Set environment variables in `.env`
5. Run: `docker-compose up -d`
6. Use a reverse proxy (nginx) to serve your app
7. Use Let's Encrypt for HTTPS

---

## Environment Variables Checklist

```
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=mongodb://user:pass@host:27017/ai-assessment
REDIS_URL=redis://:password@host:6379
FRONTEND_URL=https://your-deployed-frontend.com
PORT=4000
NODE_ENV=production
```

---

## Quick Verification After Deployment

Once deployed, test these endpoints:

```bash
# Health check
curl https://your-backend.com/health

# Should return:
# {
#   "status": "ok",
#   "timestamp": "2026-03-22T...",
#   "wsClients": 0
# }
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| WebSocket connection fails | Ensure backend URL and FRONTEND_URL are set correctly |
| 502 Bad Gateway | Check if backend service is running and environment vars are set |
| MongoDB connection error | Verify MONGODB_URI is correct and network access is allowed |
| Redis connection fails | Check REDIS_URL and ensure Redis service is running |
| File uploads time out | Increase container timeout limits in your platform |

---

## Cost Breakdown (Approximate)

| Service | Platform | Monthly Cost |
|---------|----------|-------------|
| Frontend | Vercel/Railway | Free tier |
| Backend | Railway/Render | $5-7 (starter) |
| MongoDB | Railway/Render plugin | $15-20 (1GB) |
| Redis | Railway/Render plugin | $8-12 (1GB) |
| **Total** | | **~$30-40/month** or **Free tier** |

**Free tier note**: Railway offers $5/month free credits for new users. Render has a free tier for non-production apps.

---

## Recommended: Railway + Managed Services

✅ **Simplest Setup**:
1. Railway dashboard auto-detects your docker-compose.yml
2. One-click MongoDB & Redis addon
3. Automatic HTTPS
4. Environment variables auto-populated
5. Shareable URL ready in 10 minutes

