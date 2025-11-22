/**
 * Auto-detect API server URL for physical Android devices
 * Tries to discover the server by attempting connections to common IPs
 */

import axios from 'axios';

const COMMON_IPS = [
  '192.168.5.24', // Primary server IP
  '192.168.1.100',
  '192.168.1.101',
  '192.168.0.100',
  '192.168.0.101',
  '10.0.0.100',
  '10.0.0.101',
];

const API_PORT = 3001;
const HEALTH_CHECK_TIMEOUT = 2000; // 2 seconds per attempt

/**
 * Try to find the API server by testing common local network IPs
 */
export async function autoDetectApiUrl(): Promise<string | null> {
  console.log('Auto-detecting API server URL...');

  // Try common IPs in parallel
  const healthCheckPromises = COMMON_IPS.map(ip => 
    checkServerHealth(`http://${ip}:${API_PORT}`)
  );

  try {
    const results = await Promise.allSettled(healthCheckPromises);
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled' && result.value) {
        const detectedUrl = `http://${COMMON_IPS[i]}:${API_PORT}`;
        console.log('✅ Auto-detected API server:', detectedUrl);
        return detectedUrl;
      }
    }
  } catch (error) {
    console.warn('Error during auto-detection:', error);
  }

  console.warn('⚠️ Could not auto-detect API server');
  return null;
}

/**
 * Check if a server is reachable by hitting the health endpoint
 */
async function checkServerHealth(url: string): Promise<boolean> {
  try {
    const response = await axios.get(`${url}/health`, {
      timeout: HEALTH_CHECK_TIMEOUT,
    });
    return response.status === 200 && response.data?.status === 'ok';
  } catch (error) {
    return false;
  }
}

/**
 * Get local IP from Expo dev server (if available)
 */
export function getLocalIPFromExpo(): string | null {
  try {
    // Expo sometimes exposes the dev server URL
    if (typeof window !== 'undefined') {
      const location = window.location;
      if (location.hostname && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        return location.hostname;
      }
    }

    // Check for Expo's internal variables
    const expoConfig = (global as any).__EXPO_CONFIG__;
    if (expoConfig?.hostUri) {
      const host = expoConfig.hostUri.split(':')[0];
      if (host && host !== 'localhost') {
        return host;
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return null;
}

