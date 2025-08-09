import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ArrowRightOnRectangleIcon, XMarkIcon } from 'react-native-heroicons/outline';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { STRINGS } from '../constants/strings';

interface LogoutModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const { width } = Dimensions.get('window');

const LogoutModal: React.FC<LogoutModalProps> = ({ visible, onConfirm, onCancel }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <ArrowRightOnRectangleIcon size={24} color={COLORS.ERROR} />
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <XMarkIcon size={20} color={COLORS.GRAY_MEDIUM} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{STRINGS.LOGOUT}</Text>
            <Text style={styles.message}>
              Are you sure you want to logout? You will need to sign in again to access the app.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING_LARGE,
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS_LARGE,
    width: width - (SIZES.PADDING_LARGE * 2),
    maxWidth: 340,
    ...SHADOWS.MEDIUM,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING_LARGE,
    paddingTop: SIZES.PADDING_LARGE,
    paddingBottom: SIZES.PADDING_SMALL,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.ERROR + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: SIZES.PADDING_SMALL,
  },
  content: {
    paddingHorizontal: SIZES.PADDING_LARGE,
    paddingBottom: SIZES.PADDING_LARGE,
  },
  title: {
    fontSize: SIZES.FONT_SIZE_TITLE,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_SMALL,
  },
  message: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING_LARGE,
    paddingBottom: SIZES.PADDING_LARGE,
    gap: SIZES.MARGIN_MEDIUM,
  },
  button: {
    flex: 1,
    paddingVertical: SIZES.PADDING_MEDIUM,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.GRAY_LIGHT,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  confirmButton: {
    backgroundColor: COLORS.ERROR,
  },
  cancelButtonText: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  confirmButtonText: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});

export default LogoutModal;
