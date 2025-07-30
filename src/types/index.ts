export interface User {
  id: number;
  username: string;
  name: string;
  role: number;
  token: string;
}

export interface Site {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface AttendanceRecord {
  id: number;
  siteId: number;
  imageUrl: string;
  imageUrls?: string[]; // For task reports with multiple images
  timestamp: string;
  latitude: number;
  longitude: number;
  type: 'attendance' | 'task'; // Distinguish between attendance and task report
}

export interface TaskReportRecord {
  id: number;
  siteId: number;
  imageUrls: string[];
  timestamp: string;
  latitude?: number;
  longitude?: number;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface SiteState {
  allSites: Site[];
  mySites: Site[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
}

export interface AttendanceState {
  todayAttendance: AttendanceRecord[];
  monthAttendance: AttendanceRecord[];
  todayTasks: AttendanceRecord[];
  monthTasks: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;
  isMarkingAttendance: boolean;
  isSubmittingTask: boolean;
}

// Note: RootState is now defined in the store file to avoid circular imports
