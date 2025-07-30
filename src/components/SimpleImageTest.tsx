import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';

interface SimpleImageTestProps {
  imageUri: string;
}

export const SimpleImageTest: React.FC<SimpleImageTestProps> = ({ imageUri }) => {
  const [aspectRatio, setAspectRatio] = useState<number>(1);

  useEffect(() => {
    Image.getSize(
      imageUri,
      (width, height) => {
        const ratio = width / height;
        console.log(`SimpleImageTest - Image dimensions: ${width}x${height}, aspect ratio: ${ratio}`);
        setAspectRatio(ratio);
      },
      (error) => {
        console.log('SimpleImageTest - Error getting image size:', error);
        setAspectRatio(1);
      }
    );
  }, [imageUri]);

  return (
    <View style={styles.container}>
      <Text style={styles.debugText}>Aspect Ratio: {aspectRatio.toFixed(2)}</Text>
      <View style={[styles.imageContainer, { aspectRatio }]}>
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image} 
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#ddd',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default SimpleImageTest;
