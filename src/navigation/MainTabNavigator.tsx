import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native';
import { MapPinIcon, MapIcon, UserIcon, UsersIcon, ArrowRightOnRectangleIcon } from 'react-native-heroicons/outline';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { logoutUser } from '../store/slices/authSlice';
import { COLORS } from '../constants/theme';
import { STRINGS } from '../constants/strings';

// Import screens
import SiteListScreen from '../screens/SiteListScreen';
import SweeperListScreen from '../screens/SweeperListScreen';
import LogoutModal from '../components/LogoutModal';

export type MainTabParamList = {
  MySites: undefined;
  AllSites: undefined;
  MySweepers: undefined;
  AllSweepers: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Wrapper components for different site views
const MySitesScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <SiteListScreen navigation={navigation} showAll={false} />
);

const AllSitesScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <SiteListScreen navigation={navigation} showAll={true} />
);

// Wrapper components for different sweeper views
const MySweepersScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <SweeperListScreen navigation={navigation} showAll={false} />
);

const AllSweepersScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <SweeperListScreen navigation={navigation} showAll={true} />
);

const MainTabNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    dispatch(logoutUser());
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const renderHeaderRight = () => (
    <TouchableOpacity
      style={{ marginRight: 15, padding: 5 }}
      onPress={handleLogout}
    >
      <ArrowRightOnRectangleIcon size={24} color={COLORS.WHITE} />
    </TouchableOpacity>
  );

  const renderIcon = ({ color, size, route }: { color: string; size?: number; route: any }) => {
    const iconSize = size || 24;
    
    if (route.name === 'MySites') {
      return <MapPinIcon size={iconSize} color={color} />;
    } else if (route.name === 'AllSites') {
      return <MapIcon size={iconSize} color={color} />;
    } else if (route.name === 'MySweepers') {
      return <UserIcon size={iconSize} color={color} />;
    } else if (route.name === 'AllSweepers') {
      return <UsersIcon size={iconSize} color={color} />;
    }
    
    return <MapPinIcon size={iconSize} color={color} />;
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => renderIcon({ color, size, route }),
          tabBarActiveTintColor: COLORS.PRIMARY,
          tabBarInactiveTintColor: COLORS.GRAY_MEDIUM,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          tabBarStyle: {
            backgroundColor: COLORS.WHITE,
            // backgroundColor: 'red',
            borderTopWidth: 1,
            borderTopColor: COLORS.BORDER_LIGHT,
            paddingTop: 5,
            paddingBottom: 5,
            height: 70,
            
          },
          headerStyle: {
            backgroundColor: COLORS.PRIMARY,
            // backgroundColor: 'red',
            
          },
          headerTintColor: COLORS.WHITE,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: renderHeaderRight,
        })}
      >
        <Tab.Screen 
          name="MySites" 
          component={MySitesScreen}
          options={{
            tabBarLabel: 'My Sites',
            title: 'My Sites',
          }}
        />
        <Tab.Screen 
          name="AllSites" 
          component={AllSitesScreen}
          options={{
            tabBarLabel: 'All Sites',
            title: 'All Sites',
          }}
        />
        <Tab.Screen 
          name="MySweepers" 
          component={MySweepersScreen}
          options={{
            tabBarLabel: 'My Sweepers',
            title: 'My Sweepers',
          }}
        />
        <Tab.Screen 
          name="AllSweepers" 
          component={AllSweepersScreen}
          options={{
            tabBarLabel: 'All Sweepers',
            title: 'All Sweepers',
          }}
        />
      </Tab.Navigator>
      
      <LogoutModal
        visible={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </>
  );
};

export default MainTabNavigator;
