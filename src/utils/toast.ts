import Toast from 'react-native-toast-message';

export const showSuccessToast = (message: string, title?: string) => {
  Toast.show({
    type: 'success',
    text1: title || 'Success',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 60,
  });
};

export const showErrorToast = (message: string, title?: string) => {
  Toast.show({
    type: 'error',
    text1: title || 'Error',
    text2: message || 'An error occurred',
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 60,
  });
};

export const showInfoToast = (message: string, title?: string) => {
  Toast.show({
    type: 'info',
    text1: title || 'Info',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 60,
  });
};

export const showWarningToast = (message: string, title?: string) => {
  Toast.show({
    type: 'info', // react-native-toast-message doesn't have warning, use info
    text1: title || 'Warning',
    text2: message,
    position: 'top',
    visibilityTime: 3500,
    autoHide: true,
    topOffset: 60,
  });
};
