# 🚂 Railway Deployment Guide

This guide will help you deploy the My Songbook backend to Railway.

## Prerequisites

1. A Railway account ([railway.app](https://railway.app))
2. GitHub account (for connecting your repository)
3. Your backend code ready in the `backend/` directory

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your code is committed and pushed to GitHub:
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Select your `my-songbook` repository
5. Railway will create a new project

### 3. Configure the Service

1. In your Railway project, click **"New Service"**
2. Select **"GitHub Repo"** and choose your repository
3. Railway will auto-detect it's a Node.js project

### 4. Set Root Directory

1. Go to your service → **Settings** → **Source**
2. Set **Root Directory** to: `backend`
3. This tells Railway where your backend code is located

### 5. Configure Build Settings

Railway should auto-detect, but verify:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

These are already configured in `backend/railway.json`.

### 6. Add Environment Variables

Go to your service → **Variables** tab and add:

#### Required Variables:
- `NODE_ENV=production`

#### Optional Variables:
- `OPENAI_API_KEY=your_key_here` (if using OpenAI OCR)
- `FRONTEND_URL=https://your-frontend-domain.com` (for CORS - set if you have a frontend domain)
- `CUSTOM_DOMAIN=https://your-custom-domain.com` (if using custom domain)

**Note**: Railway automatically sets `PORT` - you don't need to set it manually.

### 7. Deploy

1. Railway will automatically deploy when you push to your connected branch
2. Or click **"Deploy"** manually
3. Wait for the build to complete (usually 2-5 minutes)

### 8. Get Your Backend URL

1. After deployment, go to your service → **Settings** → **Networking**
2. Railway provides a URL like: `https://your-app-name.up.railway.app`
3. Copy this URL - this is your backend API URL

### 9. Test Your Backend

Test the health endpoint:
```bash
curl https://your-app-name.up.railway.app/health
```

Should return: `{"status":"ok"}`

Test the songs endpoint:
```bash
curl https://your-app-name.up.railway.app/api/songs
```

Should return: `[]` (empty array if no songs)

### 10. Update Frontend

1. Create/update `.env` in your project root:
   ```bash
   EXPO_PUBLIC_API_URL=https://your-app-name.up.railway.app
   ```

2. Rebuild your Android app:
   ```bash
   npm run build:apk
   ```

3. Test the app - it should now connect to Railway backend!

## Important Notes

### Database Persistence

⚠️ **SQLite on Railway**: Railway has ephemeral storage, meaning your database file may be lost on redeploy.

**Options:**
1. **Use Railway PostgreSQL** (Recommended for production):
   - Add PostgreSQL service in Railway
   - Update your code to use PostgreSQL instead of SQLite
   - Data will persist across deployments

2. **Use Railway Volumes** (if available on your plan):
   - Add a volume to persist the `backend/db/` directory
   - This will keep your SQLite database

3. **Keep SQLite** (for testing):
   - Accept that data may be lost on redeploy
   - Good for development/testing only

### File Uploads

The `uploads/` folder is also ephemeral. For production, consider:
- Using cloud storage (AWS S3, Cloudinary, etc.)
- Or use Railway volumes for the uploads directory

### Custom Domain

To use a custom domain:
1. Go to Settings → Networking
2. Add your custom domain
3. Update DNS records as instructed by Railway
4. Set `CUSTOM_DOMAIN` environment variable

### Monitoring

Railway provides:
- Logs in real-time
- Metrics and usage stats
- Automatic restarts on failure

## Troubleshooting

### Build Fails
- Check logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compiles: `cd backend && npm run build`

### CORS Errors
- Add your frontend URL to `FRONTEND_URL` environment variable
- Or update CORS in `backend/index.ts` to include your domain

### Database Not Found
- SQLite database is created on first run
- If lost, it will be recreated automatically
- Consider migrating to PostgreSQL for persistence

### Port Errors
- Railway sets `PORT` automatically - don't override it
- Your code already uses `process.env.PORT || 3001` ✅

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Get Railway URL
3. ✅ Update frontend `.env` with Railway URL
4. ✅ Rebuild Android APK
5. ✅ Test everything works
6. (Optional) Set up PostgreSQL for database persistence
7. (Optional) Deploy frontend to Vercel/Netlify

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

