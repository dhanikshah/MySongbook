# 💰 Cost Optimization Guide

This document describes the cost optimizations implemented to reduce Railway API calls and minimize costs on the free tier.

## Optimizations Implemented

### 1. Increased Auto-Refresh Intervals
- **Before**: 5 seconds (12 requests/minute per page)
- **After**: 60 seconds (1 request/minute per page)
- **Reduction**: 92% fewer API calls

### 2. Page Focus Detection
- Auto-refresh only occurs when the page is focused/visible
- Prevents unnecessary API calls when user is on a different page
- Uses `navigation.isFocused()` to check page visibility

### 3. Removed Duplicate Fetches
- **LibraryPage**: Removed duplicate `useEffect` on mount
- Now only fetches on `useFocusEffect` (when page comes into focus)
- Eliminates redundant initial load

### 4. Disabled Auto-Refresh on Web
- Web platform: Auto-refresh completely disabled
- Mobile platform: Auto-refresh enabled (60-second interval)
- Rationale: Web users can manually refresh; mobile benefits from background sync

## Cost Impact

### Before Optimization
- **LibraryPage**: 12 requests/minute = 720 requests/hour
- **SearchPage**: 12 requests/minute = 720 requests/hour  
- **SongViewerPage**: 12 requests/minute = 720 requests/hour
- **Total (all pages active)**: ~2,160 requests/hour

### After Optimization
- **LibraryPage (mobile)**: 1 request/minute = 60 requests/hour
- **SearchPage (mobile)**: 1 request/minute = 60 requests/hour
- **SongViewerPage (mobile)**: 1 request/minute = 60 requests/hour
- **Web pages**: 0 auto-refresh requests (manual refresh only)
- **Total (all pages active)**: ~180 requests/hour (mobile) or ~0 (web)

### Cost Reduction
- **Mobile**: 92% reduction (from 2,160 to 180 requests/hour)
- **Web**: 100% reduction (from 2,160 to 0 auto-refresh requests)
- **Average**: ~90% reduction in API calls

## How It Works

### LibraryPage & SearchPage
1. Fetches songs when page comes into focus (`useFocusEffect`)
2. Auto-refreshes every 60 seconds (only on mobile, only when focused)
3. Stops auto-refresh when page loses focus

### SongViewerPage
1. Loads song when page opens
2. Checks if song still exists every 60 seconds (only on mobile, only when focused)
3. Navigates back to Library if song is deleted

## Manual Refresh

Users can still manually refresh by:
- **Web**: Refreshing the browser page
- **Mobile**: Navigating away and back to the page (triggers `useFocusEffect`)

## Future Optimizations (Optional)

If you need even more cost savings, consider:

1. **Increase interval to 2-5 minutes** (change `60000` to `120000` or `300000`)
2. **Add client-side caching** with TTL (cache responses for 1-2 minutes)
3. **Batch operations** (combine multiple API calls into one)
4. **Optimistic updates** (update UI immediately, sync in background)

## Monitoring

To monitor API usage:
1. Check Railway dashboard → Metrics → Requests
2. Look for request rate reduction after deployment
3. Verify auto-refresh logs show 60-second intervals (not 5 seconds)

## Notes

- Auto-refresh is essential for cross-device sync (detecting changes from other devices)
- 60-second interval provides good balance between freshness and cost
- Web platform doesn't need auto-refresh (users can manually refresh)
- Mobile platform benefits from background sync for better UX

