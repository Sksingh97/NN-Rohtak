import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, API_ENDPOINTS } from '../constants/api';
import { AttendanceRecord, TaskImageRecord } from '../types';
import { showErrorToast } from '../utils/toast';

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  role: string;
  name: string;
  email?: string; // Keep for backward compatibility
  mobile?: string; // New mobile field
}

// Request configuration
export interface RequestConfig {
  endpoint: string;
  method?: HttpMethod;
  data?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

class ApiService {
  private baseURL: string;
  private timeout: number;
  private onUnauthorized?: () => void;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Set callback function to handle 401/403 unauthorized/forbidden responses
  public setUnauthorizedHandler(callback: () => void): void {
    this.onUnauthorized = callback;
  }

  // Handle 401/403 unauthorized/forbidden response
  private async handleUnauthorized(): Promise<void> {
    console.warn('🚨 UNAUTHORIZED/FORBIDDEN ACCESS - LOGGING OUT USER:', {
      timestamp: new Date().toISOString(),
    });

    try {
      // Clear stored auth data
      await this.clearAuthData();
      
      // Call the callback to redirect to login screen
      if (this.onUnauthorized) {
        this.onUnauthorized();
      }
    } catch (error) {
      console.error('💥 ERROR HANDLING UNAUTHORIZED:', error);
    }
  }

  // Get stored access token
  private async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  // Store tokens and user data
  public async storeAuthData(loginResponse: LoginResponse): Promise<void> {
    try {
      const userRole = loginResponse.role?.toLowerCase();
      const userData = {
        id: loginResponse.user_id,
        name: loginResponse.name,
        mobile: loginResponse.mobile || loginResponse.email || '',
        role: userRole === 'supervisor' ? 2 : 1,
      };

      // 📝 LOG STORAGE
      console.warn('💾 STORING AUTH DATA:', JSON.stringify({
        user_id: loginResponse.user_id,
        role: userRole,
        mobile: userData.mobile,
        timestamp: new Date().toISOString(),
      }, null, 2));

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, loginResponse.access_token],
        [STORAGE_KEYS.REFRESH_TOKEN, loginResponse.refresh_token],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
      ]);

      console.warn('✅ AUTH DATA STORED SUCCESSFULLY');
    } catch (error) {
      console.error('💥 ERROR STORING AUTH DATA:', error);
      throw error;
    }
  }

  // Get stored user data
  public async getStoredUserData(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const result = userData ? JSON.parse(userData) : null;
      
      // 📝 LOG STORAGE RETRIEVAL
      if (result) {
        console.warn('📱 LOADED USER DATA FROM STORAGE:', JSON.stringify({
          id: result.id,
          mobile: result.mobile,
          role: result.role,
          timestamp: new Date().toISOString(),
        }, null, 2));
      } else {
        console.warn('📱 NO USER DATA FOUND IN STORAGE');
      }
      
      return result;
    } catch (error) {
      console.error('💥 ERROR GETTING STORED USER DATA:', error);
      return null;
    }
  }

  // Clear stored auth data
  public async clearAuthData(): Promise<void> {
    try {
      // 📝 LOG AUTH CLEAR
      console.warn('🗑️ CLEARING AUTH DATA:', JSON.stringify({
        timestamp: new Date().toISOString(),
      }, null, 2));

      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);

      console.warn('✅ AUTH DATA CLEARED SUCCESSFULLY');
    } catch (error) {
      console.error('💥 ERROR CLEARING AUTH DATA:', error);
      throw error;
    }
  }

  // Generate headers
  private async generateHeaders(customHeaders?: Record<string, string>, requiresAuth = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': 'true', // Skip ngrok warning in headers
      'User-Agent': 'app/1.0', 
      ...customHeaders,
    };

    if (requiresAuth) {
      const accessToken = await this.getAccessToken();
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return headers;
  }

  // Main request method
  private async makeRequest<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { endpoint, method = 'GET', data, headers: customHeaders, requiresAuth = true } = config;
    
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.generateHeaders(customHeaders, requiresAuth);

      const requestConfig: RequestInit = {
        method,
        headers,
      };

      // Add body for non-GET requests
      if (method !== 'GET' && data) {
        requestConfig.body = JSON.stringify(data);
      }

      // 📝 LOG REQUEST
      console.warn('🚀 API REQUEST:', JSON.stringify({
        method,
        url,
        headers: {
          ...headers,
          Authorization: headers.Authorization ? 'Bearer ***' : undefined, // Hide token in logs
        },
        body: method !== 'GET' && data ? data : undefined,
        timestamp: new Date().toISOString(),
      }, null, 2));

      // Also use console.log for debugging
      console.log('\n=== API REQUEST START ===');
      console.log('Method:', method);
      console.log('URL:', url);
      console.log('Has Auth Token:', !!headers.Authorization);
      console.log('=== API REQUEST END ===\n');

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const requestStartTime = Date.now();
        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const requestDuration = Date.now() - requestStartTime;

        // Parse response
        let responseData: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        // 📝 LOG RESPONSE
        if (response.ok) {
          console.warn('✅ API RESPONSE SUCCESS:', JSON.stringify({
            method,
            url,
            status: response.status,
            statusText: response.statusText,
            duration: `${requestDuration}ms`,
            contentType,
            data: responseData,
            timestamp: new Date().toISOString(),
          }, null, 2));
        } else {
          console.error('❌ API RESPONSE ERROR:', JSON.stringify({
            method,
            url,
            status: response.status,
            statusText: response.statusText,
            duration: `${requestDuration}ms`,
            contentType,
            error: responseData?.message || responseData,
            fullResponse: responseData,
            timestamp: new Date().toISOString(),
          }, null, 2));
        }

        // Handle 401 Unauthorized or 403 Forbidden - logout user and redirect to login
        if (response.status === 401 || response.status === 403) {
          console.warn('🚨 401/403 UNAUTHORIZED/FORBIDDEN RESPONSE - INITIATING LOGOUT');
          
          // Show toast notification
          showErrorToast(
            'Your session has expired or access is forbidden. You will be logged out.',
            'Authentication Error'
          );
          
          // Don't await this to avoid blocking the response
          this.handleUnauthorized().catch(error => {
            console.error('Error handling unauthorized/forbidden:', error);
          });
          
          return {
            error: responseData?.message || responseData,
            success: false,
          };
        }

        if (!response.ok) {
          return {
            error: responseData?.message || responseData || `HTTP ${response.status}: ${response.statusText}`,
            success: false,
          };
        }

        return {
          data: responseData,
          success: true,
        };

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // 📝 LOG FETCH ERROR
        console.error('🔥 API REQUEST FAILED:', JSON.stringify({
          method,
          url,
          error: fetchError.message,
          errorType: fetchError.name,
          timestamp: new Date().toISOString(),
        }, null, 2));
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw fetchError;
      }

    } catch (error: any) {
      // 📝 LOG GENERAL ERROR
      console.error('💥 API REQUEST ERROR:', {
        method,
        endpoint,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      
      return {
        error: error.message || 'Network request failed',
        success: false,
      };
    }
  }

  // HTTP Methods
  public async get<T = any>(endpoint: string, headers?: Record<string, string>, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ endpoint, method: 'GET', headers, requiresAuth });
  }

  public async post<T = any>(endpoint: string, data?: any, headers?: Record<string, string>, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ endpoint, method: 'POST', data, headers, requiresAuth });
  }

  public async put<T = any>(endpoint: string, data?: any, headers?: Record<string, string>, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ endpoint, method: 'PUT', data, headers, requiresAuth });
  }

  public async patch<T = any>(endpoint: string, data?: any, headers?: Record<string, string>, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ endpoint, method: 'PATCH', data, headers, requiresAuth });
  }

  public async delete<T = any>(endpoint: string, headers?: Record<string, string>, requiresAuth = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ endpoint, method: 'DELETE', headers, requiresAuth });
  }

  // Login method
  public async login(mobile: string, password: string): Promise<ApiResponse<LoginResponse>> {
    // 📝 LOG LOGIN ATTEMPT
    console.warn('🔐 LOGIN REQUEST:', JSON.stringify({
      mobile,
      password: '***' // Hide password in logs
    }, null, 2));

    const response = await this.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      { mobile, password }, // Send mobile field in payload
      undefined,
      false // Login doesn't require auth
    );

    if (response.success && response.data) {
      // Validate role before storing auth data
      if (!response.data.role) {
        console.warn('❌ LOGIN ROLE ERROR: Role not found in response');
        return {
          error: 'User role not found. Please contact administrator.',
          success: false,
        };
      }

      const userRole = response.data.role.toLowerCase();
      if (userRole !== 'worker' && userRole !== 'supervisor') {
        console.warn('❌ LOGIN ROLE ERROR: Unauthorized role:', userRole);
        return {
          error: 'You are not authorized to access this app. Only workers and supervisors are allowed.',
          success: false,
        };
      }

      // Only store auth data if role is valid
      console.warn('✅ LOGIN SUCCESS: Storing auth data for role:', userRole);
      await this.storeAuthData(response.data);
    }

    return response;
  }

  // Logout method
  public async logout(): Promise<void> {
    try {
      // Call logout endpoint if needed
      await this.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      await this.clearAuthData();
    }
  }

  // Sites methods
  public async getAllSites(): Promise<ApiResponse<any[]>> {
    return this.get(API_ENDPOINTS.SITES.LIST);
  }

  public async getMySites(): Promise<ApiResponse<any[]>> {
    return this.get(API_ENDPOINTS.SITES.MY_SITES);
  }

  // Legacy method for backward compatibility
  public async getSites(): Promise<ApiResponse<any[]>> {
    return this.get(API_ENDPOINTS.SITES.LIST);
  }

  // Get app allowed roles method (requires authentication)
  public async getAppAllowedRoles(): Promise<ApiResponse<string[]>> {
    return this.get(API_ENDPOINTS.USER.APP_ALLOWED_ROLES, {}, true); // Auth required
  }

  // Mark attendance method
  public async markAttendance(
    site_id: string,
    latitude: number,
    longitude: number,
    description: string,
    imageUri: string
  ): Promise<ApiResponse<any>> {
    console.warn('📸 MARK ATTENDANCE CALLED WITH:', JSON.stringify({
      site_id,
      latitude,
      longitude,
      description,
      imageUri,
    }, null, 2));

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // For React Native, the file object needs to be structured properly
      const fileObject = {
        uri: imageUri,
        type: 'image/jpeg', // Use JPEG which is more compatible
        name: `attendance_${Date.now()}.jpg`,
      };
      
      formData.append('file', fileObject as any);

      console.warn('📸 FORM DATA FILE:', JSON.stringify(fileObject, null, 2));

      // Create query params
      const queryParams = new URLSearchParams({
        site_id,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        description,
      });

      const url = `${this.baseURL}${API_ENDPOINTS.ATTENDANCE.MARK}?${queryParams.toString()}`;
      // Don't set Content-Type for FormData - let the browser set it with boundary
      const headers = await this.generateHeaders({}, true);
      // Remove Content-Type for FormData uploads
      delete headers['Content-Type'];

      // 📝 LOG ATTENDANCE REQUEST
      console.warn('📸 MARK ATTENDANCE REQUEST:', JSON.stringify({
        method: 'POST',
        url,
        headers: {
          ...headers,
          Authorization: headers.Authorization ? 'Bearer ***' : undefined, // Hide token in logs
        },
        queryParams: {
          site_id,
          latitude,
          longitude,
          description,
        },
        fileInfo: fileObject,
        timestamp: new Date().toISOString(),
      }, null, 2));

      // Test network connectivity first
      console.warn('🌐 TESTING CONNECTIVITY TO:', this.baseURL);
      try {
        const testResponse = await fetch(`${this.baseURL}${API_ENDPOINTS.SITES.LIST}`, {
          method: 'GET',
          headers: await this.generateHeaders({}, true),
        });
        console.warn('🌐 CONNECTIVITY TEST:', testResponse.ok ? 'SUCCESS' : 'FAILED', testResponse.status);
      } catch (testError: any) {
        console.error('🌐 CONNECTIVITY TEST FAILED:', testError.message);
      }

      // Create abort controller for timeout (longer timeout for file uploads)
      const controller = new AbortController();
      const uploadTimeout = 60000; // 60 seconds for file uploads
      const timeoutId = setTimeout(() => {
        console.error('⏰ UPLOAD TIMEOUT after', uploadTimeout, 'ms');
        controller.abort();
      }, uploadTimeout);

      try {
        const requestStartTime = Date.now();
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const requestDuration = Date.now() - requestStartTime;

        // Parse response
        let responseData: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        // 📝 LOG ATTENDANCE RESPONSE
        if (response.ok) {
          console.warn('✅ MARK ATTENDANCE SUCCESS:', JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            duration: `${requestDuration}ms`,
            contentType,
            data: responseData,
            timestamp: new Date().toISOString(),
          }, null, 2));
        } else {
          console.error('❌ MARK ATTENDANCE ERROR:', JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            duration: `${requestDuration}ms`,
            contentType,
            error: responseData?.message || responseData,
            fullResponse: responseData,
            timestamp: new Date().toISOString(),
          }, null, 2));
        }

        // Handle 401 Unauthorized or 403 Forbidden in attendance marking
        if (response.status === 401 || response.status === 403) {
          console.warn('🚨 401/403 UNAUTHORIZED/FORBIDDEN IN MARK ATTENDANCE - INITIATING LOGOUT');
          
          // Show toast notification
          showErrorToast(
            'Your session has expired or access is forbidden. You will be logged out.',
            'Authentication Error'
          );
          
          this.handleUnauthorized().catch(error => {
            console.error('Error handling unauthorized/forbidden in mark attendance:', error);
          });
          
          return {
            error: 'Session expired or access forbidden. Please login again.',
            success: false,
          };
        }

        if (!response.ok) {
          return {
            error: responseData?.message || responseData || `HTTP ${response.status}: ${response.statusText}`,
            success: false,
          };
        }

        return {
          data: responseData,
          success: true,
        };

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // 📝 LOG ATTENDANCE FETCH ERROR
        console.error('🔥 MARK ATTENDANCE FAILED:', JSON.stringify({
          error: fetchError.message,
          errorType: fetchError.name,
          stack: fetchError.stack,
          url,
          timestamp: new Date().toISOString(),
        }, null, 2));
        
        let errorMessage = 'Network request failed';
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Upload timeout - please check your internet connection and try again';
        } else if (fetchError.message.includes('Network request failed')) {
          errorMessage = 'Cannot connect to server. Please check if your backend server is running and accessible.';
        }
        
        throw new Error(errorMessage);
      }

    } catch (error: any) {
      // 📝 LOG ATTENDANCE GENERAL ERROR
      console.error('💥 MARK ATTENDANCE ERROR:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      
      return {
        error: error.message || 'Failed to mark attendance',
        success: false,
      };
    }
  }

  // Attendance fetching methods
  public async getAttendance(siteId: string, startDate?: string, endDate?: string): Promise<ApiResponse<AttendanceRecord[]>> {
    const queryParams = new URLSearchParams({
      site_id: siteId,
    });
    
    if (startDate) {
      queryParams.append('start_date', startDate);
    }
    
    if (endDate) {
      queryParams.append('end_date', endDate);
    }
    
    return this.get(`${API_ENDPOINTS.ATTENDANCE.LIST}?${queryParams.toString()}`);
  }

  public async getTodayAttendance(userId: string): Promise<ApiResponse<AttendanceRecord[]>> {
    // This method is kept for backward compatibility but not used with new API
    const queryParams = new URLSearchParams({
      user_id: userId,
      period: 'today',
    });
    return this.get(`${API_ENDPOINTS.ATTENDANCE.LIST}?${queryParams.toString()}`);
  }

  public async getMonthAttendance(userId: string): Promise<ApiResponse<AttendanceRecord[]>> {
    // This method is kept for backward compatibility but not used with new API
    const queryParams = new URLSearchParams({
      user_id: userId,
      period: 'month',
    });
    return this.get(`${API_ENDPOINTS.ATTENDANCE.LIST}?${queryParams.toString()}`);
  }

  public async getTodayTasks(userId: string): Promise<ApiResponse<AttendanceRecord[]>> {
    const queryParams = new URLSearchParams({
      user_id: userId,
    });
    return this.get(`${API_ENDPOINTS.TASKS.TODAY}?${queryParams.toString()}`);
  }

  public async getMonthTasks(userId: string): Promise<ApiResponse<AttendanceRecord[]>> {
    const queryParams = new URLSearchParams({
      user_id: userId,
    });
    return this.get(`${API_ENDPOINTS.TASKS.MONTH}?${queryParams.toString()}`);
  }

  public async submitTaskReport(
    siteId: string,
    imageUris: string[],
    latitude: number,
    longitude: number,
    description: string
  ): Promise<ApiResponse<AttendanceRecord>> {
    // For now, we'll use a simple POST request
    // Later this might need to be a multipart form like attendance
    return this.post(API_ENDPOINTS.TASKS.SUBMIT, {
      site_id: siteId,
      image_uris: imageUris,
      latitude,
      longitude,
      description,
    });
  }

  public async getTaskImages(
    siteId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<TaskImageRecord[]>> {
    const queryParams = new URLSearchParams({
      site_id: siteId,
    });
    
    if (startDate) {
      queryParams.append('start_date', startDate);
    }
    
    if (endDate) {
      queryParams.append('end_date', endDate);
    }
    
    return this.get(`${API_ENDPOINTS.PHOTOS.LIST}?${queryParams.toString()}`);
  }

  public async uploadMultiplePhotos(
    siteId: string,
    imageUris: string[],
    latitude?: number,
    longitude?: number,
    description?: string
  ): Promise<ApiResponse<TaskImageRecord[]>> {
    // Create query params including the required location data
    const queryParams = new URLSearchParams({
      site_id: siteId,
    });

    if (latitude !== undefined) {
      queryParams.append('latitude', latitude.toString());
    }
    if (longitude !== undefined) {
      queryParams.append('longitude', longitude.toString());
    }
    if (description) {
      queryParams.append('description', description);
    }

    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PHOTOS.UPLOAD_MULTIPLE}?${queryParams.toString()}`;
    
    // 📝 LOG UPLOAD START
    console.warn('🚀 STARTING MULTIPLE PHOTOS UPLOAD:', JSON.stringify({
      url,
      siteId,
      imageCount: imageUris.length,
      latitude,
      longitude,
      description,
      timestamp: new Date().toISOString(),
    }, null, 2));

    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create FormData (only for images now)
      const formData = new FormData();
      
      // Add images to FormData
      imageUris.forEach((imageUri, index) => {
        const filename = `photo_${Date.now()}_${index}.jpg`;
        (formData as any).append('files', {
          uri: imageUri,
          type: 'image/jpeg',
          name: filename,
        });
      });

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        'ngrok-skip-browser-warning': 'true',
      };

      // Create abort controller for timeout (longer timeout for multiple file uploads)
      const controller = new AbortController();
      const uploadTimeout = 120000; // 2 minutes for multiple files
      const timeoutId = setTimeout(() => {
        console.error('⏰ MULTIPLE PHOTOS UPLOAD TIMEOUT after', uploadTimeout, 'ms');
        controller.abort();
      }, uploadTimeout);

      try {
        const requestStartTime = Date.now();
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const requestDuration = Date.now() - requestStartTime;

        // Parse response
        let responseData: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        // 📝 LOG UPLOAD RESPONSE
        if (response.ok) {
          console.warn('✅ MULTIPLE PHOTOS UPLOAD SUCCESS:', JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            duration: `${requestDuration}ms`,
            contentType,
            imageCount: imageUris.length,
            data: responseData,
            timestamp: new Date().toISOString(),
          }, null, 2));
        } else {
          console.error('❌ MULTIPLE PHOTOS UPLOAD ERROR:', JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            duration: `${requestDuration}ms`,
            contentType,
            error: responseData?.message || responseData,
            fullResponse: responseData,
            timestamp: new Date().toISOString(),
          }, null, 2));
        }

        // Handle 401 Unauthorized or 403 Forbidden in photo upload
        if (response.status === 401 || response.status === 403) {
          console.warn('🚨 401/403 UNAUTHORIZED/FORBIDDEN IN PHOTO UPLOAD - INITIATING LOGOUT');
          
          // Show toast notification
          showErrorToast(
            'Your session has expired or access is forbidden. You will be logged out.',
            'Authentication Error'
          );
          
          await this.handleUnauthorized();
          return {
            error: 'Session expired or access forbidden. Please login again.',
            success: false,
          };
        }

        if (!response.ok) {
          return {
            error: responseData?.message || `HTTP ${response.status}: ${response.statusText}`,
            success: false,
          };
        }

        return {
          data: responseData,
          success: true,
        };

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // 📝 LOG FETCH ERROR
        console.error('🔥 MULTIPLE PHOTOS UPLOAD FAILED:', JSON.stringify({
          url,
          error: fetchError.message,
          errorType: fetchError.name,
          imageCount: imageUris.length,
          timestamp: new Date().toISOString(),
        }, null, 2));
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Upload timeout - please try with fewer images');
        }
        throw fetchError;
      }

    } catch (error: any) {
      // 📝 LOG GENERAL ERROR
      console.error('💥 MULTIPLE PHOTOS UPLOAD ERROR:', {
        url,
        siteId,
        imageCount: imageUris.length,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      
      return {
        error: error.message || 'Multiple photos upload failed',
        success: false,
      };
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
