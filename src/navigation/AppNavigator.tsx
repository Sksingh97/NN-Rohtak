import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { Site, MySweeper, AllSweeper } from '../types';
import { RootState } from '../store';
import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import SiteDetailScreen from '../screens/SiteDetailScreen';
import UserDetailScreen from '../screens/UserDetailScreen';
import { COLORS } from '../constants/theme';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  SiteDetail: { 
    site: Site; 
    sourceTab?: number; // 0 = My Sites, 1 = All Sites (for supervisors)
  };
  UserDetail: {
    user: MySweeper | AllSweeper;
    sourceTab?: number; // 0 = My Sweepers, 1 = All Sweepers
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.PRIMARY,
          },
          headerTintColor: COLORS.WHITE,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SiteDetail"
              component={SiteDetailScreen}
              options={{
                title: 'Site Details',
              }}
            />
            <Stack.Screen
              name="UserDetail"
              component={UserDetailScreen}
              options={{
                title: 'User Details',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
