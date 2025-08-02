import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../../types';
import { apiService } from '../../services/apiService';
import { STRINGS } from '../../constants/strings';

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ mobile, password }: { mobile: string; password: string }, { rejectWithValue }) => {
    try {
      // Step 1: Login to get user data and token
      const loginResponse = await apiService.login(mobile, password);
      
      if (!loginResponse.success || !loginResponse.data) {
        // Extract meaningful error message from server response
        let errorMessage = STRINGS.LOGIN_ERROR;
        
        if (loginResponse.error) {
          if (typeof loginResponse.error === 'string') {
            errorMessage = loginResponse.error;
          } else if (typeof loginResponse.error === 'object' && loginResponse.error !== null) {
            // Handle server error objects (e.g., {detail: "Invalid credentials"})
            const errorObj = loginResponse.error as any;
            errorMessage = errorObj.detail || errorObj.message || errorObj.error || STRINGS.LOGIN_ERROR;
          }
        }
        
        return rejectWithValue(errorMessage);
      }

      // Check if role exists
      if (!loginResponse.data.role) {
        return rejectWithValue('User role not found. Please contact administrator.');
      }

      const userRole = loginResponse.data.role.toLowerCase();

      // Step 2: Use the token to fetch allowed roles
      try {
        // Temporarily store the token for the API call
        await apiService.storeAuthData(loginResponse.data);
        
        const rolesResponse = await apiService.getAppAllowedRoles();
        
        if (rolesResponse.success && rolesResponse.data && Array.isArray(rolesResponse.data)) {
          const allowedRoles = rolesResponse.data;
          
          // Step 3: Check if user role is in allowed roles
          if (!allowedRoles.includes(userRole)) {
            // Clear the stored data since user is not allowed
            await apiService.clearAuthData();
            const allowedRolesText = allowedRoles.join(', ');
            return rejectWithValue(`You are not authorized to access this app. Only ${allowedRolesText} are allowed.`);
          }
        } else {
          // If roles API fails, fallback to default check
          console.warn('Failed to fetch allowed roles, using default check');
          if (userRole !== 'worker' && userRole !== 'supervisor') {
            await apiService.clearAuthData();
            return rejectWithValue('You are not authorized to access this app. Only workers and supervisors are allowed.');
          }
        }
      } catch (rolesError) {
        // If roles API fails, fallback to default check
        console.warn('Error fetching allowed roles, using default check:', rolesError);
        if (userRole !== 'worker' && userRole !== 'supervisor') {
          await apiService.clearAuthData();
          return rejectWithValue('You are not authorized to access this app. Only workers and supervisors are allowed.');
        }
      }

      // Step 4: If we reach here, user is authorized
      // Map API response to our User type
      const user: User = {
        id: loginResponse.data.user_id,
        mobile: loginResponse.data.mobile || loginResponse.data.email || '',
        name: loginResponse.data.name,
        role: userRole === 'supervisor' ? 2 : 1,
        token: loginResponse.data.access_token,
      };
      
      return user;
    } catch (error: any) {
      // Handle network errors, exceptions, etc.
      let errorMessage = STRINGS.LOGIN_ERROR;
      
      if (error && typeof error === 'object') {
        errorMessage = error.message || error.toString() || STRINGS.LOGIN_ERROR;
      } else if (error && typeof error === 'string') {
        errorMessage = error;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunk to load user from storage
export const loadUserFromStorage = createAsyncThunk(
  'auth/loadUserFromStorage',
  async () => {
    try {
      const userData = await apiService.getStoredUserData();
      if (userData) {
        return userData;
      } else {
        throw new Error('No stored user data');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to load user data');
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout();
      return null;
    } catch (error: any) {
      // Continue with logout even if API call fails
      console.warn('Logout error:', error);
      return null;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Load user from storage cases
      .addCase(loadUserFromStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loadUserFromStorage.rejected, (state) => {
        state.isLoading = false;
        // Don't set error for storage loading failure
        state.isAuthenticated = false;
        state.user = null;
      })
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.isLoading = false;
        // Still logout locally even if API call fails
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
