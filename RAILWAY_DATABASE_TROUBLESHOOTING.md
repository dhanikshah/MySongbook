# 🔍 Railway Database Troubleshooting Guide

If your database is getting cleared after redeployment, follow these steps:

## Step 1: Verify PostgreSQL Service is Running

1. Go to Railway dashboard
2. Check if PostgreSQL service shows **green/running** status
3. If it's paused or stopped, start it

## Step 2: Verify DATABASE_URL is Set

1. Go to your **Backend service** (not PostgreSQL)
2. Go to **Settings** → **Variables**
3. Look for `DATABASE_URL` variable
4. It should look like: `postgresql://user:password@host:port/database`

**If DATABASE_URL is missing:**
1. Go to **PostgreSQL service** → **Variables**
2. Copy the `DATABASE_URL` value
3. Go to **Backend service** → **Variables**
4. Click **"+ New Variable"**
5. Name: `DATABASE_URL`
6. Value: Paste the copied value
7. Save and redeploy backend

## Step 3: Check Deployment Logs

After redeploying, check the logs. You should see:

**✅ If PostgreSQL is working:**
```
🔍 DATABASE_URL detected, using PostgreSQL
🔍 DATABASE_URL: postgresql://user:****@host:port/database
🔧 Initializing database (type: postgres)...
✅ PostgreSQL database initialized
✅ Tables and indexes created/verified
✅ Database initialization complete
```

**❌ If SQLite is being used (WRONG):**
```
⚠️ DATABASE_URL not set, using SQLite (data will be lost on redeploy)
🔧 Initializing database (type: sqlite)...
⚠️ Using SQLite database at: /app/db/songbook.db
⚠️ WARNING: SQLite data will be lost on Railway redeploy!
✅ SQLite database initialized
```

## Step 4: Fix Common Issues

### Issue: DATABASE_URL Not Set

**Solution:**
1. Ensure PostgreSQL service is added to your Railway project
2. Railway should automatically set `DATABASE_URL` in your backend service
3. If not, manually add it (see Step 2)

### Issue: PostgreSQL Service Not Connected

**Solution:**
1. In Railway, both services should be in the same project
2. Railway automatically shares `DATABASE_URL` between services
3. If not working, manually copy `DATABASE_URL` from PostgreSQL to Backend

### Issue: Connection Errors

**Check logs for errors like:**
- `ECONNREFUSED` - PostgreSQL service not running
- `password authentication failed` - Wrong credentials
- `database does not exist` - Database name issue

**Solution:**
1. Verify PostgreSQL service is running
2. Check `DATABASE_URL` format is correct
3. Railway should handle this automatically

## Step 5: Test Database Persistence

1. **Add a test song** through your app
2. **Verify it exists**: `curl https://your-backend.railway.app/api/songs`
3. **Trigger a redeploy** (or wait for next deployment)
4. **Check again**: `curl https://your-backend.railway.app/api/songs`
5. **✅ If song still exists**: PostgreSQL is working!
6. **❌ If song is gone**: Still using SQLite - check DATABASE_URL

## Quick Checklist

- [ ] PostgreSQL service is running (green status)
- [ ] `DATABASE_URL` is set in Backend service variables
- [ ] Logs show "PostgreSQL database initialized" (not SQLite)
- [ ] Test song persists after redeploy

## Still Not Working?

1. **Check Railway logs** for database initialization messages
2. **Verify** both services are in the same Railway project
3. **Try** removing and re-adding PostgreSQL service
4. **Check** Railway documentation for latest PostgreSQL setup

## Expected Behavior

✅ **With PostgreSQL:**
- Data persists across deployments
- Logs show "PostgreSQL database initialized"
- Songs survive redeployments

❌ **With SQLite:**
- Data is lost on each deployment
- Logs show "SQLite database initialized"
- Database file is recreated each time

