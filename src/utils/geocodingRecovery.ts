// Network and geocoding error recovery utility
import { Alert } from 'react-native';

export interface GeocodingResult {
  address: string;
  isSuccess: boolean;
  isFromCache: boolean;
  errorMessage?: string;
  coordinates: string;
}

// Simple in-memory cache for geocoding results
class GeocodingCache {
  private cache = new Map<string, { address: string; timestamp: number }>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  private getCacheKey(lat: number, lng: number): string {
    // Round to 4 decimal places for caching (~11m accuracy)
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    return `${roundedLat},${roundedLng}`;
  }

  get(latitude: number, longitude: number): string | null {
    const key = this.getCacheKey(latitude, longitude);
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log('📱 Using cached geocoding result:', cached.address);
      return cached.address;
    }
    
    if (cached) {
      this.cache.delete(key); // Remove expired entry
    }
    
    return null;
  }

  set(latitude: number, longitude: number, address: string): void {
    const key = this.getCacheKey(latitude, longitude);
    this.cache.set(key, {
      address,
      timestamp: Date.now(),
    });
    
    // Clean up old entries periodically
    if (this.cache.size > 100) {
      const now = Date.now();
      for (const [cacheKey, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.CACHE_DURATION) {
          this.cache.delete(cacheKey);
        }
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const geocodingCache = new GeocodingCache();

export const robustReverseGeocode = async (
  latitude: number,
  longitude: number,
  showErrorToUser: boolean = false
): Promise<GeocodingResult> => {
  const coordinates = `${Math.round(latitude * 1000000) / 1000000}, ${Math.round(longitude * 1000000) / 1000000}`;
  
  // Validate input
  if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
      isNaN(latitude) || isNaN(longitude) || 
      !isFinite(latitude) || !isFinite(longitude)) {
    return {
      address: 'Invalid location',
      isSuccess: false,
      isFromCache: false,
      errorMessage: 'Invalid coordinates provided',
      coordinates: coordinates,
    };
  }

  // Check cache first
  const cachedAddress = geocodingCache.get(latitude, longitude);
  if (cachedAddress) {
    return {
      address: cachedAddress,
      isSuccess: true,
      isFromCache: true,
      coordinates: coordinates,
    };
  }

  try {
    // Import the network-aware geocoding function dynamically to avoid circular imports
    const { networkAwareReverseGeocode } = await import('../utils/imageUtils');
    
    console.log('🔍 Starting robust reverse geocoding...');
    const address = await networkAwareReverseGeocode(latitude, longitude);
    
    // Validate the result
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      throw new Error('Empty or invalid address returned');
    }

    const trimmedAddress = address.trim();
    
    // Check if it's just coordinates (fallback case)
    const isCoordinatesOnly = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(trimmedAddress);
    
    if (!isCoordinatesOnly && trimmedAddress !== 'Location unavailable') {
      // Cache successful result
      geocodingCache.set(latitude, longitude, trimmedAddress);
    }

    return {
      address: trimmedAddress,
      isSuccess: !isCoordinatesOnly && trimmedAddress !== 'Location unavailable',
      isFromCache: false,
      coordinates: coordinates,
    };

  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Unknown geocoding error';
    console.error('❌ Robust reverse geocoding failed:', errorMessage);

    if (showErrorToUser && errorMessage.includes('Network')) {
      Alert.alert(
        'Network Error',
        'Unable to fetch address due to network issues. Using coordinates instead.',
        [{ text: 'OK' }]
      );
    }

    return {
      address: coordinates,
      isSuccess: false,
      isFromCache: false,
      errorMessage: errorMessage,
      coordinates: coordinates,
    };
  }
};

// Utility to clear geocoding cache (useful for testing or memory management)
export const clearGeocodingCache = (): void => {
  geocodingCache.clear();
  console.log('🧹 Geocoding cache cleared');
};

// Utility to get cache statistics
export const getGeocodingCacheStats = (): { size: number; entries: string[] } => {
  const entries: string[] = [];
  geocodingCache['cache'].forEach((value, key) => {
    entries.push(`${key}: ${value.address}`);
  });
  
  return {
    size: geocodingCache['cache'].size,
    entries: entries,
  };
};
