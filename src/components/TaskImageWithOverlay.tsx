import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import ViewShot from 'react-native-view-shot';
import { ImageWithLocationOverlay } from './ImageWithLocationOverlay';

interface TaskImageWithOverlayProps {
  imageUri: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  address?: string;
}

export interface TaskImageWithOverlayRef {
  captureImage: () => Promise<string>;
}

export const TaskImageWithOverlay = forwardRef<TaskImageWithOverlayRef, TaskImageWithOverlayProps>(
  ({ imageUri, latitude, longitude, timestamp, address }, ref) => {
    const viewShotRef = useRef<ViewShot>(null);

    useImperativeHandle(ref, () => ({
      captureImage: async (): Promise<string> => {
        if (!viewShotRef.current?.capture) {
          throw new Error('ViewShot ref is not available');
        }
        
        try {
          const uri = await viewShotRef.current.capture();
          return uri;
        } catch (error) {
          console.error('Error capturing task image with overlay:', error);
          throw error;
        }
      },
    }));

    return (
      <ImageWithLocationOverlay
        ref={viewShotRef}
        imageUri={imageUri}
        latitude={latitude}
        longitude={longitude}
        timestamp={timestamp}
        address={address}
      />
    );
  }
);

TaskImageWithOverlay.displayName = 'TaskImageWithOverlay';
