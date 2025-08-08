import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MySweeper, AllSweeper } from '../../types';
import { API_CONFIG, API_ENDPOINTS } from '../../constants/api';

interface SweeperState {
  mySweepers: MySweeper[];
  allSweepers: AllSweeper[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
}

const initialState: SweeperState = {
  mySweepers: [],
  allSweepers: [],
  isLoading: false,
  error: null,
  searchQuery: '',
};

// Async thunk for fetching my sweepers
export const fetchMySweepers = createAsyncThunk(
  'sweepers/fetchMySweepers',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.user?.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USER.MY_SITES_USERS}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch my sweepers';
      return rejectWithValue(message);
    }
  }
);

// Async thunk for fetching all sweepers
export const fetchAllSweepers = createAsyncThunk(
  'sweepers/fetchAllSweepers',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.user?.token;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USER.MY_SITES_USERS}?role=worker`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch all sweepers';
      return rejectWithValue(message);
    }
  }
);

const sweeperSlice = createSlice({
  name: 'sweepers',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // My Sweepers
    builder
      .addCase(fetchMySweepers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMySweepers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.mySweepers = action.payload;
        state.error = null;
      })
      .addCase(fetchMySweepers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // All Sweepers
    builder
      .addCase(fetchAllSweepers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllSweepers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allSweepers = action.payload;
        state.error = null;
      })
      .addCase(fetchAllSweepers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSearchQuery, clearError } = sweeperSlice.actions;
export default sweeperSlice.reducer;
