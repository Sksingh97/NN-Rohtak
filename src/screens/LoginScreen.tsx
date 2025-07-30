import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
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
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { STRINGS } from '../constants/strings';

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
      Alert.alert(STRINGS.ERROR, error, [
        { text: 'OK', onPress: () => dispatch(clearError()) }
      ]);
    }
  }, [error, dispatch]);

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
              <Text style={styles.logoText}>NN</Text>
            </View>
            <Text style={styles.title}>Nagar Nigam</Text>
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
    width: 80,
    height: 80,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_LARGE,
    ...SHADOWS.MEDIUM,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.WHITE,
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
