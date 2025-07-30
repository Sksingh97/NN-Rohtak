import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={COLORS.GRAY_MEDIUM}
        {...props}
      />
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
  input: {
    height: SIZES.INPUT_HEIGHT,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    paddingHorizontal: SIZES.PADDING_MEDIUM,
    fontSize: SIZES.FONT_SIZE_LARGE,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: COLORS.WHITE,
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
