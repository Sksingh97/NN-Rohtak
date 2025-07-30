import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Text,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { STRINGS } from '../constants/strings';

interface LoaderProps {
  visible: boolean;
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ visible, text = STRINGS.LOADING }) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent>
      <View style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.PRIMARY}
            style={styles.spinner}
          />
          <Text style={styles.text}>{text}</Text>
        </View>
      </View>
    </Modal>
  );
};

interface WithLoaderProps {
  isLoading?: boolean;
  loadingText?: string;
}

export const withLoader = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & WithLoaderProps> => {
  return ({ isLoading = false, loadingText, ...props }) => (
    <>
      <Component {...(props as P)} />
      <Loader visible={isLoading} text={loadingText} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    backgroundColor: COLORS.WHITE,
    padding: SIZES.PADDING_LARGE,
    borderRadius: SIZES.BORDER_RADIUS_LARGE,
    alignItems: 'center',
    minWidth: 120,
  },
  spinner: {
    marginBottom: SIZES.MARGIN_MEDIUM,
  },
  text: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
});

export default Loader;
