# Nagar Nigam Rohtak - React Native App

A modern React Native application for Nagar Nigam (Municipal Corporation) with attendance tracking and site management features.

## Features

### 🔐 Authentication
- Username/Password login system
- Role-based access (User Role 1: Single site access, User Role 2: Multiple sites access)
- Secure token-based authentication

### 📍 Site Management
- Site listing with search functionality
- Lazy loading for better performance
- Role-based tabs (My Sites | All Sites)
- Site details with location information

### 📸 Attendance Tracking
- Photo-based attendance with geo-location
- Camera or gallery image selection
- Two views: Today | Month
- Real-time attendance records with thumbnails

### 🎨 Modern UI/UX
- Material Design inspired interface
- Dark/Light theme support
- Smooth animations and transitions
- Responsive design

## Tech Stack

- **Framework**: React Native 0.80.2
- **State Management**: Redux Toolkit + Redux Saga
- **Navigation**: React Navigation v6
- **UI Components**: Custom components with modern styling
- **Permissions**: react-native-permissions
- **Image Handling**: react-native-image-picker
- **Location**: react-native-geolocation-service
- **Icons**: react-native-vector-icons

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Loader.tsx
├── constants/           # App constants
│   ├── api.ts          # API endpoints and dummy data
│   ├── strings.ts      # String constants
│   └── theme.ts        # Theme colors, sizes, fonts
├── navigation/          # Navigation setup
│   └── AppNavigator.tsx
├── screens/            # Screen components
│   ├── LoginScreen.tsx
│   ├── SiteListScreen.tsx
│   └── SiteDetailScreen.tsx
├── store/              # Redux store
│   ├── slices/         # Redux slices
│   ├── sagas/          # Redux sagas
│   └── index.ts
├── types/              # TypeScript types
│   └── index.ts
└── utils/              # Utility functions
    └── helpers.ts
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NNRohtak
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Android Setup**
   - Make sure Android development environment is set up
   - Required permissions are already added to AndroidManifest.xml

## Demo Credentials

### Admin User (Role 2 - Multiple Sites Access)
- **Username**: `admin`
- **Password**: `admin123`

### Regular User (Role 1 - Single Site Access)
- **Username**: `user`
- **Password**: `user123`

## Running the App

### Development Mode

1. **Start Metro bundler**
   ```bash
   npm start
   ```

2. **Run on iOS**
   ```bash
   npm run ios
   ```

3. **Run on Android**
   ```bash
   npm run android
   ```

### Production Build

```bash
# iOS
npm run build:ios

# Android
npm run build:android
```

## API Integration

The app currently uses dummy data for development. To integrate with real APIs:

1. Update `src/constants/api.ts` with actual API endpoints
2. Modify the saga files in `src/store/sagas/` to make real API calls
3. Update the response handling logic as per your API structure

### API Endpoints Structure

```typescript
// Expected API endpoints
{
  LOGIN: '/auth/login',
  GET_SITES: '/sites',
  MARK_ATTENDANCE: '/attendance/mark',
  GET_ATTENDANCE: '/attendance/:siteId'
}
```

## Permissions

The app requires the following permissions:

### iOS (Info.plist)
- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSLocationWhenInUseUsageDescription`

### Android (AndroidManifest.xml)
- `CAMERA`
- `WRITE_EXTERNAL_STORAGE`
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`

## Key Features Implementation

### 1. HOC Loader
- Reusable loading component
- Can be applied to any screen
- Centralized loading state management

### 2. Redux Saga for Async Operations
- Handles all API calls
- Error handling and retry logic
- Loading states management

### 3. Role-based UI
- Dynamic tab display based on user role
- Different site access levels
- Conditional rendering

### 4. Image Handling
- Camera capture with permissions
- Gallery selection
- Image optimization and upload

### 5. Geolocation Integration
- Real-time location capture
- Permission handling
- Location-based attendance verification

## Customization

### Theming
Update `src/constants/theme.ts` to customize:
- Colors
- Fonts
- Sizes
- Shadows

### Strings
Update `src/constants/strings.ts` for:
- Localization
- Text content
- Error messages

### API Configuration
Update `src/constants/api.ts` for:
- API endpoints
- Request/response formats
- Dummy data structure

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Building for Production

### iOS
1. Open `ios/NNRohtak.xcworkspace` in Xcode
2. Select your provisioning profile
3. Archive and upload to App Store

### Android
1. Generate signed APK
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
2. APK will be generated in `android/app/build/outputs/apk/release/`

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow React Native best practices
4. Test on both iOS and Android platforms

## Support

For issues or questions, please create an issue in the repository or contact the development team.

## License

This project is licensed under the MIT License.
