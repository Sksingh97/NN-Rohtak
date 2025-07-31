interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
}

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = 'AIzaSyAKogFSrgBXEdlwPmhrJ5AU5AsU2BFFJfc'; // Replace with actual API key
const GOOGLE_MAPS_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export const addLocationOverlayToImage = async (
  imageUri: string,
  _locationData: LocationData
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // For now, we'll return the original image URI
      // In a real implementation, we would:
      // 1. Load the image
      // 2. Create a canvas with the image
      // 3. Draw the location overlay on top
      // 4. Return the new image URI
      
      // This is a placeholder - the actual implementation would require
      // native modules or a more complex image processing library
      resolve(imageUri);
    } catch (error) {
      reject(error);
    }
  });
};

export const formatLocationForOverlay = (locationData: LocationData): string => {
  const { latitude, longitude, timestamp } = locationData;
  const date = new Date(timestamp);
  
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const formattedTime = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  const formattedCoords = `${latitude.toFixed(7)}, ${longitude.toFixed(7)}`;
  
  return `${formattedDate} ${formattedTime}\n${formattedCoords}`;
};

// Helper function to extract specific address components with robust error handling
const getFormattedAddress = (results: any[]): string => {
  try {
    if (!results || !Array.isArray(results) || results.length === 0) {
      console.warn('No geocoding results available');
      return 'Location unavailable';
    }

    // Sort results by preference - prioritize more specific address types
    const preferredTypes = [
      'street_address',    // Most specific - actual street address
      'premise',           // Building/property name
      'sublocality_level_1', // Neighborhood/area
      'locality',          // City/town
      'route',             // Street name
      'administrative_area_level_3', // District/sub-district
      'administrative_area_level_2', // District/county
      'administrative_area_level_1'  // State/province
    ];

    // Find the most preferred result type
    let selectedResult = results[0]; // Default fallback
    let bestTypeIndex = preferredTypes.length; // Lower index = higher priority

    for (const result of results) {
      if (result && result.types && Array.isArray(result.types)) {
        for (let i = 0; i < preferredTypes.length; i++) {
          if (result.types.includes(preferredTypes[i]) && i < bestTypeIndex) {
            selectedResult = result;
            bestTypeIndex = i;
            break; // Found a higher priority type
          }
        }
      }
    }

    console.log(`🎯 Selected result with type priority ${bestTypeIndex} (${preferredTypes[bestTypeIndex] || 'default'}):`, 
      selectedResult?.types?.slice(0, 3));

    if (!selectedResult || typeof selectedResult !== 'object') {
      console.warn('Invalid geocoding result format');
      return 'Location unavailable';
    }
    
    // First preference: Use formatted_address if available and valid
    if (selectedResult.formatted_address && 
        typeof selectedResult.formatted_address === 'string' && 
        selectedResult.formatted_address.trim().length > 0) {
      const formattedAddress = selectedResult.formatted_address.trim();
      // Filter out overly generic addresses (but allow "Unnamed Road" if it has more context)
      if (formattedAddress.length > 10 && 
          !formattedAddress.includes('Unnamed Location') &&
          !(formattedAddress === 'Unnamed Road' && !formattedAddress.includes(','))) {
        console.log('Using formatted_address:', formattedAddress);
        return formattedAddress;
      }
    }
    
    // Second preference: Construct address from components
    const components = selectedResult.address_components;
    if (!components || !Array.isArray(components)) {
      console.warn('No address components available');
      return 'Location unavailable';
    }
    
    // More comprehensive address component extraction
    let premise = '';
    let streetNumber = '';
    let route = '';
    let sublocality = '';
    let locality = '';
    let administrativeAreaLevel3 = '';
    let administrativeAreaLevel2 = '';
    let administrativeAreaLevel1 = '';
    let country = '';
    let postalCode = '';
    
    components.forEach((component: any) => {
      try {
        if (!component || !component.types || !Array.isArray(component.types)) {
          return;
        }
        
        const types = component.types;
        const longName = component.long_name || '';
        const shortName = component.short_name || '';
        
        // Use the most specific name available
        const name = longName.length > shortName.length ? longName : shortName;
        
        if (types.includes('premise')) {
          premise = name;
        } else if (types.includes('street_number')) {
          streetNumber = name;
        } else if (types.includes('route')) {
          route = name;
        } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
          sublocality = name;
        } else if (types.includes('locality')) {
          locality = name;
        } else if (types.includes('administrative_area_level_3')) {
          administrativeAreaLevel3 = name;
        } else if (types.includes('administrative_area_level_2')) {
          administrativeAreaLevel2 = name;
        } else if (types.includes('administrative_area_level_1')) {
          administrativeAreaLevel1 = name;
        } else if (types.includes('country')) {
          country = name;
        } else if (types.includes('postal_code')) {
          postalCode = name;
        }
      } catch (componentError) {
        console.warn('Error processing address component:', componentError);
      }
    });
    
    // Build address hierarchically - most specific to least specific
    const addressParts: string[] = [];
    
    // Building/Street level
    if (premise) addressParts.push(premise);
    if (streetNumber && route) {
      addressParts.push(`${streetNumber} ${route}`);
    } else if (route) {
      addressParts.push(route);
    }
    
    // Local area
    if (sublocality) addressParts.push(sublocality);
    if (locality) addressParts.push(locality);
    
    // Administrative areas (District/State)
    if (administrativeAreaLevel3) addressParts.push(administrativeAreaLevel3);
    if (administrativeAreaLevel2) addressParts.push(administrativeAreaLevel2);
    if (administrativeAreaLevel1) addressParts.push(administrativeAreaLevel1);
    
    // Country and postal code
    if (country) addressParts.push(country);
    if (postalCode) addressParts.push(postalCode);
    
    // Filter out empty parts and duplicates
    const cleanedParts = addressParts
      .filter(part => part && part.trim().length > 0)
      .filter((part, index, arr) => arr.indexOf(part) === index); // Remove duplicates
    
    if (cleanedParts.length > 0) {
      const constructedAddress = cleanedParts.join(', ');
      console.log('Constructed address from components:', constructedAddress);
      return constructedAddress;
    }
    
    // Third preference: Use the first available significant component from any result
    for (const result of results) {
      try {
        if (!result || !result.address_components) continue;
        
        for (const component of result.address_components) {
          if (component.long_name && 
              typeof component.long_name === 'string' && 
              component.long_name.trim().length > 2) {
            const fallbackAddress = component.long_name.trim();
            console.log('Using fallback component from result:', fallbackAddress);
            return fallbackAddress;
          }
        }
      } catch (fallbackError) {
        console.warn('Error in fallback component processing:', fallbackError);
      }
    }
    
    // Final fallback
    console.warn('Unable to construct meaningful address from any results');
    return 'Location unavailable';
    
  } catch (error) {
    console.error('Error in getFormattedAddress:', error);
    return 'Location unavailable';
  }
};

export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  retryCount: number = 0
): Promise<string> => {
  const MAX_RETRIES = 3; // Increased retries
  const RETRY_DELAY = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff with cap
  
  try {
    // Enhanced coordinate validation
    if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
        isNaN(latitude) || isNaN(longitude) || 
        !isFinite(latitude) || !isFinite(longitude)) {
      console.warn('Invalid coordinates provided:', { latitude, longitude, types: { lat: typeof latitude, lng: typeof longitude } });
      return 'Invalid coordinates';
    }
    
    // Validate coordinates range
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      console.warn('Coordinates out of valid range:', { latitude, longitude });
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
    
    // Check if API key is configured (removed the specific key check as it's a valid key)
    if (!GOOGLE_MAPS_API_KEY || 
        GOOGLE_MAPS_API_KEY.length < 10 || 
        GOOGLE_MAPS_API_KEY.includes('YOUR_GOOGLE_MAPS_API_KEY_HERE')) {
      console.warn('Google Maps API key not configured, using coordinates');
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }

    console.log('✅ API key validation passed, proceeding with geocoding...');

    // Use 6 decimal places for good accuracy
    const preciseLatitude = Math.round(latitude * 1000000) / 1000000;
    const preciseLongitude = Math.round(longitude * 1000000) / 1000000;
    
    // Enhanced API call with better parameters
    const params = new URLSearchParams({
      latlng: `${preciseLatitude},${preciseLongitude}`,
      key: GOOGLE_MAPS_API_KEY,
      language: 'en',
      result_type: 'street_address|route|neighborhood|locality|administrative_area_level_3|administrative_area_level_2|administrative_area_level_1|country',
      location_type: 'ROOFTOP|RANGE_INTERPOLATED|GEOMETRIC_CENTER|APPROXIMATE'
    });
    
    const url = `${GOOGLE_MAPS_GEOCODING_URL}?${params.toString()}`;
    
    console.log(`🌍 Reverse geocoding attempt ${retryCount + 1}/${MAX_RETRIES + 1} for:`, 
      `${preciseLatitude}, ${preciseLongitude}`);
    
    // Enhanced timeout and request handling
    const controller = new AbortController();
    const timeoutDuration = Math.min(5000 + (retryCount * 2000), 12000); // Progressive timeout
    const timeoutId = setTimeout(() => {
      console.warn(`⏰ Request timeout after ${timeoutDuration}ms`);
      controller.abort();
    }, timeoutDuration);
    
    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'SBM-Rohtak-App/1.0',
        },
        signal: controller.signal,
        // Add cache control for better reliability
        cache: 'no-cache',
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out');
      } else if (fetchError.message && fetchError.message.includes('Network request failed')) {
        throw new Error('Network error - check internet connection');
      } else {
        throw new Error(`Fetch failed: ${fetchError.message || 'Unknown error'}`);
      }
    }
    
    clearTimeout(timeoutId);
    
    if (!response) {
      throw new Error('No response received from server');
    }
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown response error');
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    let data;
    try {
      const responseText = await response.text();
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from server');
      }
      data = JSON.parse(responseText);
    } catch (parseError: any) {
      throw new Error(`Failed to parse response: ${parseError.message}`);
    }
    
    console.log('📡 Reverse geocoding response status:', data?.status, 'Results count:', data?.results?.length || 0);
    
    // Log result types for debugging
    if (data.results && data.results.length > 1) {
      console.log('🔍 Available result types:', data.results.slice(0, 3).map((r: any, i: number) => 
        `[${i}]: ${r.types?.slice(0, 2).join(', ') || 'unknown'}`
      ));
    }
    
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }
    
    if (data.status === 'OK' && data.results && Array.isArray(data.results) && data.results.length > 0) {
      const address = getFormattedAddress(data.results);
      if (address && address !== 'Location unavailable') {
        console.log('✅ Reverse geocoding successful:', address);
        return address;
      } else {
        throw new Error('Unable to format address from results');
      }
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn('⚠️ No address found for coordinates:', preciseLatitude, preciseLongitude);
      return `${preciseLatitude}, ${preciseLongitude}`;
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('API quota exceeded');
    } else if (data.status === 'REQUEST_DENIED') {
      throw new Error('API request denied - check API key');
    } else if (data.status === 'INVALID_REQUEST') {
      throw new Error('Invalid request parameters');
    } else {
      // API returned an error status
      const errorMessage = data.error_message || data.status || 'Unknown API error';
      throw new Error(`API Error: ${errorMessage}`);
    }
    
  } catch (error: any) {
    const errorMsg = error.message || error.toString() || 'Unknown error';
    console.error(`❌ Reverse geocoding failed (attempt ${retryCount + 1}):`, errorMsg);
    
    // Determine if we should retry based on error type
    const shouldRetry = retryCount < MAX_RETRIES && (
      errorMsg.includes('timeout') ||
      errorMsg.includes('Network') ||
      errorMsg.includes('OVER_QUERY_LIMIT') ||
      errorMsg.includes('Failed to parse') ||
      errorMsg.includes('Empty response') ||
      errorMsg.includes('No response received') ||
      errorMsg.includes('HTTP 5') // Server errors (5xx)
    );
    
    if (shouldRetry) {
      console.log(`⏳ Retrying in ${RETRY_DELAY}ms... (Reason: ${errorMsg})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return reverseGeocode(latitude, longitude, retryCount + 1);
    }
    
    // Final fallback after all retries failed or non-retryable error
    console.warn(`🔄 ${retryCount >= MAX_RETRIES ? 'All retry attempts exhausted' : 'Non-retryable error'}, using coordinates as fallback`);
    
    // Ensure we return valid coordinates even in error case
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      return `${Math.round(latitude * 1000000) / 1000000}, ${Math.round(longitude * 1000000) / 1000000}`;
    }
    
    return 'Location unavailable';
  }
};

// Configuration validation
export const isGoogleMapsConfigured = (): boolean => {
  return GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 10 && !GOOGLE_MAPS_API_KEY.includes('YOUR_GOOGLE_MAPS_API_KEY_HERE');
};

// Enhanced safe version of reverse geocoding with multiple fallback strategies
export const safeReverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  const startTime = Date.now();
  
  try {
    // Early validation with detailed logging
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      console.warn('🚫 Undefined or null coordinates:', { latitude, longitude });
      return 'Location unavailable';
    }
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      console.warn('🚫 Non-numeric coordinates:', { latitude: typeof latitude, longitude: typeof longitude, values: { latitude, longitude } });
      return 'Location unavailable';
    }
    
    if (isNaN(latitude) || isNaN(longitude) || !isFinite(latitude) || !isFinite(longitude)) {
      console.warn('🚫 Invalid coordinate values:', { latitude, longitude, isNaN: { lat: isNaN(latitude), lng: isNaN(longitude) }, isFinite: { lat: isFinite(latitude), lng: isFinite(longitude) } });
      return 'Location unavailable';
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      console.warn('🚫 Coordinates out of valid range:', { latitude, longitude });
      return `${Math.round(latitude * 1000000) / 1000000}, ${Math.round(longitude * 1000000) / 1000000}`;
    }
    
    // Check basic network functionality
    if (typeof fetch === 'undefined') {
      console.error('🚫 Fetch API not available');
      return `${Math.round(latitude * 1000000) / 1000000}, ${Math.round(longitude * 1000000) / 1000000}`;
    }
    
    console.log(`🛡️ Starting safe reverse geocoding for: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    
    // Set a reasonable timeout for the entire operation including retries
    const TOTAL_TIMEOUT = 15000; // 15 seconds total
    
    const geocodingPromise = reverseGeocode(latitude, longitude);
    const timeoutPromise = new Promise<string>((_, reject) => {
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Safe geocoding total timeout exceeded');
        reject(new Error('Safe geocoding timeout'));
      }, TOTAL_TIMEOUT);
      return timeoutId;
    });
    
    let result: string;
    try {
      result = await Promise.race([geocodingPromise, timeoutPromise]);
    } catch (raceError: any) {
      console.warn('🏁 Promise race failed:', raceError.message);
      throw raceError;
    }
    
    // Enhanced result validation
    if (!result) {
      console.warn('🚫 Empty result from geocoding');
      return `${Math.round(latitude * 1000000) / 1000000}, ${Math.round(longitude * 1000000) / 1000000}`;
    }
    
    if (typeof result !== 'string') {
      console.warn('🚫 Non-string result from geocoding:', typeof result, result);
      return `${Math.round(latitude * 1000000) / 1000000}, ${Math.round(longitude * 1000000) / 1000000}`;
    }
    
    const trimmedResult = result.trim();
    if (trimmedResult.length === 0) {
      console.warn('🚫 Empty trimmed result from geocoding');
      return `${Math.round(latitude * 1000000) / 1000000}, ${Math.round(longitude * 1000000) / 1000000}`;
    }
    
    // Check for obviously invalid addresses
    const invalidPatterns = [
      /^undefined/i,
      /^null/i,
      /^NaN/i,
      /^\[object/i,
      /^error/i
    ];
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(trimmedResult)) {
        console.warn('🚫 Invalid address pattern detected:', trimmedResult);
        return `${Math.round(latitude * 1000000) / 1000000}, ${Math.round(longitude * 1000000) / 1000000}`;
      }
    }
    
    const elapsedTime = Date.now() - startTime;
    console.log(`✅ Safe reverse geocoding completed in ${elapsedTime}ms:`, trimmedResult);
    return trimmedResult;
    
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime;
    const errorMsg = error?.message || error?.toString() || 'Unknown error';
    console.error(`❌ Safe reverse geocoding failed after ${elapsedTime}ms:`, errorMsg);
    
    // Enhanced coordinate fallback with validation
    try {
      if (latitude && longitude && 
          typeof latitude === 'number' && typeof longitude === 'number' &&
          !isNaN(latitude) && !isNaN(longitude) && 
          isFinite(latitude) && isFinite(longitude) &&
          latitude >= -90 && latitude <= 90 && 
          longitude >= -180 && longitude <= 180) {
        const fallbackCoords = `${Math.round(latitude * 1000000) / 1000000}, ${Math.round(longitude * 1000000) / 1000000}`;
        console.log('🔄 Using validated coordinate fallback:', fallbackCoords);
        return fallbackCoords;
      }
    } catch (fallbackError) {
      console.error('❌ Error in coordinate fallback:', fallbackError);
    }
    
    // Ultimate fallback
    console.warn('🆘 Using ultimate fallback');
    return 'Location unavailable';
  }
};

// Network connectivity check utility
const checkNetworkConnectivity = async (timeoutMs: number = 3000): Promise<boolean> => {
  try {
    console.log('🌐 Checking network connectivity...');
    
    // Try to fetch a lightweight endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // Use Google's public DNS or a lightweight service
    const testUrls = [
      'https://www.google.com/generate_204', // Google's connectivity check endpoint
      'https://httpbin.org/status/200',       // Simple HTTP status endpoint
      'https://www.googleapis.com/robots.txt' // Simple text file
    ];
    
    for (const testUrl of testUrls) {
      try {
        const response = await fetch(testUrl, {
          method: 'HEAD', // Use HEAD to minimize data usage
          signal: controller.signal,
          cache: 'no-cache',
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok || response.status === 204) {
          console.log('✅ Network connectivity confirmed');
          return true;
        }
      } catch (testError) {
        console.warn(`❌ Network test failed for ${testUrl}:`, testError);
        continue; // Try next URL
      }
    }
    
    clearTimeout(timeoutId);
    console.warn('❌ All network connectivity tests failed');
    return false;
    
  } catch (error: any) {
    console.error('❌ Network connectivity check error:', error.message);
    return false;
  }
};

// Enhanced geocoding with network check
export const networkAwareReverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    // First validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
        isNaN(latitude) || isNaN(longitude) || 
        !isFinite(latitude) || !isFinite(longitude)) {
      console.warn('🚫 Invalid coordinates for network-aware geocoding:', { latitude, longitude });
      return 'Location unavailable';
    }
    
    // Check network connectivity first
    const hasNetwork = await checkNetworkConnectivity(2000);
    
    if (!hasNetwork) {
      console.warn('🌐❌ No network connectivity, skipping geocoding');
      return `${Math.round(latitude * 1000000) / 1000000}, ${Math.round(longitude * 1000000) / 1000000}`;
    }
    
    // Use the safe geocoding with network confirmed
    return await safeReverseGeocode(latitude, longitude);
    
  } catch (error: any) {
    console.error('❌ Network-aware geocoding failed:', error.message);
    
    // Fallback to coordinates
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      return `${Math.round(latitude * 1000000) / 1000000}, ${Math.round(longitude * 1000000) / 1000000}`;
    }
    
    return 'Location unavailable';
  }
};

// Coordinate precision information for reference:
// 1 decimal place: ~11 km accuracy
// 2 decimal places: ~1.1 km accuracy  
// 3 decimal places: ~110 m accuracy
// 4 decimal places: ~11 m accuracy
// 5 decimal places: ~1.1 m accuracy
// 6 decimal places: ~11 cm accuracy
// 7 decimal places: ~1.1 cm accuracy (optimal for reverse geocoding)

import { Image } from 'react-native-compressor';

/**
 * Compress image to reduce network overhead
 * @param imageUri - Original image URI
 * @param quality - Compression quality (0-1, default: 0.7)
 * @param maxWidth - Maximum width in pixels (default: 1024)
 * @param maxHeight - Maximum height in pixels (default: 1024)
 * @returns Promise<string> - Compressed image URI
 */
export const compressImage = async (
  imageUri: string,
  quality: number = 0.8,
  maxWidth: number = 1024,
  maxHeight: number = 1024
): Promise<string> => {
  try {
    console.warn('🗜️ COMPRESSING IMAGE:', JSON.stringify({
      originalUri: imageUri,
      quality,
      maxWidth,
      maxHeight,
      timestamp: new Date().toISOString(),
    }, null, 2));

    const compressedUri = await Image.compress(imageUri, {
      compressionMethod: 'auto',
      quality,
      maxWidth,
      maxHeight,
      output: 'jpg', // Force JPEG output for better compression
    });

    console.warn('✅ IMAGE COMPRESSION SUCCESS:', JSON.stringify({
      originalUri: imageUri,
      compressedUri,
      timestamp: new Date().toISOString(),
    }, null, 2));

    return compressedUri;
  } catch (error: any) {
    console.error('💥 IMAGE COMPRESSION FAILED:', JSON.stringify({
      originalUri: imageUri,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, null, 2));

    // Return original URI if compression fails
    console.warn('⚠️ USING ORIGINAL IMAGE DUE TO COMPRESSION FAILURE');
    return imageUri;
  }
};

/**
 * Compress multiple images concurrently
 * @param imageUris - Array of original image URIs
 * @param quality - Compression quality (0-1, default: 0.7)
 * @param maxWidth - Maximum width in pixels (default: 1024)
 * @param maxHeight - Maximum height in pixels (default: 1024)
 * @returns Promise<string[]> - Array of compressed image URIs
 */
export const compressMultipleImages = async (
  imageUris: string[],
  quality: number = 0.8,
  maxWidth: number = 1024,
  maxHeight: number = 1024
): Promise<string[]> => {
  console.warn('🗜️ COMPRESSING MULTIPLE IMAGES:', JSON.stringify({
    imageCount: imageUris.length,
    quality,
    maxWidth,
    maxHeight,
    timestamp: new Date().toISOString(),
  }, null, 2));

  try {
    // Compress all images in parallel for better performance
    const compressionPromises = imageUris.map(async (imageUri, index) => {
      try {
        const compressedUri = await compressImage(imageUri, quality, maxWidth, maxHeight);
        console.log(`✅ Image ${index + 1}/${imageUris.length} compressed successfully`);
        return compressedUri;
      } catch (error: any) {
        console.error(`❌ Image ${index + 1}/${imageUris.length} compression failed:`, error.message);
        // Return original URI if individual compression fails
        return imageUri;
      }
    });

    const compressedUris = await Promise.all(compressionPromises);

    console.warn('✅ MULTIPLE IMAGES COMPRESSION COMPLETE:', JSON.stringify({
      originalCount: imageUris.length,
      compressedCount: compressedUris.length,
      timestamp: new Date().toISOString(),
    }, null, 2));

    return compressedUris;
  } catch (error: any) {
    console.error('💥 MULTIPLE IMAGES COMPRESSION FAILED:', error.message);
    // Return original URIs if batch compression fails
    return imageUris;
  }
};
