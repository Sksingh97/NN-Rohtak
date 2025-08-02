/**
 * Unauthorized Response Handler
 * 
 * This utility handles 401 Unauthorized responses by:
 * 1. Clearing all stored authentication data
 * 2. Showing error toast to user
 * 3. Navigating to login screen
 * 4. Dispatching logout action to Redux store
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { showErrorToast } from './toast';
import { STORAGE_KEYS } from '../services/apiService';

// Navigation reference - will be set from App.tsx
let navigationRef: any = null;

// Store dispatch reference - will be set from App.tsx  
let storeDispatch: any = null;

/**
 * Set navigation reference for handling redirects
 */
export const setNavigationRef = (ref: any) => {
  navigationRef = ref;
};

/**
 * Set store dispatch reference for logout action
 */
export const setStoreDispatch = (dispatch: any) => {
  storeDispatch = dispatch;
};

/**
 * Clear all stored authentication data
 */
const clearAuthStorage = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing authentication storage...');
    
    // Clear all auth-related data from AsyncStorage
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
    ]);
    
    console.log('✅ Authentication storage cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing authentication storage:', error);
    // Continue with logout even if storage clearing fails
  }
};

/**
 * Navigate to login screen
 */
const navigateToLogin = (): void => {
  try {
    if (navigationRef && navigationRef.current) {
      console.log('🧭 Navigating to login screen...');
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      console.log('✅ Navigation to login successful');
    } else {
      console.warn('⚠️ Navigation reference not available');
    }
  } catch (error) {
    console.error('❌ Error navigating to login:', error);
  }
};

/**
 * Dispatch logout action to Redux store
 */
const dispatchLogout = (): void => {
  try {
    if (storeDispatch) {
      console.log('🔄 Dispatching logout action...');
      // Import logout action dynamically to avoid circular dependencies
      import('../store/slices/authSlice').then(({ logout }) => {
        storeDispatch(logout());
        console.log('✅ Logout action dispatched successfully');
      });
    } else {
      console.warn('⚠️ Store dispatch not available');
    }
  } catch (error) {
    console.error('❌ Error dispatching logout:', error);
  }
};

/**
 * Main unauthorized handler - called when API returns 401
 */
export const handleUnauthorizedAccess = async (): Promise<void> => {
  console.warn('🚨 UNAUTHORIZED ACCESS DETECTED - Starting auto-logout process...');
  
  try {
    // Show error toast to user
    showErrorToast('Unauthorized access - Please login again');
    
    // Clear authentication storage
    await clearAuthStorage();
    
    // Dispatch logout action to Redux store
    dispatchLogout();
    
    // Navigate to login screen
    navigateToLogin();
    
    console.log('✅ Auto-logout process completed successfully');
  } catch (error) {
    console.error('❌ Error during auto-logout process:', error);
    
    // Even if something fails, still try to navigate to login
    navigateToLogin();
  }
};
