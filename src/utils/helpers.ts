import { Platform, Alert, Linking } from 'react-native';
import { request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { STRINGS } from '../constants/strings';

export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
    const result = await request(permission);
    
    if (result === RESULTS.GRANTED) {
      return true;
    } else if (result === RESULTS.DENIED) {
      Alert.alert(
        STRINGS.CAMERA_PERMISSION_TITLE,
        STRINGS.CAMERA_PERMISSION_MESSAGE,
        [{ text: 'OK' }]
      );
    } else if (result === RESULTS.BLOCKED) {
      Alert.alert(
        STRINGS.CAMERA_PERMISSION_TITLE,
        STRINGS.CAMERA_PERMISSION_MESSAGE,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: STRINGS.SETTINGS, onPress: () => openSettings() },
        ]
      );
    }
    return false;
  } catch (error) {
    console.error('Camera permission error:', error);
    return false;
  }
};

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const permission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    
    const result = await request(permission);
    
    if (result === RESULTS.GRANTED) {
      return true;
    } else if (result === RESULTS.DENIED) {
      Alert.alert(
        STRINGS.LOCATION_PERMISSION_TITLE,
        STRINGS.LOCATION_PERMISSION_MESSAGE,
        [{ text: 'OK' }]
      );
    } else if (result === RESULTS.BLOCKED) {
      Alert.alert(
        STRINGS.LOCATION_PERMISSION_TITLE,
        STRINGS.LOCATION_PERMISSION_MESSAGE,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: STRINGS.SETTINGS, onPress: () => openSettings() },
        ]
      );
    }
    return false;
  } catch (error) {
    console.error('Location permission error:', error);
    return false;
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};
