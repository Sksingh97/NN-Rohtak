interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
}

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
  
  const formattedCoords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  
  return `${formattedDate} ${formattedTime}\n${formattedCoords}`;
};

export const reverseGeocode = async (
  _latitude: number,
  _longitude: number
): Promise<string> => {
  try {
    // In a real app, you would use a geocoding service like Google Maps API
    // For now, return a placeholder address
    return `Rohtak, Haryana, India`;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return 'Location unavailable';
  }
};
