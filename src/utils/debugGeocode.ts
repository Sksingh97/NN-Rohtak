// Debug utility to test geocoding with gallery coordinates
// Add this to a component or screen to test geocoding issues

import { Platform } from 'react-native';
import { safeReverseGeocode } from '../utils/imageUtils';

export const debugGalleryGeocode = async (latitude: number, longitude: number) => {
  console.log('🔍 DEBUG: Starting gallery geocoding test (NO CACHING)');
  console.log(`📍 Coordinates: ${latitude}, ${longitude}`);
  console.log(`📱 Platform: ${Platform.OS}`);
  console.log(`🌐 Network available: ${typeof fetch !== 'undefined'}`);
  console.log(`🔑 API Key configured: ${typeof process !== 'undefined' ? 'Cannot check in runtime' : 'Unknown'}`);
  
  const startTime = Date.now();
  
  try {
    console.log('⏳ Starting safeReverseGeocode...');
    
    const result = await safeReverseGeocode(latitude, longitude);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ SUCCESS: Got address in ${duration}ms`);
    console.log(`📧 Address: "${result}"`);
    
    // Analyze result type
    if (result === 'Rohtak, Haryana, India') {
      console.log('ℹ️  RESULT TYPE: Fallback address (API failed or no key)');
      console.log('💡 SUGGESTION: Check internet connection and API key');
    } else if (result.startsWith('Location:')) {
      console.log('ℹ️  RESULT TYPE: Coordinate fallback (API returned no results)');
      console.log('💡 SUGGESTION: Coordinates might be in a remote area or API issue');
    } else if (result === 'Location unavailable') {
      console.log('ℹ️  RESULT TYPE: Error fallback');
      console.log('💡 SUGGESTION: Check logs for specific error details');
    } else if (result === 'Fetching address...' || result === 'Loading address...') {
      console.log('ℹ️  RESULT TYPE: Still loading (this should not happen in direct call)');
    } else {
      console.log('🎉 RESULT TYPE: Real geocoded address from Google Maps!');
      console.log('✨ SUCCESS: Fresh address fetched without caching');
    }
    
    return result;
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`❌ ERROR: Failed after ${duration}ms`);
    console.log(`💥 Error details:`, error);
    
    const errorMessage = (error as any)?.message || '';
    
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      console.log('⏰ DIAGNOSIS: Request timed out - likely network or API issue');
      console.log('💡 FIX: Try increasing timeout or check internet connection');
    } else if (errorMessage.includes('Network request failed')) {
      console.log('🌐 DIAGNOSIS: Network failure - check internet connection');
      console.log('💡 FIX: Ensure device has internet access');
    } else if (errorMessage.includes('AbortError')) {
      console.log('🛑 DIAGNOSIS: Request was aborted');
      console.log('💡 FIX: May be due to timeout or network interruption');
    } else {
      console.log('❓ DIAGNOSIS: Unknown error type');
      console.log('💡 FIX: Check error details above for more info');
    }
    
    throw error;
  }
};

// Usage in your component:
// 
// const testGalleryGeocode = async () => {
//   const testCoords = { lat: 28.5730916, lng: 77.4488212 }; // Your gallery coordinates
//   try {
//     await debugGalleryGeocode(testCoords.lat, testCoords.lng);
//   } catch (error) {
//     console.log('Debug test failed:', error);
//   }
// };
//
// // Call this when gallery image is selected
// testGalleryGeocode();
