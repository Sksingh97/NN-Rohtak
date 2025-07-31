// Test script for the improved reverse geocoding
const { networkAwareReverseGeocode, robustReverseGeocode } = require('./src/utils/imageUtils');

const testCoordinates = [
  { lat: 28.8955, lng: 76.6066, name: 'Rohtak, Haryana' },
  { lat: 28.6139, lng: 77.2090, name: 'New Delhi' },
  { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
  { lat: 0, lng: 0, name: 'Invalid coordinates (0,0)' },
  { lat: null, lng: null, name: 'Null coordinates' },
  { lat: 'invalid', lng: 'invalid', name: 'String coordinates' },
  { lat: 200, lng: 300, name: 'Out of range coordinates' },
];

async function testGeocodingRobustness() {
  console.log('🧪 Starting comprehensive geocoding tests...\n');

  for (const coord of testCoordinates) {
    console.log(`\n📍 Testing: ${coord.name} (${coord.lat}, ${coord.lng})`);
    console.log('=' .repeat(60));

    try {
      // Test robust geocoding
      console.log('🛡️ Testing robustReverseGeocode...');
      const robustResult = await robustReverseGeocode(coord.lat, coord.lng, false);
      console.log('✅ Robust result:', robustResult);

      // Also test network-aware for comparison
      console.log('🌐 Testing networkAwareReverseGeocode...');
      const networkResult = await networkAwareReverseGeocode(coord.lat, coord.lng);
      console.log('✅ Network-aware result:', networkResult);

    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }

  console.log('\n🏁 All tests completed!');
}

// Run the tests
testGeocodingRobustness().catch(console.error);
