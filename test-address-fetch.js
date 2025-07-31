// Quick test to verify the updated imageUtils address formatting
const { reverseGeocode, safeReverseGeocode } = require('./src/utils/imageUtils');

// Test with built-in fetch (if available in React Native environment)
const testAddressFetching = async () => {
  console.log('🧪 Testing Address Fetching Logic');
  console.log('==================================');
  
  const testCoordinate = { lat: 28.5730916, lng: 77.4488212, name: 'Rohtak' };
  
  console.log(`📍 Testing coordinate: ${testCoordinate.name}`);
  console.log(`   Lat: ${testCoordinate.lat}, Lng: ${testCoordinate.lng}`);
  
  try {
    // Test safe reverse geocoding (which is what the component uses)
    console.log('🔄 Calling safeReverseGeocode...');
    const address = await safeReverseGeocode(testCoordinate.lat, testCoordinate.lng);
    console.log(`✅ Address fetched: "${address}"`);
    
    // Check if it's a real address or fallback
    if (address === 'Rohtak, Haryana, India') {
      console.log('ℹ️  Using fallback address (expected for testing without API key or network)');
    } else if (address.startsWith('Location:')) {
      console.log('ℹ️  Using coordinate fallback (API issue or no results)');
    } else {
      console.log('🎉 Successfully fetched real address from Google Maps API!');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
};

testAddressFetching().catch(console.error);
