import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { EyeIcon, EyeSlashIcon } from 'react-native-heroicons/outline';
import { COLORS, SIZES } from '../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  showPasswordToggle = false,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Override secureTextEntry when password toggle is enabled
  const actualSecureTextEntry = showPasswordToggle ? !isPasswordVisible : secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            showPasswordToggle && styles.inputWithIcon,
            style,
          ]}
          placeholderTextColor={COLORS.GRAY_MEDIUM}
          secureTextEntry={actualSecureTextEntry}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.eyeIconContainer}
            onPress={togglePasswordVisibility}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {isPasswordVisible ? (
              <EyeSlashIcon 
                size={20} 
                color={COLORS.GRAY_MEDIUM} 
              />
            ) : (
              <EyeIcon 
                size={20} 
                color={COLORS.GRAY_MEDIUM} 
              />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.MARGIN_MEDIUM,
  },
  label: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_SMALL,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    height: SIZES.INPUT_HEIGHT,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    paddingHorizontal: SIZES.PADDING_MEDIUM,
    fontSize: SIZES.FONT_SIZE_LARGE,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: COLORS.WHITE,
    flex: 1,
  },
  inputWithIcon: {
    paddingRight: 50, // Make room for the eye icon
  },
  eyeIconContainer: {
    position: 'absolute',
    right: SIZES.PADDING_MEDIUM,
    height: SIZES.INPUT_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  errorText: {
    fontSize: SIZES.FONT_SIZE_SMALL,
    color: COLORS.ERROR,
    marginTop: SIZES.MARGIN_SMALL,
  },
});

export default Input;
