# 🐘 Railway PostgreSQL Setup Guide

This guide will help you set up PostgreSQL on Railway to persist your database across deployments.

## Why PostgreSQL?

Railway uses **ephemeral storage**, which means:
- SQLite database files are **wiped on every deployment**
- Your data is **lost** when you redeploy
- PostgreSQL on Railway provides **persistent storage**
- Data survives deployments, restarts, and updates

## Good News! 🎉

Your code **already supports PostgreSQL**! The `backend/db/database.ts` file automatically:
- Detects `DATABASE_URL` environment variable
- Uses PostgreSQL if `DATABASE_URL` is set
- Falls back to SQLite for local development
- No code changes needed!

## Step-by-Step Setup

### 1. Add PostgreSQL Service in Railway

1. Go to your Railway project dashboard
2. Click **"+ New"** button
3. Select **"Database"** → **"Add PostgreSQL"**
4. Railway will create a PostgreSQL service
5. Railway automatically provides `DATABASE_URL` environment variable

### 2. Link PostgreSQL to Your Backend Service

1. Go to your **backend service** (not the PostgreSQL service)
2. Go to **Settings** → **Variables**
3. You should see `DATABASE_URL` automatically added (Railway does this)
4. If not, go to PostgreSQL service → **Variables** → Copy `DATABASE_URL`
5. Add it to your backend service variables

### 3. Verify Environment Variable

In your backend service → **Variables**, you should see:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

This is automatically set by Railway when you add PostgreSQL.

### 4. Redeploy Your Backend

1. Railway will automatically redeploy when you add the PostgreSQL service
2. Or manually trigger a redeploy:
   - Go to your backend service
   - Click **"Deploy"** → **"Redeploy"**

### 5. Verify PostgreSQL is Working

After deployment, check the logs. You should see:
```
✅ PostgreSQL database initialized
```

Instead of:
```
✅ SQLite database initialized
```

### 6. Test the Database

1. Add a song through your app
2. Trigger a redeploy (or wait for next deployment)
3. Check if the song still exists after deployment
4. ✅ If it does, PostgreSQL is working!

## How It Works

### Automatic Detection

Your `backend/db/database.ts` file checks:

```typescript
if (process.env.DATABASE_URL) {
  // Use PostgreSQL
} else {
  // Use SQLite (local development)
}
```

### Database Adapter Pattern

The code uses an adapter pattern, so:
- Same code works with both SQLite and PostgreSQL
- No changes needed in `routes/songs.ts`
- Automatic SQL conversion (SQLite `?` → PostgreSQL `$1, $2`)

## Migration from SQLite to PostgreSQL

### Option 1: Fresh Start (Recommended for Testing)

1. Add PostgreSQL service
2. Deploy - database will be empty initially
3. Start adding songs - they'll persist!

### Option 2: Migrate Existing Data

If you have important data in SQLite:

1. **Export data from local SQLite:**
   ```bash
   # In your local backend directory
   sqlite3 db/songbook.db ".dump" > backup.sql
   ```

2. **Add PostgreSQL service in Railway**

3. **Import data to PostgreSQL:**
   - Use Railway's PostgreSQL service
   - Connect via Railway's database dashboard
   - Or use `psql` to import:
     ```bash
     psql $DATABASE_URL < backup.sql
     ```

## Troubleshooting

### Database Still Shows SQLite

**Check:**
1. Is `DATABASE_URL` set in backend service variables?
2. Check Railway logs for database initialization message
3. Verify PostgreSQL service is running

### Connection Errors

**Check:**
1. PostgreSQL service is running (green status)
2. `DATABASE_URL` is correctly formatted
3. SSL is enabled (Railway requires SSL)

### Data Not Persisting

**Check:**
1. Verify you see "PostgreSQL database initialized" in logs
2. Check PostgreSQL service is not paused
3. Verify you're using the correct database (not SQLite)

## Cost

- **Railway PostgreSQL**: Free tier available (limited storage)
- **Paid plans**: More storage and better performance
- Check Railway pricing for details

## Benefits

✅ **Data persists** across deployments  
✅ **Better performance** for production  
✅ **Scalable** - can handle more data  
✅ **Backups** - Railway can backup PostgreSQL  
✅ **No code changes** - your code already supports it!

## Next Steps

1. ✅ Add PostgreSQL service in Railway
2. ✅ Verify `DATABASE_URL` is set
3. ✅ Redeploy backend
4. ✅ Test by adding a song and redeploying
5. ✅ Verify song persists after deployment

Your database will now survive deployments! 🎉

