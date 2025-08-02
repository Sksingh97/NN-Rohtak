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
    timeZone: 'Asia/Kolkata', // Show UTC date as received from server
  });
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata', // Show IST time as received from server
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
    timeZone: 'Asia/Kolkata', // Show IST time as received from server
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

// Date range helpers for attendance filtering
export const getCurrentMonthRange = (): { startDate: string; endDate: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based (0 = January, 11 = December)
  
  // Last day of current month
  const lastDay = new Date(year, month + 1, 0).getDate();
  
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  
  return { startDate, endDate };
};

export const getLastMonthRange = (): { startDate: string; endDate: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  
  // Calculate last month's year and month
  const lastMonthYear = month === 0 ? year - 1 : year;
  const lastMonth = month === 0 ? 11 : month - 1; // 0-based
  
  // Last day of last month
  const lastDay = new Date(lastMonthYear, lastMonth + 1, 0).getDate();
  
  const startDate = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-01`;
  const endDate = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  
  return { startDate, endDate };
};

// Helper function to format date for display in grouped task images
export const formatDateForGrouping = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time to compare just the date
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  
  if (inputDate.getTime() === todayDate.getTime()) {
    return 'Today';
  } else if (inputDate.getTime() === yesterdayDate.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }
};
