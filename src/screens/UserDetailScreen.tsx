import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import {
  MapPinIcon,
  CameraIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
} from 'react-native-heroicons/outline';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RootState, AppDispatch } from '../store';
import { AttendanceRecord, GroupedAttendanceRecords, AttendanceGroupDisplayItem, MySweeper, AllSweeper } from '../types';
import {
  fetchTodayDataByUser,
  fetchPaginatedMonthDataByUser,
  markAttendance,
  markUserAttendance,
  resetPaginationState,
  updateHasMore,
} from '../store/slices/attendanceSlice';
import { withLoader } from '../components/Loader';
import Button from '../components/Button';
import LocationSubmissionModal from '../components/LocationSubmissionModal';
import ImagePickerModal from '../components/ImagePickerModal';
import { ATTENDANCE_SHOW_SELECT_FROM_GALLERY } from '../constants/attendanceConfig';
import { requestCameraPermission, requestLocationPermission, formatDateTime, formatDateForGrouping, getCurrentMonthRange, getLastMonthRange } from '../utils/helpers';
import { 
  getTodayRange, 
  getCurrentMonthInfo, 
  getLastMonthInfo, 
  getPaginatedMonthRange, 
  hasMorePages,
  getNextPage 
} from '../utils/datePagination';
import { compressImage, compressMultipleImages } from '../utils/imageUtils';
import { getAttendanceCompressionOptions } from '../constants/imageCompression';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { STRINGS, API_MESSAGES } from '../constants/strings';

type UserDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserDetail'>;
type UserDetailScreenRouteProp = RouteProp<RootStackParamList, 'UserDetail'>;

interface UserDetailScreenProps {
  navigation: UserDetailScreenNavigationProp;
  route: UserDetailScreenRouteProp;
}

const { width } = Dimensions.get('window');
const imageSize = (width - 80) / 3; // Increased spacing for better grid layout

const UserDetailScreen: React.FC<UserDetailScreenProps> = ({ route, navigation }) => {
  const [activeTab, setActiveTab] = useState(0); // 0 for Today's, 1 for This Month, 2 for Last Month
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Attendance modal states
  const [isAttendanceModalVisible, setIsAttendanceModalVisible] = useState(false);
  const [capturedAttendanceImage, setCapturedAttendanceImage] = useState<string | null>(null);
  const [attendanceLocation, setAttendanceLocation] = useState<{
    latitude: number;
    longitude: number;
    timestamp: string;
  } | null>(null);
  
  // Image picker modal states
  const [isAttendancePickerVisible, setIsAttendancePickerVisible] = useState(false);
  
  // Processing states for user feedback
  const [isProcessingAttendanceImage, setIsProcessingAttendanceImage] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  
  const { user: selectedUser, sourceTab } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);
  const { 
    attendanceRecords,
    groupedAttendanceRecords,
    todayAttendance, 
    monthAttendance, 
    thisMonthPagination,
    lastMonthPagination,
    isLoading,
    isMarkingAttendance,
  } = useSelector((state: RootState) => state.attendance);

  // Determine if attendance should be disabled
  // Attendance should be enabled for both tabs
  const isAttendanceDisabled = false;
  
  // Function to fetch attendance for specific tab
  const fetchAttendanceForTab = (tabIndex: number, loadMore: boolean = false) => {
    // Get the correct user ID based on user type
    const userId = 'user_id' in selectedUser ? selectedUser.user_id : selectedUser.id;
    
    if (tabIndex === 0) {
      // Today's tab - single API call with today's date
      console.log('Fetching Today\'s user data for userId:', userId);
      dispatch(fetchTodayDataByUser({ userId }));
    } else if (tabIndex === 1) {
      // This Month tab - paginated calls
      const monthInfo = getCurrentMonthInfo();
      const currentPage = loadMore ? thisMonthPagination.currentPage + 1 : 1;
      
      if (!loadMore) {
        // Reset pagination state for fresh load
        dispatch(resetPaginationState({ isThisMonth: true }));
      }
      
      const paginatedRange = getPaginatedMonthRange(monthInfo, currentPage, 6, true);
      console.log('Fetching This Month user data:', { ...paginatedRange, currentPage, loadMore, userId });
      
      dispatch(fetchPaginatedMonthDataByUser({ 
        userId,
        startDate: paginatedRange.startDate, 
        endDate: paginatedRange.endDate,
        page: currentPage,
        isThisMonth: true,
        append: loadMore
      }));
      
      // Update hasMore flag
      dispatch(updateHasMore({ 
        isThisMonth: true, 
        hasMore: paginatedRange.hasMore 
      }));
    } else {
      // Last Month tab - paginated calls
      const monthInfo = getLastMonthInfo();
      const currentPage = loadMore ? lastMonthPagination.currentPage + 1 : 1;
      
      if (!loadMore) {
        // Reset pagination state for fresh load
        dispatch(resetPaginationState({ isThisMonth: false }));
      }
      
      const paginatedRange = getPaginatedMonthRange(monthInfo, currentPage, 6, false);
      console.log('Fetching Last Month user data:', { ...paginatedRange, currentPage, loadMore, userId });
      
      dispatch(fetchPaginatedMonthDataByUser({ 
        userId,
        startDate: paginatedRange.startDate, 
        endDate: paginatedRange.endDate,
        page: currentPage,
        isThisMonth: false,
        append: loadMore
      }));
      
      // Update hasMore flag
      dispatch(updateHasMore({ 
        isThisMonth: false, 
        hasMore: paginatedRange.hasMore 
      }));
    }
  };

  useEffect(() => {
    // Fetch attendance records for the current tab (default to Today's - tab 0)
    fetchAttendanceForTab(activeTab);
  }, [dispatch, selectedUser, user?.id]);

  const getCurrentLocation = (): Promise<{latitude: number; longitude: number}> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  const showAttendanceImagePicker = async () => {
  // Attendance is always enabled now
    
    // Check configuration to determine if gallery option should be shown
    if (ATTENDANCE_SHOW_SELECT_FROM_GALLERY) {
      // Show picker modal with both camera and gallery options
      setIsAttendancePickerVisible(true);
    } else {
      // For security, only allow camera capture to ensure user is physically present
      // Don't show picker modal - directly open camera
      await openAttendanceCamera();
    }
  };

  const openAttendanceCamera = async () => {
    const hasCameraPermission = await requestCameraPermission();
    if (!hasCameraPermission) {
      return;
    }

    launchCamera(
      {
        mediaType: 'photo' as MediaType,
        quality: 0.8,
        includeBase64: false,
      },
      handleAttendanceImageResponse
    );
  };

  const openAttendanceGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo' as MediaType,
        quality: 0.8,
        includeBase64: false,
      },
      handleAttendanceImageResponse
    );
  };

  const handleAttendanceImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage || !response.assets?.[0]) {
      return;
    }

    const imageUri = response.assets[0].uri!;
    console.log('Attendance image selected:', imageUri);
    
    // Show processing indicator
    console.log('🔄 Starting attendance image processing...');
    setIsProcessingAttendanceImage(true);
    
    try {
      // Get current location
      const hasLocationPermission = await requestLocationPermission();
      if (!hasLocationPermission) {
        showErrorToast('Location permission is required to add location overlay');
        return;
      }

      const location = await getCurrentLocation();
      const timestamp = new Date().toISOString();
      
      console.log('Setting attendance data:', { imageUri, location, timestamp });
      setCapturedAttendanceImage(imageUri);
      setAttendanceLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp,
      });
      setIsAttendanceModalVisible(true);
      console.log('Attendance modal should be visible now');
    } catch (error) {
      showErrorToast('Failed to get location. Please try again.');
      console.error('Location error:', error);
    } finally {
      // Hide processing indicator
      console.log('✅ Attendance image processing completed');
      setIsProcessingAttendanceImage(false);
    }
  };

  const handleAttendanceSubmit = async (imageWithOverlay: string, address: string) => {
    if (!attendanceLocation || !user?.id) {
      showErrorToast('Missing required data for attendance submission');
      return;
    }

    try {
      console.log('Submitting attendance with overlay image:', {
        imageWithOverlay,
        location: attendanceLocation,
        address,
      });

      const attendanceData = {
        userId: 'user_id' in selectedUser ? selectedUser.user_id : selectedUser.id,
        imageUri: imageWithOverlay, // Use the image with overlay
        latitude: attendanceLocation.latitude,
        longitude: attendanceLocation.longitude,
        description: address || 'User attendance',
      };

      await dispatch(markUserAttendance(attendanceData));
      
      // Reset states
      setCapturedAttendanceImage(null);
      setAttendanceLocation(null);
      setIsAttendanceModalVisible(false);
      
      // Refresh current tab data
      fetchAttendanceForTab(activeTab);
      
      showSuccessToast('Attendance marked successfully');
    } catch (error) {
      console.error('Attendance submission error:', error);
      showErrorToast('Failed to submit attendance');
    }
  };

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    fetchAttendanceForTab(tabIndex);
  };

  const openPhotoPreview = (imageUri: string, allImages: string[]) => {
    const currentIndex = allImages.indexOf(imageUri);
    setSelectedImage(imageUri);
    setSelectedImages(allImages);
    setCurrentImageIndex(currentIndex >= 0 ? currentIndex : 0);
    setIsPreviewVisible(true);
  };

  const closePhotoPreview = () => {
    setIsPreviewVisible(false);
    setSelectedImage(null);
    setSelectedImages([]);
    setCurrentImageIndex(0);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImages.length === 0) return;

    let newIndex = currentImageIndex;
    if (direction === 'prev') {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : selectedImages.length - 1;
    } else {
      newIndex = currentImageIndex < selectedImages.length - 1 ? currentImageIndex + 1 : 0;
    }

    setCurrentImageIndex(newIndex);
    setSelectedImage(selectedImages[newIndex]);
  };

  const renderAttendanceGroupItem = (item: AttendanceGroupDisplayItem) => {
    // Defensive check for malformed data
    if (!item || !item.displayRecord) {
      return (
        <View style={styles.attendanceItem}>
          <Text style={styles.attendanceTime}>Invalid data</Text>
        </View>
      );
    }

    const allImageUrls = item.records
      ?.map(record => record?.image_url)
      ?.filter(url => url) || []; // Filter out null/undefined URLs
    
    return (
      <View style={styles.attendanceItem}>
        <TouchableOpacity onPress={() => openPhotoPreview(item.displayRecord.image_url, allImageUrls)}>
          <Image source={{ uri: item.displayRecord.image_url }} style={styles.attendanceImage} />
          {item.recordCount && item.recordCount > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>{item.recordCount || 0}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.attendanceTime}>
          {item.timestamp ? formatDateTime(item.timestamp) : 'No timestamp'}
        </Text>
        <Text style={styles.recordType}>
          Attendance
        </Text>
      </View>
    );
  };

  const canLoadMore = () => {
    if (activeTab === 0) return false; // Today's tab doesn't support pagination
    
    return activeTab === 1 
      ? thisMonthPagination.hasMore 
      : lastMonthPagination.hasMore;
  };

  const handleLoadMore = () => {
    if (canLoadMore()) {
      fetchAttendanceForTab(activeTab, true);
    }
  };

  // Convert flat attendanceRecords to grouped display items for gallery
  const getAttendanceGroupDisplayItems = (): AttendanceGroupDisplayItem[] => {
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return [];
    }
    
    // Group records by date first
    const groupedByDate = attendanceRecords.reduce((acc: { [key: string]: AttendanceRecord[] }, record: AttendanceRecord) => {
      // Defensive check for malformed record
      if (!record || !record.date) {
        return acc;
      }
      
      const date = record.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(record);
      return acc;
    }, {});
    
    // Convert to display items
    return Object.keys(groupedByDate).map((date, index) => {
      const records = groupedByDate[date];
      // Sort records by timestamp
      const sortedRecords = [...records].sort((a, b) => {
        const aTime = a.check_in_time || a.timestamp;
        const bTime = b.check_in_time || b.timestamp;
        
        const aDate = aTime ? new Date(aTime) : new Date(0);
        const bDate = bTime ? new Date(bTime) : new Date(0);
        
        const aValid = !isNaN(aDate.getTime());
        const bValid = !isNaN(bDate.getTime());
        
        if (!aValid && !bValid) return 0;
        if (!aValid) return 1;
        if (!bValid) return -1;
        
        return bDate.getTime() - aDate.getTime();
      });
      
      return {
        id: `attendance-group-${date}-${index}-${activeTab}`,
        date,
        records: sortedRecords,
        displayRecord: sortedRecords[0] || { image_url: '', check_in_time: date, timestamp: date }, // Fallback for empty records
        recordCount: sortedRecords.length,
        timestamp: sortedRecords[0]?.check_in_time || sortedRecords[0]?.timestamp || date,
      };
    }).sort((a, b) => {
      const aDate = a.timestamp ? new Date(a.timestamp) : new Date(0);
      const bDate = b.timestamp ? new Date(b.timestamp) : new Date(0);
      
      const aValid = !isNaN(aDate.getTime());
      const bValid = !isNaN(bDate.getTime());
      
      if (!aValid && !bValid) return 0;
      if (!aValid) return 1;
      if (!bValid) return -1;
      
      return bDate.getTime() - aDate.getTime();
    });
  };

  const renderContent = () => {
    // Get grouped display items like SiteDetailScreen
    const attendanceDisplayItems = getAttendanceGroupDisplayItems();
    
    if (isLoading && attendanceDisplayItems.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (attendanceDisplayItems.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.noDataText}>
            No {activeTab === 0 ? "today's" : activeTab === 1 ? "this month's" : "last month's"} records found
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.attendanceContainer}>
        {/* Render records in a 3-column grid manually */}
        {Array.from({ length: Math.ceil(attendanceDisplayItems.length / 3) }, (_, rowIndex) => {
          const rowItems = attendanceDisplayItems.slice(rowIndex * 3, (rowIndex + 1) * 3);
          return (
            <View key={`user-attendance-row-${activeTab}-${rowIndex}`} style={styles.row}>
              {rowItems.map((item, columnIndex) => (
                <View key={`user-attendance-item-${item.id}-${columnIndex}`} style={styles.gridItemContainer}>
                  {renderAttendanceGroupItem(item)}
                </View>
              ))}
              {/* Fill empty spaces if row has less than 3 items */}
              {Array.from({ length: 3 - rowItems.length }, (_, emptyIndex) => (
                <View key={`user-attendance-empty-${activeTab}-${rowIndex}-${emptyIndex}`} style={styles.gridItemContainer} />
              ))}
            </View>
          );
        })}
        
        {isLoading && attendanceDisplayItems.length > 0 && (
          <View style={styles.loadingMore}>
            <Text style={styles.loadingText}>Loading more...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}  edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {!selectedUser ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading user details...</Text>
        </View>
      ) : (
      <>
      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          const isCloseToBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
          
          if (isCloseToBottom && canLoadMore() && !isLoading) {
            handleLoadMore();
          }
        }}
      >
        <View style={styles.userInfoCard}>
        <View style={styles.userHeader}>
          <View style={styles.userIconContainer}>
            <UserIcon size={40} color={COLORS.PRIMARY} />
          </View>
          <View style={styles.userHeaderText}>
            <Text style={styles.userName}>{selectedUser?.name || 'User Name'}</Text>
            <View style={styles.userDetailsContainer}>
              <Text style={styles.siteCountText}>
                Sites: {selectedUser?.sites ? selectedUser.sites.length : 0}
              </Text>
              
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['Today\'s', 'This Month', 'Last Month'].map((tab, index) => (
          <TouchableOpacity
            key={`user-detail-tab-${index}-${tab.replace(/\s/g, '')}`}
            style={[styles.tab, activeTab === index && styles.activeTab]}
            onPress={() => handleTabChange(index)}
          >
            <Text style={[styles.tabText, activeTab === index && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

        {renderContent()}
      </ScrollView>

      {!isAttendanceDisabled && (
        <View style={styles.buttonContainer}>
          <Button
            title={isProcessingAttendanceImage ? "Processing Image..." : "Mark Attendance"}
            onPress={showAttendanceImagePicker}
            disabled={isMarkingAttendance || isProcessingAttendanceImage}
          />
        </View>
      )}
      <ImagePickerModal
        visible={isAttendancePickerVisible}
        onClose={() => setIsAttendancePickerVisible(false)}
        onCamera={openAttendanceCamera}
        onGallery={openAttendanceGallery}
        title="Add Attendance Photo"
      />

      <LocationSubmissionModal
        visible={isAttendanceModalVisible}
        onCancel={() => {
          setIsAttendanceModalVisible(false);
          setCapturedAttendanceImage(null);
          setAttendanceLocation(null);
        }}
        onSubmit={handleAttendanceSubmit}
        imageUri={capturedAttendanceImage}
        latitude={attendanceLocation?.latitude || 0}
        longitude={attendanceLocation?.longitude || 0}
        timestamp={attendanceLocation?.timestamp || ''}
        title="Mark Attendance"
      />

      <Modal
        visible={isPreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePhotoPreview}
      >
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closePhotoPreview}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            {selectedImages.length > 1 && (
              <Text style={styles.imageCounter}>
                {currentImageIndex + 1} of {selectedImages.length}
              </Text>
            )}
          </View>

          <View style={styles.imageContainer}>
            {selectedImages.length > 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={() => navigateImage('prev')}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <ChevronLeftIcon size={30} color="white" />
              </TouchableOpacity>
            )}

            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}

            {selectedImages.length > 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={() => navigateImage('next')}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <ChevronRightIcon size={30} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
      </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor: 'red',
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mainScrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.PRIMARY, // Green header like in screenshot
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white', // White text on green header
    flex: 1,
  },
  userInfoCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 12, // reduce vertical padding
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIconContainer: {
    marginRight: 16,
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 25,
  },
  userHeaderText: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  userDetailsContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  siteCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  statusContainer: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    marginTop: 0, // remove any top margin
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  attendanceGroupContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...SHADOWS.LIGHT,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridImageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  imageTypeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  imageTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  imageCountOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  imageCounter: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 10,
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  previewImage: {
    width: '90%',
    height: '80%',
  },
  attendanceItem: {
    width: imageSize,
    alignItems: 'center',
    marginBottom: 20,
  },
  attendanceImage: {
    width: imageSize,
    height: imageSize,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  imageCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  attendanceTime: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    width: imageSize,
  },
  recordType: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  attendanceContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flex: 1,
    minHeight: 400,
    alignItems: 'center', // Center the entire grid container
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  gridItemContainer: {
    width: imageSize,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8, // Increased spacing between items
  },
});

export default withLoader(UserDetailScreen);
