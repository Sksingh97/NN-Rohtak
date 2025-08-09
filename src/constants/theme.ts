import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Primary Colors
  PRIMARY: '#2E7D32',
  PRIMARY_DARK: '#1B5E20',
  PRIMARY_LIGHT: '#4CAF50',
  
  // Secondary Colors
  SECONDARY: '#FF8F00',
  SECONDARY_DARK: '#E65100',
  SECONDARY_LIGHT: '#FFB74D',
  
  // Neutral Colors
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_LIGHT: '#F5F5F5',
  GRAY_MEDIUM: '#9E9E9E',
  GRAY_DARK: '#424242',
  
  // Status Colors
  SUCCESS: '#4CAF50',
  ERROR: '#F44336',
  WARNING: '#FF9800',
  INFO: '#2196F3',
  
  // Background Colors
  BACKGROUND: '#FAFAFA',
  CARD_BACKGROUND: '#FFFFFF',
  
  // Text Colors
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#757575',
  TEXT_DISABLED: '#BDBDBD',
  
  // Border Colors
  BORDER_LIGHT: '#E0E0E0',
  BORDER_MEDIUM: '#BDBDBD',
};

export const SIZES = {
  // Screen Dimensions
  SCREEN_WIDTH: width,
  SCREEN_HEIGHT: height,
  
  // Padding & Margin
  PADDING_SMALL: 8,
  PADDING_MEDIUM: 16,
  PADDING_LARGE: 24,
  PADDING_EXTRA_LARGE: 32,
  
  MARGIN_SMALL: 8,
  MARGIN_MEDIUM: 16,
  MARGIN_LARGE: 24,
  MARGIN_EXTRA_LARGE: 32,
  
  // Border Radius
  BORDER_RADIUS_SMALL: 4,
  BORDER_RADIUS_MEDIUM: 8,
  BORDER_RADIUS_LARGE: 12,
  BORDER_RADIUS_EXTRA_LARGE: 16,
  
  // Font Sizes
  FONT_SIZE_SMALL: 12,
  FONT_SIZE_MEDIUM: 14,
  FONT_SIZE_LARGE: 16,
  FONT_SIZE_EXTRA_LARGE: 18,
  FONT_SIZE_TITLE: 20,
  FONT_SIZE_HEADER: 24,
  
  // Icon Sizes
  ICON_SMALL: 16,
  ICON_MEDIUM: 24,
  ICON_LARGE: 32,
  ICON_EXTRA_LARGE: 48,
  
  // Button Heights
  BUTTON_HEIGHT_SMALL: 36,
  BUTTON_HEIGHT_MEDIUM: 44,
  BUTTON_HEIGHT_LARGE: 52,
  
  // Input Heights
  INPUT_HEIGHT: 48,
  
  // Image Sizes
  THUMBNAIL_SIZE: 80,
  PROFILE_IMAGE_SIZE: 100,
};

export const FONTS = {
  REGULAR: 'System',
  MEDIUM: 'System',
  BOLD: 'System',
  LIGHT: 'System',
};

export const SHADOWS = {
  LIGHT: {
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  MEDIUM: {
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  HEAVY: {
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  // Custom shadow for rounded components to avoid pointed corners
  ROUNDED: {
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25, // Increased to 0.25 for more visible shadow
    shadowRadius: 2.0, // Reduced to 2.0 for more defined shadow
    elevation: 3, // Increased to 3 for better Android visibility
  },
};
