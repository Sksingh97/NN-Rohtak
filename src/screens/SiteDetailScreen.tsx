import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActionSheetIOS,
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
  PhotoIcon,
  MapPinIcon,
  CameraIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'react-native-heroicons/outline';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RootState, AppDispatch } from '../store';
import { AttendanceRecord, TaskImageRecord, GroupedTaskImages, TaskGroupDisplayItem } from '../types';
import {
  fetchTodayAttendance,
  fetchMonthAttendance,
  fetchTodayTasks,
  fetchMonthTasks,
  fetchAttendanceBySite,
  fetchTaskImagesBySite,
  markAttendance,
  submitTaskReport,
} from '../store/slices/attendanceSlice';
import { withLoader } from '../components/Loader';
import Button from '../components/Button';
import LocationSubmissionModal from '../components/LocationSubmissionModal';
import MultiImageLocationSubmissionModal from '../components/MultiImageLocationSubmissionModal';
import { requestCameraPermission, requestLocationPermission, formatDateTime, formatDateForGrouping, getCurrentMonthRange, getLastMonthRange } from '../utils/helpers';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { STRINGS, API_MESSAGES } from '../constants/strings';

type SiteDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SiteDetail'>;
type SiteDetailScreenRouteProp = RouteProp<RootStackParamList, 'SiteDetail'>;

interface SiteDetailScreenProps {
  navigation: SiteDetailScreenNavigationProp;
  route: SiteDetailScreenRouteProp;
}

const { width } = Dimensions.get('window');
const imageSize = (width - 48) / 3;

const SiteDetailScreen: React.FC<SiteDetailScreenProps> = ({ route, navigation }) => {
  const [activeTab, setActiveTab] = useState(0); // 0 for This Month, 1 for Last Month
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
  
  // Task report modal states
  const [isTaskReportModalVisible, setIsTaskReportModalVisible] = useState(false);
  const [capturedTaskImages, setCapturedTaskImages] = useState<string[]>([]);
  const [taskLocation, setTaskLocation] = useState<{
    latitude: number;
    longitude: number;
    timestamp: string;
  } | null>(null);
  
  const dispatch = useDispatch<AppDispatch>();
  
  const { site } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);
  const { 
    attendanceRecords,
    taskImages,
    groupedTaskImages,
    todayAttendance, 
    monthAttendance, 
    todayTasks = [], 
    monthTasks = [],
    isLoading,
    isMarkingAttendance,
    isSubmittingTask = false
  } = useSelector((state: RootState) => state.attendance);

  // Function to fetch attendance for specific date range
  const fetchAttendanceForTab = (tabIndex: number) => {
    if (tabIndex === 0) {
      // This Month
      const { startDate, endDate } = getCurrentMonthRange();
      console.log('Fetching This Month attendance:', { startDate, endDate });
      dispatch(fetchAttendanceBySite({ siteId: site.id, startDate, endDate }));
      dispatch(fetchTaskImagesBySite({ siteId: site.id, startDate, endDate }));
    } else {
      // Last Month
      const { startDate, endDate } = getLastMonthRange();
      console.log('Fetching Last Month attendance:', { startDate, endDate });
      dispatch(fetchAttendanceBySite({ siteId: site.id, startDate, endDate }));
      dispatch(fetchTaskImagesBySite({ siteId: site.id, startDate, endDate }));
    }
  };

  useEffect(() => {
    // Fetch attendance records for the current tab (default to current month)
    fetchAttendanceForTab(activeTab);
    
    // Keep existing user-based fetching for tasks if needed
    if (user?.id) {
      // dispatch(fetchTodayTasks(user.id)); // This Month tasks
      // dispatch(fetchMonthTasks(user.id)); // Last Month tasks
    }
  }, [dispatch, site.id, user?.id]);

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

  const showAttendanceImagePicker = () => {
    const options = [STRINGS.TAKE_PHOTO, STRINGS.CHOOSE_FROM_GALLERY, STRINGS.CANCEL];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
          title: 'Select Attendance Photo',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            openAttendanceCamera();
          } else if (buttonIndex === 1) {
            openAttendanceGallery();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Attendance Photo',
        '',
        [
          { text: STRINGS.TAKE_PHOTO, onPress: openAttendanceCamera },
          { text: STRINGS.CHOOSE_FROM_GALLERY, onPress: openAttendanceGallery },
          { text: STRINGS.CANCEL, style: 'cancel' },
        ]
      );
    }
  };

  const showTaskImagePicker = () => {
    const options = [STRINGS.TAKE_PHOTO, 'Select Multiple Photos', STRINGS.CANCEL];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
          title: 'Add Task Photos',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            openTaskCamera();
          } else if (buttonIndex === 1) {
            openTaskGalleryMultiple();
          }
        }
      );
    } else {
      Alert.alert(
        'Add Task Photos',
        '',
        [
          { text: STRINGS.TAKE_PHOTO, onPress: openTaskCamera },
          { text: 'Select Multiple Photos', onPress: openTaskGalleryMultiple },
          { text: STRINGS.CANCEL, style: 'cancel' },
        ]
      );
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

  const openTaskCamera = async () => {
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
      handleTaskImageResponse
    );
  };

  const openTaskGalleryMultiple = () => {
    launchImageLibrary(
      {
        mediaType: 'photo' as MediaType,
        quality: 0.8,
        includeBase64: false,
        selectionLimit: 10, // Allow up to 10 images
      },
      handleTaskMultipleImageResponse
    );
  };

  const handleAttendanceImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage || !response.assets?.[0]) {
      return;
    }

    const imageUri = response.assets[0].uri!;
    console.log('Attendance image selected:', imageUri);
    
    // Get current location
    try {
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
    }
  };

  const handleTaskImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage || !response.assets?.[0]) {
      return;
    }

    const imageUri = response.assets[0].uri!;
    
    let currentTaskLocation = taskLocation;
    
    // Get location for task images if not already captured
    if (!currentTaskLocation) {
      try {
        const hasLocationPermission = await requestLocationPermission();
        if (!hasLocationPermission) {
          showErrorToast('Location permission is required to add location overlay');
          return;
        }

        const location = await getCurrentLocation();
        const timestamp = new Date().toISOString();
        
        currentTaskLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp,
        };
        
        setTaskLocation(currentTaskLocation);
      } catch (error) {
        showErrorToast('Failed to get location. Please try again.');
        console.error('Location error:', error);
        return;
      }
    }
    
    // Append to existing images if any, otherwise create new array
    const newImages = [...capturedTaskImages, imageUri];
    setCapturedTaskImages(newImages);
    setIsTaskReportModalVisible(true);
  };

  const handleTaskMultipleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage || !response.assets) {
      return;
    }

    let currentTaskLocation = taskLocation;

    // Get location for task images if not already captured
    if (!currentTaskLocation) {
      try {
        const hasLocationPermission = await requestLocationPermission();
        if (!hasLocationPermission) {
          showErrorToast('Location permission is required to add location overlay');
          return;
        }

        const location = await getCurrentLocation();
        const timestamp = new Date().toISOString();
        
        currentTaskLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp,
        };
        
        setTaskLocation(currentTaskLocation);
      } catch (error) {
        showErrorToast('Failed to get location. Please try again.');
        console.error('Location error:', error);
        return;
      }
    }

    const newImageUris = response.assets.map(asset => asset.uri!);
    
    // Append to existing images if any, otherwise use new images
    const allImages = [...capturedTaskImages, ...newImageUris];
    setCapturedTaskImages(allImages);
    setIsTaskReportModalVisible(true);
  };

  const submitAttendance = (imageWithOverlay: string) => {
    console.log('Submitting attendance with image:', imageWithOverlay);
    if (!imageWithOverlay || !attendanceLocation) {
      console.log('Missing data for attendance submission:', { imageWithOverlay, attendanceLocation });
      return;
    }

    dispatch(markAttendance({
      siteId: site.id,
      imageUri: imageWithOverlay,
      latitude: attendanceLocation.latitude,
      longitude: attendanceLocation.longitude,
      description: site.address, // Use site address as description
    })).then(() => {
      // Refresh attendance data after successful submission
      fetchAttendanceForTab(activeTab);
    });
    
    setIsAttendanceModalVisible(false);
    setCapturedAttendanceImage(null);
    setAttendanceLocation(null);
    showSuccessToast(API_MESSAGES.ATTENDANCE_MARKED);
    console.log('Attendance submitted successfully');
  };

  const handleTaskReportSubmit = (processedImageUris: string[]) => {
    console.log('Submitting task report with images:', processedImageUris);
    if (!processedImageUris.length || !taskLocation) {
      console.log('Missing data for task report submission:', { processedImageUris: processedImageUris.length, taskLocation });
      return;
    }

    // Use existing submitTaskReport action
    dispatch(submitTaskReport({
      siteId: site.id,
      imageUris: processedImageUris,
      latitude: taskLocation.latitude,
      longitude: taskLocation.longitude,
      description: site.address, // Use site address as description
    })).then(() => {
      // Refresh task images data after successful submission
      fetchAttendanceForTab(activeTab);
    });
    
    setIsTaskReportModalVisible(false);
    setCapturedTaskImages([]);
    setTaskLocation(null);
    showSuccessToast(`Task report submitted successfully with ${processedImageUris.length} image(s).`);
    console.log('Task report submitted successfully');
  };

  const handleAddMoreTaskImages = () => {
    // Close the modal first
    setIsTaskReportModalVisible(false);
    
    // Show the image picker again
    showTaskImagePicker();
  };

  const handleRemoveTaskImage = (index: number) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedImages = capturedTaskImages.filter((_, i) => i !== index);
            setCapturedTaskImages(updatedImages);
            
            // If no images left, close the modal
            if (updatedImages.length === 0) {
              setIsTaskReportModalVisible(false);
              setTaskLocation(null);
            }
          },
        },
      ]
    );
  };

  // Helper function to process multiple images with location overlay
  const openPhotoPreview = (imageUrl: string, allImages?: string[]) => {
    if (allImages && allImages.length > 1) {
      setSelectedImages(allImages);
      setCurrentImageIndex(allImages.indexOf(imageUrl));
    } else {
      setSelectedImage(imageUrl);
      setSelectedImages([]);
    }
    setIsPreviewVisible(true);
  };

  const closePhotoPreview = () => {
    setIsPreviewVisible(false);
    setSelectedImage(null);
    setSelectedImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length);
    }
  };

  const prevImage = () => {
    if (selectedImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length);
    }
  };

  const renderAttendanceItem = ({ item }: { item: AttendanceRecord }) => {
    const displayImage = item.image_url;
    const allImages = [item.image_url];
    
    // Use check_in_time for new format, fallback to timestamp for compatibility
    const displayTime = item.check_in_time || item.timestamp;

    return (
      <View style={styles.attendanceItem}>
        <TouchableOpacity onPress={() => openPhotoPreview(displayImage, allImages)}>
          <Image source={{ uri: displayImage }} style={styles.attendanceImage} />
        </TouchableOpacity>
        <Text style={styles.attendanceTime}>
          {formatDateTime(displayTime)}
        </Text>
        <Text style={styles.recordType}>
          Attendance
        </Text>
      </View>
    );
  };

  // Convert grouped task images to display items for grid
  const getTaskGroupDisplayItems = (): TaskGroupDisplayItem[] => {
    return Object.keys(groupedTaskImages).map(date => {
      const images = groupedTaskImages[date];
      // Create a new array and sort with timestamp validation
      const sortedImages = [...images].sort((a, b) => {
        const aDate = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const bDate = b.timestamp ? new Date(b.timestamp) : new Date(0);
        
        const aValid = !isNaN(aDate.getTime());
        const bValid = !isNaN(bDate.getTime());
        
        if (!aValid && !bValid) return 0;
        if (!aValid) return 1;
        if (!bValid) return -1;
        
        return bDate.getTime() - aDate.getTime();
      });
      
      return {
        id: `task-group-${date}`,
        date,
        images: sortedImages,
        displayImage: sortedImages[0]?.image_url || '',
        imageCount: sortedImages.length,
        timestamp: sortedImages[0]?.timestamp || date, // Use latest timestamp or fallback to date
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

  const renderTaskGroupItem = ({ item }: { item: TaskGroupDisplayItem }) => {
    const allImageUrls = item.images.map(img => img.image_url);
    
    return (
      <View style={styles.attendanceItem}>
        <TouchableOpacity onPress={() => openPhotoPreview(item.displayImage, allImageUrls)}>
          <Image source={{ uri: item.displayImage }} style={styles.attendanceImage} />
          {item.imageCount > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>{item.imageCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.attendanceTime}>
          {formatDateTime(item.timestamp)}
        </Text>
        <Text style={styles.recordType}>
          Task Report
        </Text>
      </View>
    );
  };

  // Use attendance records from API (already filtered by date) and combine with task groups
  const taskGroupDisplayItems = getTaskGroupDisplayItems();
  const currentAttendance = activeTab === 0 
    ? [...attendanceRecords, ...todayTasks]
    : [...attendanceRecords, ...monthTasks];

  // Combine attendance records and task groups for unified display
  const allRecords = [
    ...currentAttendance,
    ...taskGroupDisplayItems
  ];

  // Sort by timestamp (newest first) - use check_in_time for attendance, timestamp for task groups
  // Create a new array to avoid mutating read-only Redux state
  const sortedRecords = [...allRecords].sort((a, b) => {
    const aTime = 'check_in_time' in a ? (a.check_in_time || a.timestamp) : a.timestamp;
    const bTime = 'check_in_time' in b ? (b.check_in_time || b.timestamp) : b.timestamp;
    
    // Handle cases where timestamps might be missing or invalid
    const aDate = aTime ? new Date(aTime) : new Date(0);
    const bDate = bTime ? new Date(bTime) : new Date(0);
    
    // Check for invalid dates and fallback to epoch if needed
    const aValid = !isNaN(aDate.getTime());
    const bValid = !isNaN(bDate.getTime());
    
    if (!aValid && !bValid) return 0;
    if (!aValid) return 1; // Put invalid dates at the end
    if (!bValid) return -1; // Put invalid dates at the end
    
    return bDate.getTime() - aDate.getTime();
  });

  const renderRecord = ({ item }: { item: AttendanceRecord | TaskGroupDisplayItem }) => {
    // Check if it's a task group item
    if ('images' in item) {
      return renderTaskGroupItem({ item });
    } else {
      return renderAttendanceItem({ item });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Site Info */}
        <View style={styles.siteInfoCard}>
          <View style={styles.siteHeader}>
            <Image 
              source={require('../assets/siteIcon.png')} 
              style={styles.siteIcon}
              resizeMode="contain"
            />
            <View style={styles.siteHeaderText}>
              <Text style={styles.siteName}>{site.name}</Text>
              <View style={styles.addressContainer}>
                <MapPinIcon size={16} color={COLORS.PRIMARY} />
                <Text style={styles.siteAddress}>{site.address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title={STRINGS.MARK_ATTENDANCE}
            onPress={showAttendanceImagePicker}
            loading={isMarkingAttendance}
            style={styles.halfWidthButton}
          />
          
          <Button
            title="Add Task Report"
            onPress={showTaskImagePicker}
            loading={isSubmittingTask}
            style={styles.taskReportButtonRight}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 0 && styles.activeTab]}
            onPress={() => {
              setActiveTab(0);
              fetchAttendanceForTab(0);
            }}>
            <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 1 && styles.activeTab]}
            onPress={() => {
              setActiveTab(1);
              fetchAttendanceForTab(1);
            }}>
            <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
              Last Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Records List - Combined Attendance and Task Images */}
        <View style={styles.attendanceContainer}>
          {sortedRecords.length > 0 ? (
            <FlatList
              data={sortedRecords as any[]} // Cast to any[] to handle union type
              renderItem={renderRecord}
              keyExtractor={(item) => ('images' in item ? item.id : `attendance-${item.id}`)}
              numColumns={3}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              columnWrapperStyle={styles.row}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <CameraIcon size={64} color={COLORS.GRAY_MEDIUM} />
              <Text style={styles.emptyText}>
                No records for {activeTab === 0 ? 'this month' : 'last month'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Attendance Submission Modal */}
      <LocationSubmissionModal
        visible={isAttendanceModalVisible}
        imageUri={capturedAttendanceImage}
        latitude={attendanceLocation?.latitude || 0}
        longitude={attendanceLocation?.longitude || 0}
        timestamp={attendanceLocation?.timestamp || new Date().toISOString()}
        title="Mark Attendance"
        onSubmit={submitAttendance}
        onCancel={() => {
          setIsAttendanceModalVisible(false);
          setCapturedAttendanceImage(null);
          setAttendanceLocation(null);
        }}
      />

      {/* Task Report Submission Modal */}
      <MultiImageLocationSubmissionModal
        visible={isTaskReportModalVisible}
        imageUris={capturedTaskImages}
        latitude={taskLocation?.latitude || 0}
        longitude={taskLocation?.longitude || 0}
        timestamp={taskLocation?.timestamp || new Date().toISOString()}
        title="Submit Task Report"
        onSubmit={handleTaskReportSubmit}
        onAddMore={handleAddMoreTaskImages}
        onRemoveImage={handleRemoveTaskImage}
        onCancel={() => {
          setIsTaskReportModalVisible(false);
          setCapturedTaskImages([]);
          setTaskLocation(null);
        }}
      />

      {/* Photo Preview Modal */}
      <Modal
        visible={isPreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePhotoPreview}>
        <View style={styles.modalContainer}>
          <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
          
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={closePhotoPreview}>
            <ArrowLeftIcon size={24} color={COLORS.WHITE} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          {/* Image Display */}
          {selectedImages.length > 0 ? (
            <>
              {/* Multiple Images with Slider */}
              <Image
                source={{ uri: selectedImages[currentImageIndex] }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              
              {/* Navigation Arrows */}
              {selectedImages.length > 1 && (
                <>
                  <TouchableOpacity style={styles.leftArrow} onPress={prevImage}>
                    <ChevronLeftIcon size={40} color={COLORS.WHITE} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.rightArrow} onPress={nextImage}>
                    <ChevronRightIcon size={40} color={COLORS.WHITE} />
                  </TouchableOpacity>
                  
                  {/* Image Indicator */}
                  <View style={styles.imageIndicator}>
                    {selectedImages.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.indicatorDot,
                          index === currentImageIndex && styles.activeIndicatorDot
                        ]}
                      />
                    ))}
                  </View>
                </>
              )}
            </>
          ) : (
            /* Single Image */
            selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  siteInfoCard: {
    backgroundColor: COLORS.WHITE,
    margin: SIZES.MARGIN_MEDIUM,
    padding: SIZES.PADDING_SMALL,
    borderRadius: SIZES.BORDER_RADIUS_LARGE,
    ...SHADOWS.MEDIUM,
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.MARGIN_MEDIUM,
  },
  siteIcon: {
    width: 48,
    height: 48,
    marginRight: SIZES.MARGIN_MEDIUM,
  },
  siteHeaderText: {
    flex: 1,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.MARGIN_SMALL,
  },
  siteName: {
    fontSize: SIZES.FONT_SIZE_TITLE,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  siteAddress: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
    marginLeft: SIZES.MARGIN_SMALL,
    flex: 1,
  },
  markAttendanceButton: {
    marginHorizontal: SIZES.MARGIN_MEDIUM,
    marginBottom: SIZES.MARGIN_LARGE,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: SIZES.MARGIN_MEDIUM,
    marginBottom: SIZES.MARGIN_LARGE,
    gap: SIZES.MARGIN_SMALL,
  },
  halfWidthButton: {
    flex: 1,
  },
  taskReportButton: {
    backgroundColor: COLORS.SECONDARY || '#FF6B35',
  },
  taskReportButtonRight: {
    flex: 1,
    backgroundColor: COLORS.SECONDARY || '#FF6B35',
  },
  multiImageIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
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
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  recordType: {
    fontSize: SIZES.FONT_SIZE_SMALL - 1,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SIZES.MARGIN_MEDIUM,
    marginBottom: SIZES.MARGIN_LARGE,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    padding: 4,
    ...SHADOWS.LIGHT,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.PADDING_MEDIUM,
    alignItems: 'center',
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM - 2,
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT_SECONDARY,
  },
  activeTabText: {
    color: COLORS.WHITE,
  },
  attendanceContainer: {
    paddingHorizontal: SIZES.PADDING_MEDIUM,
    paddingBottom: SIZES.PADDING_LARGE,
  },
  row: {
    justifyContent: 'space-between',
  },
  attendanceItem: {
    width: imageSize,
    marginBottom: SIZES.MARGIN_MEDIUM,
  },
  attendanceImage: {
    width: imageSize,
    height: imageSize,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  attendanceTime: {
    fontSize: SIZES.FONT_SIZE_SMALL,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SIZES.MARGIN_SMALL,
  },
  separator: {
    height: SIZES.MARGIN_MEDIUM,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING_EXTRA_LARGE * 2,
  },
  emptyText: {
    fontSize: SIZES.FONT_SIZE_LARGE,
    color: COLORS.GRAY_MEDIUM,
    textAlign: 'center',
    marginTop: SIZES.MARGIN_LARGE,
  },
  // Photo Preview Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    marginLeft: 8,
    fontWeight: '500',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  // Submission Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  submissionModal: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS_LARGE,
    padding: SIZES.PADDING_LARGE,
    width: '100%',
    maxWidth: 450, // Increased to accommodate larger images
    maxHeight: '85%', // Increased to provide more space
  },
  modalTitle: {
    fontSize: SIZES.FONT_SIZE_TITLE,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SIZES.MARGIN_LARGE,
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    marginBottom: SIZES.MARGIN_MEDIUM,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  imageNameText: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SIZES.MARGIN_LARGE,
  },
  taskImagesContainer: {
    maxHeight: 200, // Increased to allow proper aspect ratios
    marginBottom: SIZES.MARGIN_MEDIUM,
  },
  taskImageContainer: {
    height: 120,
    aspectRatio: 4/3, // Default aspect ratio for images without overlay
    borderRadius: SIZES.BORDER_RADIUS_SMALL,
    overflow: 'hidden',
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  taskImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  taskImageWrapper: {
    marginRight: SIZES.MARGIN_SMALL,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING_MEDIUM,
    paddingHorizontal: SIZES.PADDING_LARGE,
    borderRadius: SIZES.BORDER_RADIUS_MEDIUM,
    alignItems: 'center',
    minWidth: '30%',
  },
  cancelButton: {
    backgroundColor: COLORS.GRAY_MEDIUM,
  },
  cancelButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '500',
  },
  addMoreButton: {
    backgroundColor: COLORS.SECONDARY || '#FF6B35',
  },
  addMoreButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: '500',
  },
  // Photo Preview Slider Styles
  leftArrow: {
    position: 'absolute',
    left: 20,
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 5,
  },
  rightArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 5,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicatorDot: {
    backgroundColor: COLORS.WHITE,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskGroupContainer: {
    marginBottom: SIZES.MARGIN_LARGE,
  },
  taskGroupDate: {
    fontSize: SIZES.FONT_SIZE_MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_MEDIUM,
  },
  sectionContainer: {
    marginBottom: SIZES.MARGIN_LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT_SIZE_LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SIZES.MARGIN_MEDIUM,
    paddingHorizontal: SIZES.PADDING_MEDIUM,
  },
});

export default withLoader(SiteDetailScreen);
