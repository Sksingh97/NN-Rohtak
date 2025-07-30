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
      const response = await apiService.login(mobile, password);
      
      if (response.success && response.data) {
        // Check if role exists and is authorized
        if (!response.data.role) {
          return rejectWithValue('User role not found. Please contact administrator.');
        }

        const userRole = response.data.role.toLowerCase();
        if (userRole !== 'worker' && userRole !== 'supervisor') {
          return rejectWithValue('You are not authorized to access this app. Only workers and supervisors are allowed.');
        }

        // Map API response to our User type
        const user: User = {
          id: response.data.user_id, // Use UUID string directly from API
          mobile: response.data.mobile || response.data.email || '', // Use mobile field first, fallback to email
          name: response.data.name,
          role: userRole === 'supervisor' ? 2 : 1, // Map supervisor to 2, worker to 1
          token: response.data.access_token,
        };
        return user;
      } else {
        return rejectWithValue(response.error || STRINGS.LOGIN_ERROR);
      }
    } catch (error: any) {
      return rejectWithValue(error.message || STRINGS.LOGIN_ERROR);
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
