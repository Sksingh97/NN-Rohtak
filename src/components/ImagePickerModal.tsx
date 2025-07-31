import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { CameraIcon, PhotoIcon, XMarkIcon } from 'react-native-heroicons/outline';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
  title: string;
  allowMultiple?: boolean;
}

const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  onClose,
  onCamera,
  onGallery,
  title,
  allowMultiple = false,
}) => {
  const handleCamera = () => {
    onClose();
    setTimeout(onCamera, 300); // Small delay to allow modal to close smoothly
  };

  const handleGallery = () => {
    onClose();
    setTimeout(onGallery, 300); // Small delay to allow modal to close smoothly
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{title}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <XMarkIcon size={20} color={COLORS.GRAY_MEDIUM} />
                </TouchableOpacity>
              </View>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {/* Take Photo Option */}
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleCamera}
                  activeOpacity={0.7}>
                  <View style={styles.optionIconContainer}>
                    <CameraIcon size={28} color={COLORS.PRIMARY} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Take Photo</Text>
                    <Text style={styles.optionDescription}>
                      Capture a new photo with camera
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Choose from Gallery Option */}
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleGallery}
                  activeOpacity={0.7}>
                  <View style={styles.optionIconContainer}>
                    <PhotoIcon size={28} color={COLORS.PRIMARY} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>
                      {allowMultiple ? 'Select Photos' : 'Choose from Gallery'}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {allowMultiple 
                        ? 'Select multiple photos from gallery'
                        : 'Pick a photo from your gallery'
                      }
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingHorizontal: SIZES.PADDING_MEDIUM,
    paddingBottom: SIZES.PADDING_LARGE,
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS_LARGE,
    paddingVertical: SIZES.PADDING_LARGE,
    ...SHADOWS.MEDIUM,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING_LARGE,
    paddingBottom: SIZES.PADDING_MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  modalTitle: {
    fontSize: SIZES.FONT_SIZE_LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    padding: SIZES.PADDING_SMALL,
  },
  optionsContainer: {
    paddingHorizontal: SIZES.PADDING_LARGE,
    paddingVertical: SIZES.PADDING_MEDIUM,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING_LARGE,
    paddingHorizontal: SIZES.PADDING_MEDIUM,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    marginVertical: SIZES.MARGIN_SMALL,
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  optionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${COLORS.PRIMARY}15`, // 15% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.MARGIN_MEDIUM,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: SIZES.FONT_SIZE_SMALL,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  cancelButton: {
    marginHorizontal: SIZES.MARGIN_LARGE,
    marginTop: SIZES.MARGIN_MEDIUM,
    paddingVertical: SIZES.PADDING_MEDIUM,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT_SECONDARY,
  },
});

export default ImagePickerModal;
