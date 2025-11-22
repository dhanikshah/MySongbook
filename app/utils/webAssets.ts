/**
 * Web asset utilities
 * Ensures assets are properly loaded in web environment
 */

export function injectFavicon() {
  if (typeof document !== 'undefined') {
    try {
      // Expo automatically handles favicon via app.json, but we can ensure it's set
      // Only inject if not already present to avoid conflicts
      const existingFavicon = document.querySelector("link[rel*='icon']");
      if (existingFavicon) {
        // Favicon already exists, don't interfere
        return;
      }

      // In Expo web dev mode, assets are served from the assets directory
      const baseUrl = window.location.origin;
      
      // Add favicon with error handling
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = `${baseUrl}/assets/favicon.png`;
      
      // Only add if image loads successfully
      const img = new Image();
      img.onload = () => {
        document.head.appendChild(link);
      };
      img.onerror = () => {
        // Silently fail - Expo will handle favicon via app.json
        console.log('Favicon not found, Expo will handle it automatically');
      };
      img.src = link.href;

      // Add apple touch icon with error handling
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = `${baseUrl}/assets/icon.png`;
      
      const appleImg = new Image();
      appleImg.onload = () => {
        document.head.appendChild(appleLink);
      };
      appleImg.onerror = () => {
        // Silently fail
      };
      appleImg.src = appleLink.href;
    } catch (error) {
      // Silently handle any errors - Expo will manage favicon via app.json
      console.log('Favicon injection error (non-critical):', error);
    }
  }
}

