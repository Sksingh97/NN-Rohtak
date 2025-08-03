import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AttendanceState, AttendanceRecord, TaskImageRecord, GroupedTaskImages, GroupedAttendanceRecords } from '../../types';
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

// Helper function to group attendance records by date
const groupAttendanceRecordsByDate = (attendanceRecords: AttendanceRecord[]): GroupedAttendanceRecords => {
  const grouped: GroupedAttendanceRecords = {};
  
  attendanceRecords.forEach(record => {
    // Extract date from check_in_time or timestamp (YYYY-MM-DD format)
    const timestampToUse = record.check_in_time || record.timestamp;
    const date = timestampToUse ? timestampToUse.split('T')[0] : new Date().toISOString().split('T')[0];
    
    if (!grouped[date]) {
      grouped[date] = [];
    }
    
    grouped[date].push(record);
  });
  
  // Sort records within each date by timestamp (newest first), creating new arrays
  Object.keys(grouped).forEach(date => {
    grouped[date] = [...grouped[date]].sort((a, b) => {
      const aTime = a.check_in_time || a.timestamp;
      const bTime = b.check_in_time || b.timestamp;
      
      const aDate = aTime ? new Date(aTime) : new Date(0);
      const bDate = bTime ? new Date(bTime) : new Date(0);
      
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
  groupedAttendanceRecords: {}, // Grouped by date
  // Pagination states
  thisMonthPagination: {
    currentPage: 0,
    hasMore: true,
    isLoadingMore: false,
  },
  lastMonthPagination: {
    currentPage: 0,
    hasMore: true,
    isLoadingMore: false,
  },
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

// New thunk for fetching today's data by site
export const fetchTodayDataBySite = createAsyncThunk(
  'attendance/fetchTodayDataBySite',
  async ({ siteId }: { siteId: string }, { rejectWithValue }) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch both attendance and task images for today
      const [attendanceResponse, taskImagesResponse] = await Promise.all([
        apiService.getAttendance(siteId, today, today),
        apiService.getTaskImages(siteId, today, today)
      ]);
      
      const attendanceData = attendanceResponse.success && attendanceResponse.data ? 
        attendanceResponse.data.map(record => ({
          ...record,
          timestamp: record.check_in_time,
          description: record.notes,
        })) : [];
      
      const taskImagesData = taskImagesResponse.success && taskImagesResponse.data ? 
        taskImagesResponse.data : [];
      
      return {
        attendanceRecords: attendanceData,
        taskImages: taskImagesData
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch today\'s data');
    }
  }
);

// New thunk for fetching paginated month data by site
export const fetchPaginatedMonthDataBySite = createAsyncThunk(
  'attendance/fetchPaginatedMonthDataBySite',
  async ({ 
    siteId, 
    startDate, 
    endDate, 
    page, 
    isThisMonth, 
    append = false 
  }: { 
    siteId: string; 
    startDate: string; 
    endDate: string; 
    page: number; 
    isThisMonth: boolean;
    append?: boolean;
  }, { rejectWithValue }) => {
    try {
      // Fetch both attendance and task images for the date range
      const [attendanceResponse, taskImagesResponse] = await Promise.all([
        apiService.getAttendance(siteId, startDate, endDate),
        apiService.getTaskImages(siteId, startDate, endDate)
      ]);
      
      const attendanceData = attendanceResponse.success && attendanceResponse.data ? 
        attendanceResponse.data.map(record => ({
          ...record,
          timestamp: record.check_in_time,
          description: record.notes,
        })) : [];
      
      const taskImagesData = taskImagesResponse.success && taskImagesResponse.data ? 
        taskImagesResponse.data : [];
      
      return {
        attendanceRecords: attendanceData,
        taskImages: taskImagesData,
        page,
        isThisMonth,
        append
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch paginated month data');
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
    resetPaginationState: (state, action: PayloadAction<{ isThisMonth: boolean }>) => {
      if (action.payload.isThisMonth) {
        state.thisMonthPagination = {
          currentPage: 0,
          hasMore: true,
          isLoadingMore: false,
        };
      } else {
        state.lastMonthPagination = {
          currentPage: 0,
          hasMore: true,
          isLoadingMore: false,
        };
      }
    },
    updateHasMore: (state, action: PayloadAction<{ isThisMonth: boolean; hasMore: boolean }>) => {
      if (action.payload.isThisMonth) {
        state.thisMonthPagination.hasMore = action.payload.hasMore;
      } else {
        state.lastMonthPagination.hasMore = action.payload.hasMore;
      }
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
        state.groupedAttendanceRecords = groupAttendanceRecordsByDate(action.payload);
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
      })
      // Handle fetchTodayDataBySite
      .addCase(fetchTodayDataBySite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTodayDataBySite.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceRecords = action.payload.attendanceRecords;
        state.taskImages = action.payload.taskImages;
        state.groupedAttendanceRecords = groupAttendanceRecordsByDate(action.payload.attendanceRecords);
        state.groupedTaskImages = groupTaskImagesByDate(action.payload.taskImages);
        state.error = null;
      })
      .addCase(fetchTodayDataBySite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle fetchPaginatedMonthDataBySite
      .addCase(fetchPaginatedMonthDataBySite.pending, (state, action) => {
        const { isThisMonth, append } = action.meta.arg;
        if (!append) {
          state.isLoading = true;
        }
        if (isThisMonth) {
          state.thisMonthPagination.isLoadingMore = true;
        } else {
          state.lastMonthPagination.isLoadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchPaginatedMonthDataBySite.fulfilled, (state, action) => {
        const { attendanceRecords, taskImages, page, isThisMonth, append } = action.payload;
        
        if (append) {
          // Append new data to existing data
          state.attendanceRecords = [...state.attendanceRecords, ...attendanceRecords];
          state.taskImages = [...state.taskImages, ...taskImages];
        } else {
          // Replace existing data (first load)
          state.attendanceRecords = attendanceRecords;
          state.taskImages = taskImages;
          state.isLoading = false;
        }
        
        // Update pagination state
        if (isThisMonth) {
          state.thisMonthPagination.currentPage = page;
          state.thisMonthPagination.isLoadingMore = false;
          // hasMore will be updated by the component based on data size
        } else {
          state.lastMonthPagination.currentPage = page;
          state.lastMonthPagination.isLoadingMore = false;
        }
        
        // Regroup data
        state.groupedAttendanceRecords = groupAttendanceRecordsByDate(state.attendanceRecords);
        state.groupedTaskImages = groupTaskImagesByDate(state.taskImages);
        state.error = null;
      })
      .addCase(fetchPaginatedMonthDataBySite.rejected, (state, action) => {
        const { isThisMonth } = action.meta.arg;
        state.isLoading = false;
        if (isThisMonth) {
          state.thisMonthPagination.isLoadingMore = false;
        } else {
          state.lastMonthPagination.isLoadingMore = false;
        }
        state.error = action.payload as string;
      });
  },
});

export const { clearAttendanceError, resetPaginationState, updateHasMore } = attendanceSlice.actions;
export default attendanceSlice.reducer;
