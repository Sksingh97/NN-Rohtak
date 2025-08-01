import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { ImageWithLocationOverlay } from './ImageWithLocationOverlay';
import { showErrorToast } from '../utils/toast';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { safeReverseGeocode, networkAwareReverseGeocode } from '../utils/imageUtils';
import { robustReverseGeocode } from '../utils/geocodingRecovery';

interface LocationSubmissionModalProps {
  visible: boolean;
  imageUri: string | null;
  latitude: number;
  longitude: number;
  timestamp: string;
  onSubmit: (imageWithOverlay: string, address: string) => void;
  onCancel: () => void;
  title: string;
}

export const LocationSubmissionModal: React.FC<LocationSubmissionModalProps> = ({
  visible,
  imageUri,
  latitude,
  longitude,
  timestamp,
  onSubmit,
  onCancel,
  title,
}) => {
  const viewShotRef = useRef<ViewShot>(null);
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const loadAddress = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🏠 Loading address for coordinates:', { latitude, longitude });
      const result = await robustReverseGeocode(latitude, longitude, true);
      console.log('🏠 Address loaded:', result);
      setAddress(result.address);
    } catch (error: any) {
      console.error('❌ Failed to get address:', error.message || error);
      const fallbackAddress = `${latitude?.toFixed(6) || 'Unknown'}, ${longitude?.toFixed(6) || 'Unknown'}`;
      console.log('🔄 Using final fallback address:', fallbackAddress);
      setAddress(fallbackAddress);
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
    console.log('LocationSubmissionModal handleSubmit called');
    if (!imageUri || !viewShotRef.current?.capture) {
      console.log('Missing data for submit:', { imageUri, viewShotRef: !!viewShotRef.current });
      showErrorToast('Image not available for processing');
      return;
    }

    setIsCapturing(true);
    try {
      console.log('Capturing image with overlay...');
      const capturedImageUri = await viewShotRef.current.capture();
      console.log('Image captured successfully:', capturedImageUri);
      onSubmit(capturedImageUri, address);
    } catch (error) {
      console.error('Error capturing image:', error);
      showErrorToast('Failed to process image with location overlay');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!imageUri) {
    console.log('LocationSubmissionModal: imageUri is null, not rendering');
    return null;
  }

  console.log('LocationSubmissionModal rendering with:', { visible, imageUri, latitude, longitude });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{title}</Text>
          
          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                <Text style={styles.loadingText}>Loading location details...</Text>
              </View>
            ) : (
              <View style={styles.imageContainer}>
                <ImageWithLocationOverlay
                  ref={viewShotRef}
                  imageUri={imageUri}
                  latitude={latitude}
                  longitude={longitude}
                  timestamp={timestamp}
                  address={address}
                />
              </View>
            )}
            
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                The image will be saved with location and timestamp information embedded.
              </Text>
            </View>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isCapturing}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isLoading || isCapturing}>
              {isCapturing ? (
                <ActivityIndicator size="small" color={COLORS.WHITE} />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
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
    maxHeight: '70%', // Increased to allow more space
    flex: 1,
    marginVertical: SIZES.MARGIN_LARGE,
    ...SHADOWS.MEDIUM,
  },
  modalTitle: {
    fontSize: SIZES.FONT_SIZE_TITLE,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SIZES.MARGIN_LARGE,
  },
  scrollContent: {
    flex: 1, // Allow scroll content to take available space
  },
  scrollContentContainer: {
    flexGrow: 1, // Allow content to expand as needed
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.PADDING_EXTRA_LARGE,
  },
  loadingText: {
    marginTop: SIZES.MARGIN_MEDIUM,
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.TEXT_SECONDARY,
  },
  imageContainer: {
    marginBottom: SIZES.MARGIN_LARGE,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    overflow: 'hidden',
    // Remove fixed height to allow full image display
    ...SHADOWS.LIGHT,
  },
  infoContainer: {
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    padding: SIZES.PADDING_MEDIUM,
    marginBottom: SIZES.MARGIN_LARGE,
  },
  infoText: {
    fontSize: SIZES.FONT_SIZE_SMALL,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '500',
  },
});

export default LocationSubmissionModal;
