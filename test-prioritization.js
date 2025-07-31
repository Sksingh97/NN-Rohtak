// Test with multiple coordinates to see prioritization benefits
const testCoordinates = [
  { lat: 28.5730954, lng: 77.4488229, name: 'Noida - Current location' },
  { lat: 28.6139, lng: 77.2090, name: 'New Delhi - Central area' },
  { lat: 19.0760, lng: 72.8777, name: 'Mumbai - Business district' },
  { lat: 28.8955, lng: 76.6066, name: 'Rohtak - Rural area' },
];

// Mock the Google Maps API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAKogFSrgBXEdlwPmhrJ5AU5AsU2BFFJfc';
const GOOGLE_MAPS_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

async function testResultPrioritization(coords) {
  try {
    const params = new URLSearchParams({
      latlng: `${coords.lat},${coords.lng}`,
      key: GOOGLE_MAPS_API_KEY,
      language: 'en'
    });
    
    const url = `${GOOGLE_MAPS_GEOCODING_URL}?${params.toString()}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.results && data.results.length > 1) {
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

        console.log(`\n📍 ${coords.name}:`);
        console.log(`Results: ${data.results.length}`);
        console.log(`Original [0]: ${data.results[0].types?.slice(0, 2).join(', ') || 'unknown'}`);
        console.log(`Selected [${selectedIndex}]: ${selectedResult.types?.slice(0, 2).join(', ') || 'unknown'}`);
        
        if (selectedIndex !== 0) {
          console.log('🚀 IMPROVEMENT: Different result selected!');
          console.log(`  Original: ${data.results[0].formatted_address}`);
          console.log(`  Selected: ${selectedResult.formatted_address}`);
        } else {
          console.log(`✅ Address: ${selectedResult.formatted_address?.substring(0, 80)}...`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error testing ${coords.name}:`, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Testing result prioritization with multiple locations...\n');
  
  for (const coords of testCoordinates) {
    await testResultPrioritization(coords);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
  
  console.log('\n🏁 All tests completed!');
}

runAllTests();
