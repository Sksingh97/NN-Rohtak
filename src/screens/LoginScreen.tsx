import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RootState, AppDispatch } from '../store';
import { loginUser, clearError } from '../store/slices/authSlice';
import { withLoader } from '../components/Loader';
import Button from '../components/Button';
import Input from '../components/Input';
import { showErrorToast } from '../utils/toast';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { STRINGS } from '../constants/strings';
import { requestAllPermissions } from '../utils/permissions';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('SiteList');
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    if (error) {
      showErrorToast(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Request permissions once when login screen loads
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        console.log('🔐 Requesting app permissions silently...');
        const result = await requestAllPermissions();
        
        if (result.granted) {
          console.log('✅ All permissions granted successfully');
        } else {
          console.log('⚠️ Some permissions were denied:', result.denied);
          // Note: We don't show any UI for denied permissions, just log them
          // The app will request specific permissions when needed
        }
      } catch (error) {
        console.error('❌ Error requesting permissions:', error);
        // Silent failure - don't block the login process
      }
    };

    // Request permissions with a small delay to avoid blocking the UI
    const timeoutId = setTimeout(requestPermissions, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array - run only once

  const validateForm = () => {
    let isValid = true;
    
    if (!mobile.trim()) {
      setMobileError('Mobile number is required');
      isValid = false;
    } else {
      setMobileError('');
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleLogin = () => {
    if (validateForm()) {
      dispatch(loginUser({ mobile: mobile.trim(), password }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Image 
                source={require('../assets/appIcon.png')} 
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Swachh Bharat Mission</Text>
            <Text style={styles.subtitle}>Rohtak</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.loginTitle}>{STRINGS.LOGIN}</Text>
            
            <Input
              label="Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              placeholder="Enter your mobile number"
              autoCapitalize="none"
              keyboardType="phone-pad"
              error={mobileError}
            />

            <Input
              label={STRINGS.PASSWORD}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              showPasswordToggle={true}
              error={passwordError}
            />

            <Button
              title={STRINGS.LOGIN_BUTTON}
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
            />

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SIZES.PADDING_LARGE,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_EXTRA_LARGE * 2,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_LARGE,
    backgroundColor: COLORS.WHITE,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 20,
  },
  title: {
    fontSize: SIZES.FONT_SIZE_HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_SMALL,
  },
  subtitle: {
    fontSize: SIZES.FONT_SIZE_LARGE,
    color: COLORS.TEXT_SECONDARY,
  },
  formContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS_LARGE,
    padding: SIZES.PADDING_LARGE,
    ...SHADOWS.MEDIUM,
  },
  loginTitle: {
    fontSize: SIZES.FONT_SIZE_TITLE,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SIZES.MARGIN_LARGE,
  },
  loginButton: {
    marginTop: SIZES.MARGIN_LARGE,
  },
  credentialsContainer: {
    marginTop: SIZES.MARGIN_LARGE,
    padding: SIZES.PADDING_MEDIUM,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
  },
  credentialsTitle: {
    fontSize: SIZES.FONT_SIZE_SMALL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_SMALL,
  },
  credentialsText: {
    fontSize: SIZES.FONT_SIZE_SMALL,
    color: COLORS.TEXT_SECONDARY,
  },
});

export default withLoader(LoginScreen);
