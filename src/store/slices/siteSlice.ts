import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SiteState, Site } from '../../types';
import { DUMMY_RESPONSES } from '../../constants/api';

const initialState: SiteState = {
  allSites: [],
  mySites: [],
  isLoading: false,
  error: null,
  searchQuery: '',
};

// Async thunk for fetching all sites
export const fetchAllSites = createAsyncThunk(
  'sites/fetchAllSites',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return DUMMY_RESPONSES.SITES_LIST.data.sites;
    } catch (error) {
      return rejectWithValue('Failed to fetch sites');
    }
  }
);

// Async thunk for fetching user's sites
export const fetchMySites = createAsyncThunk(
  'sites/fetchMySites',
  async (userId: number, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter sites based on user role/access
      const allSites = DUMMY_RESPONSES.SITES_LIST.data.sites;
      if (userId === 1) {
        // Admin sees all sites
        return allSites;
      } else {
        // Regular user sees limited sites
        return allSites.filter((site: Site) => site.id <= 2);
      }
    } catch (error) {
      return rejectWithValue('Failed to fetch user sites');
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
