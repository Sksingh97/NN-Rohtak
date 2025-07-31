import { Platform, Alert, Linking } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  Permission,
  request,
  requestMultiple,
  openSettings,
  check,
} from 'react-native-permissions';

export interface PermissionResult {
  granted: boolean;
  denied: string[];
  message?: string;
}

// Define permissions for each platform
const ANDROID_PERMISSIONS: Permission[] = [
  PERMISSIONS.ANDROID.CAMERA,
  PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
  // Note: WRITE_EXTERNAL_STORAGE is not needed for API 30+ for app-specific storage
  // But keeping it for compatibility with older Android versions
  PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
];

const IOS_PERMISSIONS: Permission[] = [
  PERMISSIONS.IOS.CAMERA,
  PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  PERMISSIONS.IOS.PHOTO_LIBRARY,
];

// Get platform-specific permissions
const getPermissionsForPlatform = (): Permission[] => {
  return Platform.OS === 'android' ? ANDROID_PERMISSIONS : IOS_PERMISSIONS;
};

// Permission descriptions for user-friendly messages
const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  [PERMISSIONS.ANDROID.CAMERA]: 'Camera',
  [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]: 'Location',
  [PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION]: 'Location',
  [PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE]: 'Storage',
  [PERMISSIONS.IOS.CAMERA]: 'Camera',
  [PERMISSIONS.IOS.LOCATION_WHEN_IN_USE]: 'Location',
  [PERMISSIONS.IOS.PHOTO_LIBRARY]: 'Photo Library',
};

/**
 * Request all necessary permissions for the app (silently) - Simplified version
 */
export const requestAllPermissions = async (): Promise<PermissionResult> => {
  try {
    const permissions = getPermissionsForPlatform();
    console.log('Requesting permissions:', permissions.map(p => PERMISSION_DESCRIPTIONS[p] || p));
    
    const results = await requestMultiple(permissions);
    console.log('Permission results:', results);
    
    const denied: string[] = [];
    let allGranted = true;
    
    // Check results
    Object.entries(results).forEach(([permission, result]) => {
      const description = PERMISSION_DESCRIPTIONS[permission] || permission;
      
      switch (result) {
        case RESULTS.GRANTED:
          console.log(`✅ ${description} permission granted`);
          break;
        case RESULTS.DENIED:
        case RESULTS.BLOCKED:
        case RESULTS.LIMITED:
          console.log(`❌ ${description} permission denied/blocked`);
          denied.push(description);
          allGranted = false;
          break;
        case RESULTS.UNAVAILABLE:
          console.log(`ℹ️  ${description} permission unavailable on this device`);
          // Don't consider unavailable as denied for compatibility
          break;
      }
    });
    
    const result = {
      granted: allGranted,
      denied,
      message: allGranted 
        ? 'All permissions granted successfully' 
        : `Some permissions were denied: ${denied.join(', ')}`
    };
    
    console.log('📱 Permission summary:', result.message);
    return result;
    
  } catch (error) {
    console.error('❌ Error requesting permissions:', error);
    return {
      granted: false,
      denied: ['Unknown'],
      message: 'Failed to request permissions'
    };
  }
};

/**
 * Show alert for denied permissions with option to open settings
 */
export const showPermissionAlert = (deniedPermissions: string[]) => {
  const title = 'Permissions Required';
  const message = `This app needs the following permissions to function properly:\n\n${deniedPermissions.join('\n')}\n\nYou can grant these permissions in the app settings.`;
  
  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: () => {
          openSettings().catch(() => {
            // Fallback to device settings if openSettings fails
            Linking.openSettings();
          });
        },
      },
    ],
    { cancelable: false }
  );
};

/**
 * Request a single permission with user-friendly handling
 */
export const requestSinglePermission = async (permission: Permission): Promise<boolean> => {
  try {
    const result = await request(permission);
    const description = PERMISSION_DESCRIPTIONS[permission] || 'Permission';
    
    switch (result) {
      case RESULTS.GRANTED:
        console.log(`${description} permission granted`);
        return true;
      case RESULTS.DENIED:
      case RESULTS.BLOCKED:
        console.log(`${description} permission denied/blocked`);
        showPermissionAlert([description]);
        return false;
      case RESULTS.UNAVAILABLE:
        console.log(`${description} permission unavailable`);
        return true; // Consider as granted if unavailable
      default:
        return false;
    }
  } catch (error) {
    console.error('Error requesting single permission:', error);
    return false;
  }
};

/**
 * Check if all required permissions are granted
 */
export const checkAllPermissions = async (): Promise<boolean> => {
  try {
    const permissions = getPermissionsForPlatform();
    const results = await requestMultiple(permissions);
    
    return Object.values(results).every(
      result => result === RESULTS.GRANTED || result === RESULTS.UNAVAILABLE
    );
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

/**
 * Get camera permission specifically
 */
export const getCameraPermission = async (): Promise<boolean> => {
  const permission = Platform.OS === 'android' 
    ? PERMISSIONS.ANDROID.CAMERA 
    : PERMISSIONS.IOS.CAMERA;
    
  return requestSinglePermission(permission);
};

/**
 * Get location permission specifically
 */
export const getLocationPermission = async (): Promise<boolean> => {
  const permissions = Platform.OS === 'android' 
    ? [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION]
    : [PERMISSIONS.IOS.LOCATION_WHEN_IN_USE];
    
  try {
    const results = await requestMultiple(permissions);
    return Object.values(results).some(result => result === RESULTS.GRANTED);
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get storage permission specifically (Android only)
 */
export const getStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return true; // iOS handles storage permissions differently
  }
  
  return requestSinglePermission(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
};
