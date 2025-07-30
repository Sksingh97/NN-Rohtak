import React, { forwardRef, useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, SIZES } from '../constants/theme';

interface LocationOverlayProps {
  imageUri: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  address?: string;
}

const OVERLAY_HEIGHT_RATIO = 0.35; // 35% of container height

export const ImageWithLocationOverlay = forwardRef<ViewShot, LocationOverlayProps>(({
  imageUri,
  latitude,
  longitude,
  timestamp,
  address,
}, ref) => {
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(4/3); // Default aspect ratio

  useEffect(() => {
    // Get the actual image dimensions to calculate aspect ratio
    Image.getSize(
      imageUri,
      (width, height) => {
        setImageAspectRatio(width / height);
      },
      (error) => {
        console.log('Error getting image size:', error);
        // Keep default aspect ratio if error
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
    const coords = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
    
    return {
      address: address || 'Location unavailable',
      coordinates: coords,
      dateTime: `${formattedDate} ${formattedTime}`
    };
  };

  const locationData = formatLocationText();

  return (
    <ViewShot
      ref={ref}
      style={styles.container}
      options={{
        fileName: `image_with_location_${Date.now()}`,
        format: 'jpg',
        quality: 0.9,
      }}>
      <View style={[styles.imageContainer, { aspectRatio: imageAspectRatio }]}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        
        {/* Location Overlay */}
        <View style={styles.overlay}>
          <View style={styles.overlayContainer}>
            <View style={styles.mapIconContainer}>
              <Icon name="place" size={16} color={COLORS.WHITE} />
            </View>
            <View style={styles.overlayContent}>
              <Text style={styles.addressText} numberOfLines={1}>{locationData.address}</Text>
              <Text style={styles.coordinatesText} numberOfLines={1}>{locationData.coordinates}</Text>
              <Text style={styles.dateTimeText} numberOfLines={1}>{locationData.dateTime}</Text>
            </View>
          </View>
        </View>
      </View>
    </ViewShot>
  );
});

ImageWithLocationOverlay.displayName = 'ImageWithLocationOverlay';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    minHeight: 200, // Minimum height to ensure overlay is visible
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  overlayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mapIconContainer: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
  },
  addressText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  coordinatesText: {
    color: COLORS.WHITE,
    fontSize: 10,
    opacity: 0.9,
    marginBottom: 1,
  },
  dateTimeText: {
    color: COLORS.WHITE,
    fontSize: 10,
    opacity: 0.9,
  },
});

export default ImageWithLocationOverlay;
