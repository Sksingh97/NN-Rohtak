import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { loadUserFromStorage, logout } from './src/store/slices/authSlice';
import { AppDispatch } from './src/store';
import { apiService } from './src/services/apiService';

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Set up the unauthorized/forbidden handler for automatic logout
    apiService.setUnauthorizedHandler(() => {
      console.warn('🚨 UNAUTHORIZED/FORBIDDEN HANDLER TRIGGERED - DISPATCHING LOGOUT');
      dispatch(logout());
    });

    // Load user data from storage when app starts
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  return <AppNavigator />;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
      <Toast position="top" topOffset={60} />
    </Provider>
  );
};

export default App;
