import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SiteState, Site } from '../../types';
import { apiService } from '../../services/apiService';

const initialState: SiteState = {
  allSites: [],
  mySites: [],
  isLoading: false,
  error: null,
  searchQuery: '',
};

// Async thunk for fetching all sites (for supervisor)
export const fetchAllSites = createAsyncThunk(
  'sites/fetchAllSites',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getSites();
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch sites');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sites');
    }
  }
);

// Async thunk for fetching user's sites (for worker - same API, different usage)
export const fetchMySites = createAsyncThunk(
  'sites/fetchMySites',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await apiService.getSites();
      if (response.success && response.data) {
        // For now, worker sees all sites from the API
        // In the future, you might want to filter based on worker assignment
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch user sites');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user sites');
    }
  }
);

const siteSlice = createSlice({
  name: 'sites',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearSiteError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchAllSites
      .addCase(fetchAllSites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllSites.fulfilled, (state, action: PayloadAction<Site[]>) => {
        state.isLoading = false;
        state.allSites = action.payload;
        state.error = null;
      })
      .addCase(fetchAllSites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle fetchMySites
      .addCase(fetchMySites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMySites.fulfilled, (state, action: PayloadAction<Site[]>) => {
        state.isLoading = false;
        state.mySites = action.payload;
        state.error = null;
      })
      .addCase(fetchMySites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSearchQuery, clearSiteError } = siteSlice.actions;
export default siteSlice.reducer;
