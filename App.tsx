import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { loadUserFromStorage } from './src/store/slices/authSlice';
import { AppDispatch } from './src/store';

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Load user data from storage when app starts
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  return <AppNavigator />;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
