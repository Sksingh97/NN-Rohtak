import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { TaskImageWithOverlay, TaskImageWithOverlayRef } from './TaskImageWithOverlay';

interface FlexibleTaskImageProps {
  imageUri: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  address?: string;
  height: number;
  ref?: React.RefObject<TaskImageWithOverlayRef | null>;
  withOverlay?: boolean;
}

export const FlexibleTaskImage: React.FC<FlexibleTaskImageProps> = ({
  imageUri,
  latitude,
  longitude,
  timestamp,
  address,
  height,
  ref,
  withOverlay = false,
}) => {
  const [aspectRatio, setAspectRatio] = useState<number>(4/3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Image.getSize(
      imageUri,
      (width, imageHeight) => {
        setAspectRatio(width / imageHeight);
        setLoading(false);
      },
      (error) => {
        console.log('Error getting image size:', error);
        setLoading(false);
      }
    );
  }, [imageUri]);

  const calculatedWidth = height * aspectRatio;

  if (loading) {
    return (
      <View style={[styles.container, { width: height * (4/3), height }]} />
    );
  }

  if (withOverlay && latitude && longitude && timestamp) {
    return (
      <TaskImageWithOverlay
        ref={ref}
        imageUri={imageUri}
        latitude={latitude}
        longitude={longitude}
        timestamp={timestamp}
        address={address}
      />
    );
  }

  return (
    <View style={[styles.container, { width: calculatedWidth, height }]}>
      <Image 
        source={{ uri: imageUri }} 
        style={styles.image} 
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default FlexibleTaskImage;
