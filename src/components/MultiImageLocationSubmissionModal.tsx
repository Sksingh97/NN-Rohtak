import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { XMarkIcon, MapPinIcon } from 'react-native-heroicons/outline';
import { ImageWithLocationOverlay } from './ImageWithLocationOverlay';
import { showErrorToast } from '../utils/toast';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { safeReverseGeocode } from '../utils/imageUtils';

interface MultiImageLocationSubmissionModalProps {
  visible: boolean;
  imageUris: string[];
  latitude: number;
  longitude: number;
  timestamp: string;
  onSubmit: (processedImageUris: string[]) => void;
  onCancel: () => void;
  onAddMore?: () => void;
  onRemoveImage?: (index: number) => void;
  title: string;
}

const { width } = Dimensions.get('window');

export const MultiImageLocationSubmissionModal: React.FC<MultiImageLocationSubmissionModalProps> = ({
  visible,
  imageUris,
  latitude,
  longitude,
  timestamp,
  onSubmit,
  onCancel,
  onAddMore,
  onRemoveImage,
  title,
}) => {
  const viewShotRefs = useRef<(ViewShot | null)[]>([]);
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Initialize refs array when imageUris change
  useEffect(() => {
    viewShotRefs.current = imageUris.map(() => null);
  }, [imageUris]);

  const loadAddress = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedAddress = await safeReverseGeocode(latitude, longitude);
      setAddress(fetchedAddress);
    } catch (error) {
      console.error('Failed to get address:', error);
      setAddress('Location unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (visible && latitude && longitude) {
      loadAddress();
    }
  }, [visible, latitude, longitude, loadAddress]);

  const handleSubmit = async () => {
    console.log('MultiImageLocationSubmissionModal handleSubmit called');
    if (imageUris.length === 0) {
      showErrorToast('No images to process');
      return;
    }

    setIsCapturing(true);
    try {
      const processedImages: string[] = [];
      
      // Process each image with overlay
      for (let i = 0; i < imageUris.length; i++) {
        const viewShotRef = viewShotRefs.current[i];
        if (viewShotRef?.capture) {
          console.log(`Capturing image ${i + 1}/${imageUris.length}...`);
          const capturedImageUri = await viewShotRef.capture();
          console.log(`Image ${i + 1} captured successfully:`, capturedImageUri);
          processedImages.push(capturedImageUri);
        } else {
          console.warn(`No viewshot ref for image ${i + 1}`);
          processedImages.push(imageUris[i]); // Fallback to original
        }
      }
      
      console.log('All images processed successfully:', processedImages);
      onSubmit(processedImages);
    } catch (error) {
      console.error('Error capturing images:', error);
      showErrorToast('Failed to process images with location overlay');
    } finally {
      setIsCapturing(false);
    }
  };

  if (imageUris.length === 0) {
    console.log('MultiImageLocationSubmissionModal: no images, not rendering');
    return null;
  }

  console.log('MultiImageLocationSubmissionModal rendering with:', { 
    visible, 
    imageCount: imageUris.length, 
    latitude, 
    longitude 
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{title}</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              <Text style={styles.loadingText}>Loading location details...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.imageCountText}>
                {imageUris.length} Image{imageUris.length !== 1 ? 's' : ''} Selected
              </Text>
              
              <ScrollView style={styles.imagesContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.imagesGrid}>
                  {imageUris.map((imageUri, index) => (
                    <View key={`${imageUri}-${index}`} style={styles.imageWrapper}>
                      <ImageWithLocationOverlay
                        ref={(ref) => {
                          viewShotRefs.current[index] = ref;
                        }}
                        imageUri={imageUri}
                        latitude={latitude}
                        longitude={longitude}
                        timestamp={timestamp}
                        address={address}
                      />
                      <View style={styles.imageBadge}>
                        <Text style={styles.imageBadgeText}>{index + 1}</Text>
                      </View>
                      {onRemoveImage && imageUris.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => onRemoveImage(index)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <XMarkIcon size={16} color={COLORS.WHITE} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </>
          )}
          
          <View style={styles.infoContainer}>
            <MapPinIcon size={16} color={COLORS.PRIMARY} />
            <Text style={styles.infoText}>
              Images will be saved with location and timestamp information embedded.
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isCapturing}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            {onAddMore && (
              <TouchableOpacity
                style={[styles.button, styles.addMoreButton]}
                onPress={onAddMore}
                disabled={isCapturing}>
                <Text style={styles.addMoreButtonText}>Add More</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isLoading || isCapturing}>
              {isCapturing ? (
                <ActivityIndicator size="small" color={COLORS.WHITE} />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING_MEDIUM,
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS_LARGE,
    padding: SIZES.PADDING_LARGE,
    width: '95%',
    maxWidth: 450,
    maxHeight: '90%',
    ...SHADOWS.MEDIUM,
  },
  modalTitle: {
    fontSize: SIZES.FONT_SIZE_TITLE,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SIZES.MARGIN_LARGE,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.PADDING_LARGE,
  },
  loadingText: {
    marginTop: SIZES.MARGIN_MEDIUM,
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.TEXT_SECONDARY,
  },
  imageCountText: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SIZES.MARGIN_MEDIUM,
    fontWeight: '500',
  },
  imagesContainer: {
    maxHeight: 400,
    marginBottom: SIZES.MARGIN_MEDIUM,
  },
  imagesGrid: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    maxWidth: 350, // Reasonable max width
    marginBottom: SIZES.MARGIN_MEDIUM,
    position: 'relative',
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    overflow: 'hidden',
    ...SHADOWS.LIGHT,
  },
  imageBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageBadgeText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_LIGHT,
    padding: SIZES.PADDING_MEDIUM,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    marginBottom: SIZES.MARGIN_LARGE,
  },
  infoText: {
    marginLeft: SIZES.MARGIN_SMALL,
    fontSize: SIZES.FONT_SIZE_SMALL,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SIZES.MARGIN_MEDIUM,
  },
  button: {
    flex: 1,
    paddingVertical: SIZES.PADDING_MEDIUM,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SIZES.BUTTON_HEIGHT_MEDIUM,
  },
  cancelButton: {
    backgroundColor: COLORS.GRAY_MEDIUM,
  },
  cancelButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '600',
  },
  addMoreButton: {
    backgroundColor: COLORS.SECONDARY || '#FF6B35',
  },
  addMoreButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '600',
  },
});

export default MultiImageLocationSubmissionModal;
