import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MySweeper, AllSweeper } from '../../types';
import { apiService } from '../../services/apiService';

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
  async (_, { rejectWithValue }) => {
    try {
      console.warn('🔍 FETCHING MY SWEEPERS...');
      const response = await apiService.getMySweepers();
      
      console.warn('🔍 MY SWEEPERS RESPONSE:', JSON.stringify({
        success: response.success,
        data: response.data,
        error: response.error,
      }, null, 2));
      
      if (response.success && response.data) {
        console.warn('✅ MY SWEEPERS SUCCESS - Raw data:', JSON.stringify(response.data, null, 2));
        
        // Handle different possible API response formats
        let sweeperData: any = response.data;
        
        // If the data is wrapped in another object (e.g., { users: [...] })
        if (sweeperData && typeof sweeperData === 'object' && !Array.isArray(sweeperData)) {
          // Check for common wrapper properties
          if (sweeperData.users) sweeperData = sweeperData.users;
          else if (sweeperData.data) sweeperData = sweeperData.data;
          else if (sweeperData.sweepers) sweeperData = sweeperData.sweepers;
          else if (sweeperData.my_sweepers) sweeperData = sweeperData.my_sweepers;
        }
        
        // Ensure it's an array
        if (!Array.isArray(sweeperData)) {
          console.warn('⚠️ MY SWEEPERS - Data is not an array:', typeof sweeperData);
          sweeperData = [];
        }
        
        console.warn('✅ MY SWEEPERS SUCCESS - Final data length:', sweeperData.length);
        return sweeperData;
      } else {
        console.warn('❌ MY SWEEPERS FAILED:', response.error);
        return rejectWithValue(response.error || 'Failed to fetch my sweepers');
      }
    } catch (error: any) {
      console.warn('💥 MY SWEEPERS ERROR:', error.message);
      return rejectWithValue(error.message || 'Failed to fetch my sweepers');
    }
  }
);

// Async thunk for fetching all sweepers
export const fetchAllSweepers = createAsyncThunk(
  'sweepers/fetchAllSweepers',
  async (_, { rejectWithValue }) => {
    try {
      console.warn('🔍 FETCHING ALL SWEEPERS...');
      const response = await apiService.getAllSweepers();
      
      console.warn('🔍 ALL SWEEPERS RESPONSE:', JSON.stringify({
        success: response.success,
        data: response.data,
        error: response.error,
      }, null, 2));
      
      if (response.success && response.data) {
        console.warn('✅ ALL SWEEPERS SUCCESS - Raw data:', JSON.stringify(response.data, null, 2));
        
        // Handle different possible API response formats
        let sweeperData: any = response.data;
        
        // If the data is wrapped in another object (e.g., { users: [...] })
        if (sweeperData && typeof sweeperData === 'object' && !Array.isArray(sweeperData)) {
          // Check for common wrapper properties
          if (sweeperData.users) sweeperData = sweeperData.users;
          else if (sweeperData.data) sweeperData = sweeperData.data;
          else if (sweeperData.sweepers) sweeperData = sweeperData.sweepers;
          else if (sweeperData.all_sweepers) sweeperData = sweeperData.all_sweepers;
        }
        
        // Ensure it's an array
        if (!Array.isArray(sweeperData)) {
          console.warn('⚠️ ALL SWEEPERS - Data is not an array:', typeof sweeperData);
          sweeperData = [];
        }
        
        console.warn('✅ ALL SWEEPERS SUCCESS - Final data length:', sweeperData.length);
        return sweeperData;
      } else {
        console.warn('❌ ALL SWEEPERS FAILED:', response.error);
        return rejectWithValue(response.error || 'Failed to fetch all sweepers');
      }
    } catch (error: any) {
      console.warn('💥 ALL SWEEPERS ERROR:', error.message);
      return rejectWithValue(error.message || 'Failed to fetch all sweepers');
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
        console.warn('📦 STORED MY SWEEPERS:', action.payload?.length || 0, 'items');
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
        console.warn('📦 STORED ALL SWEEPERS:', action.payload?.length || 0, 'items');
      })
      .addCase(fetchAllSweepers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSearchQuery, clearError } = sweeperSlice.actions;
export default sweeperSlice.reducer;
