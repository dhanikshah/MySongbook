# Assets Configuration for Web

## Issue
The web app is not using assets (favicon, icons) properly.

## Root Cause
Expo web with Metro bundler should automatically handle assets from `app.json`, but the favicon link might not be automatically injected into the HTML during development.

## Solutions Applied

1. **Updated Metro Config**: Added explicit asset extensions to ensure images are recognized
2. **Updated app.json**: Ensured web configuration is correct
3. **Asset Files Exist**: All required assets are in `/assets/` directory:
   - `favicon.png` ✅
   - `icon.png` ✅
   - `splash.png` ✅
   - `adaptive-icon.png` ✅

## How Assets Work in Expo Web

### Development Mode (`expo start --web`)
- Assets are served dynamically by Metro bundler
- Favicon should be accessible at `/assets/favicon.png`
- The favicon link might not appear in HTML source but should work in browser

### Production Build (`expo export:web`)
- Assets are copied to `web-build/` directory
- Favicon is automatically added to HTML
- All assets are properly referenced

## Testing Assets

1. **Check favicon in browser**:
   - Open http://localhost:8081
   - Check browser tab for favicon
   - Or visit http://localhost:8081/assets/favicon.png directly

2. **Verify asset accessibility**:
   ```bash
   curl -I http://localhost:8081/assets/favicon.png
   # Should return 200 OK
   ```

3. **For production build**:
   ```bash
   npm run web  # This will build and serve
   # Or
   npx expo export:web
   npx serve web-build
   ```

## Notes

- In development, Expo might not inject the favicon link tag, but the browser can still find it
- The favicon should appear in the browser tab even if not in HTML source
- For full asset support, use production build: `expo export:web`

