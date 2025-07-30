export interface User {
  id: number;
  mobile: string;
  name: string;
  role: number;
  token: string;
}

export interface Site {
  id: string; // UUID string from API
  name: string;
  description: string;
  location_lat: number;
  location_lng: number;
  address: string;
  is_active: boolean;
  created_at: string;
  location_wkt: string | null;
}

export interface AttendanceRecord {
  id: number;
  siteId: string; // Changed to string to match Site.id
  imageUrl: string;
  imageUrls?: string[]; // For task reports with multiple images
  timestamp: string;
  latitude: number;
  longitude: number;
  type: 'attendance' | 'task'; // Distinguish between attendance and task report
}

export interface TaskReportRecord {
  id: number;
  siteId: string; // Changed to string to match Site.id
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
  todayTasks: TaskReportRecord[];
  monthTasks: TaskReportRecord[];
  isLoading: boolean;
  isMarkingAttendance: boolean;
  isSubmittingTask: boolean;
  error: string | null;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  SiteList: undefined;
  SiteDetail: { site: Site };
};
