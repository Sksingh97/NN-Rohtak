import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AttendanceState, AttendanceRecord, TaskImageRecord, GroupedTaskImages } from '../../types';
import { apiService } from '../../services/apiService';

// Helper function to group task images by date
const groupTaskImagesByDate = (taskImages: TaskImageRecord[]): GroupedTaskImages => {
  const grouped: GroupedTaskImages = {};
  
  taskImages.forEach(image => {
    // Extract date from timestamp (YYYY-MM-DD format), handle missing timestamp
    const date = image.timestamp ? image.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
    
    if (!grouped[date]) {
      grouped[date] = [];
    }
    
    grouped[date].push(image);
  });
  
  // Sort images within each date by timestamp (newest first), creating new arrays
  Object.keys(grouped).forEach(date => {
    grouped[date] = [...grouped[date]].sort((a, b) => {
      const aDate = a.timestamp ? new Date(a.timestamp) : new Date(0);
      const bDate = b.timestamp ? new Date(b.timestamp) : new Date(0);
      
      const aValid = !isNaN(aDate.getTime());
      const bValid = !isNaN(bDate.getTime());
      
      if (!aValid && !bValid) return 0;
      if (!aValid) return 1;
      if (!bValid) return -1;
      
      return bDate.getTime() - aDate.getTime();
    });
  });
  
  return grouped;
};

const initialState: AttendanceState = {
  todayAttendance: [],
  monthAttendance: [],
  todayTasks: [],
  monthTasks: [],
  attendanceRecords: [], // Add new field for site-based attendance
  taskImages: [], // New field for task images
  groupedTaskImages: {}, // Grouped by date
  isLoading: false,
  error: null,
  isMarkingAttendance: false,
  isSubmittingTask: false,
};

// New async thunk for fetching attendance by site
export const fetchAttendanceBySite = createAsyncThunk(
  'attendance/fetchAttendanceBySite',
  async ({ siteId, startDate, endDate }: { siteId: string; startDate?: string; endDate?: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.getAttendance(siteId, startDate, endDate);
      
      if (response.success && response.data) {
        // Map the response to ensure timestamp field exists for compatibility
        const mappedData = response.data.map(record => ({
          ...record,
          timestamp: record.check_in_time, // Map check_in_time to timestamp for compatibility
          description: record.notes, // Map notes to description for compatibility
        }));
        return mappedData;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch attendance records');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch attendance records');
    }
  }
);

// New async thunk for fetching task images by site
export const fetchTaskImagesBySite = createAsyncThunk(
  'attendance/fetchTaskImagesBySite',
  async ({ siteId, startDate, endDate }: { siteId: string; startDate?: string; endDate?: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.getTaskImages(siteId, startDate, endDate);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to fetch task images');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch task images');
    }
  }
);

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

// Async thunk for submitting task report with multiple photos
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
      const response = await apiService.uploadMultiplePhotos(
        siteId,
        imageUris,
        latitude,
        longitude,
        description
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
      .addCase(submitTaskReport.fulfilled, (state, action: PayloadAction<TaskImageRecord[]>) => {
        state.isSubmittingTask = false;
        // Add new task images to the existing taskImages array
        state.taskImages = [...state.taskImages, ...action.payload];
        // Regroup task images by date
        state.groupedTaskImages = groupTaskImagesByDate(state.taskImages);
        state.error = null;
      })
      .addCase(submitTaskReport.rejected, (state, action) => {
        state.isSubmittingTask = false;
        state.error = action.payload as string;
      })
      // Handle fetchAttendanceBySite
      .addCase(fetchAttendanceBySite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceBySite.fulfilled, (state, action: PayloadAction<AttendanceRecord[]>) => {
        state.isLoading = false;
        state.attendanceRecords = action.payload;
        state.error = null;
      })
      .addCase(fetchAttendanceBySite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle fetchTaskImagesBySite
      .addCase(fetchTaskImagesBySite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTaskImagesBySite.fulfilled, (state, action: PayloadAction<TaskImageRecord[]>) => {
        state.isLoading = false;
        state.taskImages = action.payload;
        state.groupedTaskImages = groupTaskImagesByDate(action.payload);
        state.error = null;
      })
      .addCase(fetchTaskImagesBySite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAttendanceError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
