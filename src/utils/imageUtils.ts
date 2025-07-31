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

// Helper function to extract specific address components
const getFormattedAddress = (results: any[]): string => {
  if (!results || results.length === 0) {
    return 'Location unavailable';
  }

  const result = results[0];
  
  // First preference: Use formatted_address if available
  if (result.formatted_address && result.formatted_address.trim()) {
    return result.formatted_address.trim();
  }
  
  // Second preference: Construct address from components
  const components = result.address_components || [];
  
  let sublocality = '';
  let administrativeAreaLevel3 = '';
  let administrativeAreaLevel1 = '';
  let country = '';
  let postalCode = '';
  
  components.forEach((component: any) => {
    const types = component.types || [];
    
    if (types.includes('sublocality')) {
      sublocality = component.long_name;
    }
    if (types.includes('administrative_area_level_3')) {
      administrativeAreaLevel3 = component.long_name;
    }
    if (types.includes('administrative_area_level_1')) {
      administrativeAreaLevel1 = component.long_name;
    }
    if (types.includes('country')) {
      country = component.long_name;
    }
    if (types.includes('postal_code')) {
      postalCode = component.long_name;
    }
  });
  
  // Construct address using the specified component types
  const addressParts = [
    sublocality,
    administrativeAreaLevel3,
    administrativeAreaLevel1,
    country,
    postalCode
  ].filter(part => part && part.trim());
  
  if (addressParts.length > 0) {
    return addressParts.join(', ');
  }
  
  // Final fallback
  return 'Location unavailable';
};

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    // Validate coordinates range
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      console.warn('Invalid coordinates provided:', latitude, longitude);
      return `Location: ${latitude.toFixed(7)}, ${longitude.toFixed(7)}`;
    }
    
    // Check if API key is configured
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.length < 10 || GOOGLE_MAPS_API_KEY.includes('YOUR_GOOGLE_MAPS_API_KEY_HERE')) {
      console.warn('Google Maps API key not configured, using default location');
      return `Rohtak, Haryana, India`;
    }

    // Construct the API URL with 7 decimal precision for better accuracy
    // 7 decimal places provide ~11mm accuracy which is optimal for reverse geocoding
    const preciseLatitude = parseFloat(latitude.toFixed(7));
    const preciseLongitude = parseFloat(longitude.toFixed(7));
    const url = `${GOOGLE_MAPS_GEOCODING_URL}?latlng=${preciseLatitude},${preciseLongitude}&result_type=street_address|premise&location_type=ROOFTOP&key=${GOOGLE_MAPS_API_KEY}&language=en`;
    
    console.log('🌍 Making reverse geocoding request with 7-decimal precision (NO CACHE):', 
      url.replace(GOOGLE_MAPS_API_KEY, '[API_KEY]'));
    
    // Add timeout and better error handling for real devices
    // Increased timeout for gallery images (12 seconds instead of 10)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📡 Reverse geocoding response status (FRESH REQUEST):', data.status);
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Get the formatted address from the first result
      const address = getFormattedAddress(data.results);
      console.log('✅ Reverse geocoding successful (NO CACHE):', address);
      return address;
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn('⚠️  No address found for coordinates (FRESH REQUEST):', latitude, longitude);
      return `Location: ${latitude.toFixed(7)}, ${longitude.toFixed(7)}`;
    } else {
      console.error('❌ Reverse geocoding API error (FRESH REQUEST):', data.status, data.error_message);
      if (data.status === 'REQUEST_DENIED') {
        console.error('🔑 API Key might be invalid or restrictions applied');
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        console.error('📊 API quota exceeded');
      }
      return `Rohtak, Haryana, India`;
    }
  } catch (error: any) {
    console.error('Reverse geocoding failed:', error);
    
    // Handle specific error types for better debugging
    if (error.name === 'AbortError') {
      console.error('Request timed out');
      return `Location: ${latitude.toFixed(7)}, ${longitude.toFixed(7)}`;
    } else if (error.message?.includes('Network request failed')) {
      console.error('Network error - check internet connection');
      return `Rohtak, Haryana, India`;
    } else if (error.message?.includes('cleartext')) {
      console.error('Network security policy error - HTTP not allowed');
      return `Rohtak, Haryana, India`;
    }
    
    return `Rohtak, Haryana, India`;
  }
};

// Configuration validation
export const isGoogleMapsConfigured = (): boolean => {
  return GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 10 && !GOOGLE_MAPS_API_KEY.includes('YOUR_GOOGLE_MAPS_API_KEY_HERE');
};

// Safe version of reverse geocoding that won't crash the app
export const safeReverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    // First check if we're in a safe environment for network calls
    if (typeof fetch === 'undefined') {
      console.error('Fetch API not available');
      return `Rohtak, Haryana, India`;
    }
    
    // Validate coordinates
    if (!latitude || !longitude || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      console.warn('Invalid coordinates for reverse geocoding:', latitude, longitude);
      return `Location: ${latitude?.toFixed(7) || 'N/A'}, ${longitude?.toFixed(7) || 'N/A'}`;
    }
    
    console.log(`Starting safe reverse geocoding (NO CACHE) for: ${latitude}, ${longitude}`);
    
    // Use longer timeout for gallery images (8 seconds instead of 5)
    const result = await Promise.race([
      reverseGeocode(latitude, longitude),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Safe geocoding timeout after 8 seconds')), 8000)
      ),
    ]);
    
    console.log('Safe reverse geocoding completed (FRESH):', result);
    return result;
  } catch (error: any) {
    console.error('Safe reverse geocoding failed:', error);
    
    // Always return a safe fallback
    if (latitude && longitude) {
      return `Location: ${latitude.toFixed(7)}, ${longitude.toFixed(7)}`;
    }
    
    return `Rohtak, Haryana, India`;
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
