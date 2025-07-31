import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { 
  requestAllPermissions, 
  checkAllPermissions,
  PermissionResult 
} from '../utils/permissions';

interface UsePermissionsReturn {
  permissionsGranted: boolean;
  isLoading: boolean;
  requestPermissions: () => Promise<void>;
  checkPermissions: () => Promise<void>;
}

/**
 * Custom hook for managing app permissions
 */
export const usePermissions = (autoRequest: boolean = false): UsePermissionsReturn => {
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check permissions when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkPermissions();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Check permissions on mount
    if (autoRequest) {
      requestPermissions();
    } else {
      checkPermissions();
    }

    return () => {
      subscription?.remove();
    };
  }, [autoRequest]);

  /**
   * Check if permissions are already granted
   */
  const checkPermissions = async () => {
    try {
      setIsLoading(true);
      const allGranted = await checkAllPermissions();
      setPermissionsGranted(allGranted);
      console.log('Permissions check result:', allGranted);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissionsGranted(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request all necessary permissions (silently)
   */
  const requestPermissions = async () => {
    try {
      setIsLoading(true);
      console.log('Requesting all permissions silently...');
      
      const result: PermissionResult = await requestAllPermissions();
      
      setPermissionsGranted(result.granted);
      
      if (result.granted) {
        console.log('All permissions granted successfully');
      } else {
        console.log('Some permissions were denied:', result.denied);
        // Note: Not showing UI alert as requested - permissions will be requested when needed
      }
      
      console.log('Permission request completed:', result);
      
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setPermissionsGranted(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    permissionsGranted,
    isLoading,
    requestPermissions,
    checkPermissions,
  };
};
