import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AttendanceState, AttendanceRecord } from '../../types';
import { apiService } from '../../services/apiService';

const initialState: AttendanceState = {
  todayAttendance: [],
  monthAttendance: [],
  todayTasks: [],
  monthTasks: [],
  isLoading: false,
  error: null,
  isMarkingAttendance: false,
  isSubmittingTask: false,
};

// Async thunk for fetching today's attendance
export const fetchTodayAttendance = createAsyncThunk(
  'attendance/fetchTodayAttendance',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getTodayAttendance(userId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch today\'s attendance');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch today\'s attendance');
    }
  }
);

// Async thunk for fetching month attendance
export const fetchMonthAttendance = createAsyncThunk(
  'attendance/fetchMonthAttendance',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getMonthAttendance(userId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch month attendance');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch month attendance');
    }
  }
);

// Async thunk for fetching today's tasks
export const fetchTodayTasks = createAsyncThunk(
  'attendance/fetchTodayTasks',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getTodayTasks(userId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch today\'s tasks');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch today\'s tasks');
    }
  }
);

// Async thunk for fetching month tasks
export const fetchMonthTasks = createAsyncThunk(
  'attendance/fetchMonthTasks',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getMonthTasks(userId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch month tasks');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch month tasks');
    }
  }
);

// Async thunk for submitting task report
export const submitTaskReport = createAsyncThunk(
  'attendance/submitTaskReport',
  async (
    { siteId, imageUris, latitude, longitude, description }: {
      siteId: string;
      imageUris: string[];
      latitude?: number;
      longitude?: number; 
      description?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.submitTaskReport(
        siteId,
        imageUris,
        latitude || 0,
        longitude || 0,
        description || 'Task completed'
      );
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to submit task report');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit task report');
    }
  }
);

// Async thunk for marking attendance
export const markAttendance = createAsyncThunk(
  'attendance/markAttendance',
  async (
    { siteId, imageUri, latitude, longitude, description }: {
      siteId: string;
      imageUri: string;
      latitude: number;
      longitude: number;
      description: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.markAttendance(
        siteId,
        latitude,
        longitude,
        description,
        imageUri
      );
      
      if (response.success && response.data) {
        return response.data as AttendanceRecord;
      } else {
        return rejectWithValue(response.error || 'Failed to mark attendance');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark attendance');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendanceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchTodayAttendance
      .addCase(fetchTodayAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTodayAttendance.fulfilled, (state, action: PayloadAction<AttendanceRecord[]>) => {
        state.isLoading = false;
        state.todayAttendance = action.payload;
        state.error = null;
      })
      .addCase(fetchTodayAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle fetchMonthAttendance
      .addCase(fetchMonthAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMonthAttendance.fulfilled, (state, action: PayloadAction<AttendanceRecord[]>) => {
        state.isLoading = false;
        state.monthAttendance = action.payload;
        state.error = null;
      })
      .addCase(fetchMonthAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle markAttendance
      .addCase(markAttendance.pending, (state) => {
        state.isMarkingAttendance = true;
        state.error = null;
      })
      .addCase(markAttendance.fulfilled, (state, action: PayloadAction<AttendanceRecord>) => {
        state.isMarkingAttendance = false;
        state.todayAttendance.unshift(action.payload);
        state.monthAttendance.unshift(action.payload);
        state.error = null;
      })
      .addCase(markAttendance.rejected, (state, action) => {
        state.isMarkingAttendance = false;
        state.error = action.payload as string;
      })
      // Handle fetchTodayTasks
      .addCase(fetchTodayTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTodayTasks.fulfilled, (state, action: PayloadAction<AttendanceRecord[]>) => {
        state.isLoading = false;
        state.todayTasks = action.payload;
        state.error = null;
      })
      .addCase(fetchTodayTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle fetchMonthTasks
      .addCase(fetchMonthTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMonthTasks.fulfilled, (state, action: PayloadAction<AttendanceRecord[]>) => {
        state.isLoading = false;
        state.monthTasks = action.payload;
        state.error = null;
      })
      .addCase(fetchMonthTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle submitTaskReport
      .addCase(submitTaskReport.pending, (state) => {
        state.isSubmittingTask = true;
        state.error = null;
      })
      .addCase(submitTaskReport.fulfilled, (state, action: PayloadAction<AttendanceRecord>) => {
        state.isSubmittingTask = false;
        state.todayTasks.unshift(action.payload);
        state.monthTasks.unshift(action.payload);
        state.error = null;
      })
      .addCase(submitTaskReport.rejected, (state, action) => {
        state.isSubmittingTask = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAttendanceError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
