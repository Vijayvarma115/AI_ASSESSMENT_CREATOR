# 🚀 Deployment Checklist

## Pre-Deployment (Local)

- [ ] Get Groq API key from https://console.groq.com
- [ ] Fill in `.env` file with `GROQ_API_KEY`
- [ ] Test locally: `docker-compose up -d`
- [ ] Verify it works: `http://localhost:3000`
- [ ] Push to GitHub repository

## Railway Deployment (5 minutes)

### Step 1: Create Railway Account
- [ ] Go to https://railway.app
- [ ] Sign up with GitHub
- [ ] Authorize Railway to access your repositories

### Step 2: Create New Project
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Select your `ai-assessment-creator` repository
- [ ] Railway auto-detects `docker-compose.yml` ✅

### Step 3: Add Database Services
- [ ] In Railway, click "Add" (top right)
- [ ] Search and add "MongoDB" plugin
- [ ] Search and add "Redis" plugin
- [ ] Wait for plugins to initialize (2-3 minutes)

### Step 4: Configure Environment Variables
- [ ] Go to "Variables" tab
- [ ] Railway auto-populates: `MONGODB_URI`, `REDIS_URL`
- [ ] Add manually:
  - `GROQ_API_KEY` - your key from step 1
  - `FRONTEND_URL` - Set to your frontend service URL (copy after first deploy)
  - `NODE_ENV` - `production`

### Step 5: Deploy
- [ ] Click "Deploy" button
- [ ] Wait for build to complete (~10 minutes)
- [ ] Check logs for any errors
- [ ] Copy frontend service URL

### Step 6: Get Your Shareable Link
- [ ] Frontend URL = Your deployment link
- [ ] Example: `https://ai-assessment-creator-prod.railway.app`
- [ ] Share this link with your users! 🎉

## Post-Deployment Testing

```bash
# The frontend should be accessible at your Railway URL
# Test WebSocket connection works
# Try creating an assignment
# Verify AI generation works (requires Groq API)
```

## Environment Variables Reference

| Variable | Value | Where to find |
|----------|-------|--------------|
| `GROQ_API_KEY` | Your API key | https://console.groq.com |
| `MONGODB_URI` | Auto-populated by Railway | - |
| `REDIS_URL` | Auto-populated by Railway | - |
| `FRONTEND_URL` | Your Railway frontend URL | Railway dashboard |
| `NODE_ENV` | `production` | Manual |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check build logs in Railway. Ensure `docker-compose.prod.yml` is correct |
| WebSocket won't connect | Update `FRONTEND_URL` to match your Railway frontend URL |
| Groq API errors | Verify `GROQ_API_KEY` is correct and has credits |
| Database connection failed | Wait for MongoDB/Redis plugins to fully initialize |
| 502 Bad Gateway | Check if backend service is healthy in Railway logs |

## Rolling Back / Redeploying

- Push new code to GitHub
- Railway automatically redeploys on new commits
- Or manually trigger redeploy from Railway dashboard

---

**Need help?**
- Railway docs: https://docs.railway.app
- Check service logs in Railway dashboard
- Verify environment variables are set correctly
