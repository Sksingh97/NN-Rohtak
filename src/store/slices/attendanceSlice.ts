import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AttendanceState, AttendanceRecord } from '../../types';
import { DUMMY_RESPONSES } from '../../constants/api';

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
  async (userId: number, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter today's attendance records
      const today = new Date().toDateString();
      return DUMMY_RESPONSES.ATTENDANCE_TODAY.data.attendance.filter(
        (record: any) => new Date(record.timestamp).toDateString() === today
      ) as AttendanceRecord[];
    } catch (error) {
      return rejectWithValue('Failed to fetch today\'s attendance');
    }
  }
);

// Async thunk for fetching month attendance
export const fetchMonthAttendance = createAsyncThunk(
  'attendance/fetchMonthAttendance',
  async (userId: number, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return DUMMY_RESPONSES.ATTENDANCE_MONTH.data.attendance as AttendanceRecord[];
    } catch (error) {
      return rejectWithValue('Failed to fetch month attendance');
    }
  }
);

// Async thunk for fetching today's tasks
export const fetchTodayTasks = createAsyncThunk(
  'attendance/fetchTodayTasks',
  async (userId: number, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter today's task records
      const today = new Date().toDateString();
      return DUMMY_RESPONSES.TASKS_TODAY.data.tasks.filter(
        (record: any) => new Date(record.timestamp).toDateString() === today
      ) as AttendanceRecord[];
    } catch (error) {
      return rejectWithValue('Failed to fetch today\'s tasks');
    }
  }
);

// Async thunk for fetching month tasks
export const fetchMonthTasks = createAsyncThunk(
  'attendance/fetchMonthTasks',
  async (userId: number, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return DUMMY_RESPONSES.TASKS_MONTH.data.tasks as AttendanceRecord[];
    } catch (error) {
      return rejectWithValue('Failed to fetch month tasks');
    }
  }
);

// Async thunk for submitting task report
export const submitTaskReport = createAsyncThunk(
  'attendance/submitTaskReport',
  async (
    { siteId, imageUris }: {
      siteId: number;
      imageUris: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create new task record
      const newRecord: AttendanceRecord = {
        id: Date.now(),
        siteId,
        timestamp: new Date().toISOString(),
        imageUrl: imageUris[0], // First image for display
        imageUrls: imageUris, // All images
        latitude: 28.8945, // Would get from location in real app
        longitude: 76.6066,
        type: 'task',
      };
      
      return newRecord;
    } catch (error) {
      return rejectWithValue('Failed to submit task report');
    }
  }
);

// Async thunk for marking attendance
export const markAttendance = createAsyncThunk(
  'attendance/markAttendance',
  async (
    { siteId, imageUri, latitude, longitude }: {
      siteId: number;
      imageUri: string;
      latitude: number;
      longitude: number;
    },
    { rejectWithValue }
  ) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create new attendance record
      const newRecord: AttendanceRecord = {
        id: Date.now(),
        siteId,
        timestamp: new Date().toISOString(),
        imageUrl: imageUri,
        latitude,
        longitude,
        type: 'attendance',
      };
      
      return newRecord;
    } catch (error) {
      return rejectWithValue('Failed to mark attendance');
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
