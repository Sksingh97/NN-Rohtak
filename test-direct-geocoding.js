// Quick test for geocoding with result prioritization
const testCoords = {
  lat: 28.5730954,
  lng: 77.4488229
};

// Mock the Google Maps API key (same as in the file)
const GOOGLE_MAPS_API_KEY = 'AIzaSyAKogFSrgBXEdlwPmhrJ5AU5AsU2BFFJfc';
const GOOGLE_MAPS_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

console.log('🧪 Testing improved geocoding with result prioritization...');
console.log('Coordinates:', testCoords);

async function testImprovedGeocodingAPI() {
  try {
    const params = new URLSearchParams({
      latlng: `${testCoords.lat},${testCoords.lng}`,
      key: GOOGLE_MAPS_API_KEY,
      language: 'en'
    });
    
    const url = `${GOOGLE_MAPS_GEOCODING_URL}?${params.toString()}`;
    console.log('🌍 Testing direct API call with result analysis...');
    
    const response = await fetch(url);
    console.log('Response status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:');
      console.log('Status:', data.status);
      console.log('Results count:', data.results?.length || 0);
      
      if (data.results && data.results.length > 0) {
        // Show all result types for analysis
        console.log('\n📊 All results analysis:');
        data.results.forEach((result, index) => {
          console.log(`[${index}] Types: ${result.types?.slice(0, 3).join(', ') || 'unknown'}`);
          console.log(`    Address: ${result.formatted_address || 'N/A'}`);
          console.log('');
        });
        
        // Test our prioritization logic
        const preferredTypes = [
          'street_address',
          'premise',
          'sublocality_level_1',
          'locality',
          'route',
          'administrative_area_level_3',
          'administrative_area_level_2',
          'administrative_area_level_1'
        ];

        let selectedResult = data.results[0];
        let bestTypeIndex = preferredTypes.length;
        let selectedIndex = 0;

        for (let i = 0; i < data.results.length; i++) {
          const result = data.results[i];
          if (result && result.types && Array.isArray(result.types)) {
            for (let j = 0; j < preferredTypes.length; j++) {
              if (result.types.includes(preferredTypes[j]) && j < bestTypeIndex) {
                selectedResult = result;
                bestTypeIndex = j;
                selectedIndex = i;
                break;
              }
            }
          }
        }

        console.log('🎯 PRIORITIZATION RESULTS:');
        console.log(`Original [0]: ${data.results[0].types?.slice(0, 2).join(', ') || 'unknown'}`);
        console.log(`  Address: ${data.results[0].formatted_address}`);
        console.log('');
        console.log(`Selected [${selectedIndex}]: ${selectedResult.types?.slice(0, 2).join(', ') || 'unknown'}`);
        console.log(`  Address: ${selectedResult.formatted_address}`);
        console.log(`  Priority: ${preferredTypes[bestTypeIndex] || 'default'} (index ${bestTypeIndex})`);
        
        if (selectedIndex !== 0) {
          console.log('🚀 IMPROVEMENT: Selected a different result than [0]!');
        } else {
          console.log('ℹ️  First result was already the best choice');
        }
      }
      
      if (data.error_message) {
        console.log('Error message:', data.error_message);
      }
    } else {
      console.log('❌ HTTP Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error body:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImprovedGeocodingAPI();
