import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/api';

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

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
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
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, loginResponse.access_token],
        [STORAGE_KEYS.REFRESH_TOKEN, loginResponse.refresh_token],
        [STORAGE_KEYS.USER_DATA, JSON.stringify({
          id: loginResponse.user_id,
          name: loginResponse.name,
          mobile: loginResponse.mobile || loginResponse.email || '', // Use mobile field first, fallback to email
          role: userRole === 'supervisor' ? 2 : 1, // Map supervisor to 2, worker to 1
        })],
      ]);
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  }

  // Get stored user data
  public async getStoredUserData(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user data:', error);
      return null;
    }
  }

  // Clear stored auth data
  public async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  }

  // Generate headers
  private async generateHeaders(customHeaders?: Record<string, string>, requiresAuth = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response
        let responseData: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
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
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw fetchError;
      }

    } catch (error: any) {
      console.error('API Request Error:', error);
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
    const response = await this.post<LoginResponse>(
      '/auth/login',
      { mobile, password }, // Send mobile field in payload
      undefined,
      false // Login doesn't require auth
    );

    if (response.success && response.data) {
      // Validate role before storing auth data
      if (!response.data.role) {
        return {
          error: 'User role not found. Please contact administrator.',
          success: false,
        };
      }

      const userRole = response.data.role.toLowerCase();
      if (userRole !== 'worker' && userRole !== 'supervisor') {
        return {
          error: 'You are not authorized to access this app. Only workers and supervisors are allowed.',
          success: false,
        };
      }

      // Only store auth data if role is valid
      await this.storeAuthData(response.data);
    }

    return response;
  }

  // Logout method
  public async logout(): Promise<void> {
    try {
      // Call logout endpoint if needed
      await this.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      await this.clearAuthData();
    }
  }

  // Sites method
  public async getSites(): Promise<ApiResponse<any[]>> {
    return this.get('/sites/');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
