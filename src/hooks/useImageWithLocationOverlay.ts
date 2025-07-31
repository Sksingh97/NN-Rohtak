import { useRef } from 'react';
import ViewShot from 'react-native-view-shot';
import { safeReverseGeocode } from '../utils/imageUtils';

export const useImageWithLocationOverlay = () => {
  const viewShotRef = useRef<ViewShot>(null);

  const captureImageWithOverlay = async (): Promise<string> => {
    if (!viewShotRef.current?.capture) {
      throw new Error('ViewShot ref is not available');
    }

    try {
      const uri = await viewShotRef.current.capture();
      return uri;
    } catch (error) {
      console.error('Error capturing image with overlay:', error);
      throw error;
    }
  };

  const processImageWithLocation = async (
    imageUri: string,
    latitude: number,
    longitude: number,
    timestamp: string = new Date().toISOString()
  ): Promise<{
    imageWithOverlay: string;
    locationData: {
      latitude: number;
      longitude: number;
      timestamp: string;
      address: string;
    };
  }> => {
    try {
      const address = await safeReverseGeocode(latitude, longitude);
      
      return {
        imageWithOverlay: imageUri, // Will be replaced with actual overlay image
        locationData: {
          latitude,
          longitude,
          timestamp,
          address,
        },
      };
    } catch (error) {
      console.error('Error processing image with location:', error);
      throw error;
    }
  };

  return {
    viewShotRef,
    captureImageWithOverlay,
    processImageWithLocation,
  };
};
