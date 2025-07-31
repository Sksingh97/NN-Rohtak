import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { COLORS } from '../constants/theme';

interface TaskImageDisplayProps {
  imageUri: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  address?: string;
  isThumbnail?: boolean;
}

export interface TaskImageDisplayRef {
  captureImage: () => Promise<string>;
}

export const TaskImageDisplaySimplified = forwardRef<TaskImageDisplayRef, TaskImageDisplayProps>(({
  imageUri,
  latitude,
  longitude,
  timestamp,
  address,
  isThumbnail = false,
}, ref) => {
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(4/3);
  const viewShotRef = useRef<ViewShot>(null);

  useImperativeHandle(ref, () => ({
    captureImage: async (): Promise<string> => {
      if (!viewShotRef.current?.capture) {
        throw new Error('ViewShot ref is not available for TaskImageDisplay');
      }
      
      try {
        const uri = await viewShotRef.current.capture();
        return uri;
      } catch (error) {
        console.error('Error capturing TaskImageDisplay:', error);
        throw error;
      }
    },
  }));

  useEffect(() => {
    Image.getSize(
      imageUri,
      (width, height) => {
        const ratio = width / height;
        console.log(`TaskImageDisplaySimplified - Image dimensions: ${width}x${height}, aspect ratio: ${ratio}`);
        setImageAspectRatio(ratio);
      },
      (error) => {
        console.log('TaskImageDisplaySimplified - Error getting image size:', error);
        setImageAspectRatio(4/3); // fallback ratio
      }
    );
  }, [imageUri]);

  const formatLocationText = () => {
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
    const coords = `Lat: ${latitude.toFixed(7)}, Lng: ${longitude.toFixed(7)}`;
    
    return {
      address: address || 'Location unavailable',
      coordinates: coords,
      dateTime: `${formattedDate} ${formattedTime}`
    };
  };

  const locationData = formatLocationText();
  
  // Simplified responsive styles
  const iconSize = isThumbnail ? 14 : 16;
  const addressFontSize = isThumbnail ? 11 : 13;
  const coordsFontSize = isThumbnail ? 9 : 11;
  const overlayPadding = isThumbnail ? 8 : 12;
  const overlayPaddingVertical = isThumbnail ? 6 : 8;

  return (
    <ViewShot
      ref={viewShotRef}
      style={styles.container}
      options={{
        fileName: `task_display_${Date.now()}`,
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
      }}>
      <View style={[styles.imageContainer, { aspectRatio: imageAspectRatio }]}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        
        {/* Location Overlay */}
        <View style={[styles.overlay, {
          paddingHorizontal: overlayPadding,
          paddingVertical: overlayPaddingVertical,
        }]}>
          <View style={styles.overlayContainer}>
            <View style={styles.mapIconContainer}>
              <Image 
                source={require('../assets/mapIconLatest.jpg')} 
                style={styles.mapIcon}
                height={50}
                width={50}
                resizeMode="contain"
              />
            </View>
            <View style={styles.overlayContent}>
              <Text 
                style={[styles.addressText, { fontSize: addressFontSize }]} 
                numberOfLines={1}>
                {locationData.address}
              </Text>
              <Text 
                style={[styles.coordinatesText, { fontSize: coordsFontSize }]} 
                numberOfLines={1}>
                {locationData.coordinates}
              </Text>
              <Text 
                style={[styles.dateTimeText, { fontSize: coordsFontSize }]} 
                numberOfLines={1}>
                {locationData.dateTime}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ViewShot>
  );
});

TaskImageDisplaySimplified.displayName = 'TaskImageDisplaySimplified';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    zIndex: 100,
  },
  overlayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mapIconContainer: {
    width: '30%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 8,
  },
  mapIcon: {
    tintColor: COLORS.WHITE,
    opacity: 1,
  },
  overlayContent: {
    width: '70%',
    justifyContent: 'center',
  },
  addressText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  coordinatesText: {
    color: COLORS.WHITE,
    opacity: 0.95,
    marginBottom: 2,
  },
  dateTimeText: {
    color: COLORS.WHITE,
    opacity: 0.95,
  },
});

export default TaskImageDisplaySimplified;
