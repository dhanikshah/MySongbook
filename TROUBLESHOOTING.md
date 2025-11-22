# Troubleshooting Guide

## Auto-populate and Save Not Working

### 1. Check Backend is Running
```bash
cd backend
npm run dev
```
You should see: `🚀 Server running on http://localhost:3001`

### 2. Check Backend Endpoints
```bash
# Test GET
curl http://localhost:3001/api/songs

# Test POST
curl -X POST http://localhost:3001/api/songs \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","artist":"Test","type":"chords","key":"C","tags":["test"],"extractedText":"C G Am F"}'
```

### 3. Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Try to save a song or upload a file
4. Look for:
   - `API Base URL: http://localhost:3001`
   - `API Request: POST /api/songs`
   - `API Response: 201` or error messages

### 4. Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try to save a song
4. Look for:
   - Request to `http://localhost:3001/api/songs`
   - Status code (should be 201 for success)
   - Response data

### 5. Common Issues

#### CORS Error
- **Symptom**: Error about CORS policy
- **Fix**: Restart backend server (CORS config updated)

#### Connection Refused
- **Symptom**: `ERR_CONNECTION_REFUSED`
- **Fix**: Make sure backend is running on port 3001

#### API URL Wrong
- **Symptom**: Requests going to wrong URL
- **Fix**: Check `.env` file has `EXPO_PUBLIC_API_URL=http://localhost:3001`
- **Fix**: Restart frontend after changing `.env`

#### File Upload Not Working
- **Symptom**: File upload fails
- **Check**: Backend console for errors
- **Check**: File size (might be too large)
- **Check**: File type is supported (PDF, JPG, PNG, DOCX, TXT)

### 6. Debug Steps

1. **Check API URL in console**
   - Should see: `API Base URL: http://localhost:3001`

2. **Check API requests**
   - Should see: `API Request: POST /api/songs`
   - Should see: `API Response: 201`

3. **Check for errors**
   - Look for red error messages in console
   - Check Network tab for failed requests

4. **Test manually**
   - Use curl commands above to test backend
   - If curl works but browser doesn't, it's a CORS/frontend issue

### 7. Restart Everything
If nothing works:
```bash
# Stop backend (Ctrl+C)
# Restart backend
cd backend
npm run dev

# Restart frontend
# Stop frontend (Ctrl+C)
npm run dev
```

