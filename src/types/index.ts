export interface User {
  id: string; // Changed to string to handle UUID from API
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

// Sweeper/Worker interfaces
export interface MySweeper {
  user_id: string;
  name: string;
  sites: string[];
}

export interface AllSweeper {
  id: string;
  name: string;
  mobile: string;
  role: string;
  sites: string[];
  is_active: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: string; // UUID from API
  user_id: string;
  site_id: string;
  date: string;
  status: boolean;
  notes: string;
  image_url: string;
  filename: string;
  lat: number;
  lng: number;
  check_in_time: string;
  check_out_time: string | null;
  created_at: string;
  timestamp: string; // For compatibility, we'll map from check_in_time
  // Legacy fields for backward compatibility
  description?: string;
  file_size?: number | null;
  mime_type?: string | null;
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

export interface PaginationState {
  currentPage: number;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export interface AttendanceState {
  todayAttendance: AttendanceRecord[];
  monthAttendance: AttendanceRecord[];
  todayTasks: AttendanceRecord[];
  monthTasks: AttendanceRecord[];
  attendanceRecords: AttendanceRecord[]; // New field for site-based attendance
  taskImages: TaskImageRecord[]; // New field for task images
  groupedTaskImages: GroupedTaskImages; // Grouped by date
  groupedAttendanceRecords: GroupedAttendanceRecords; // Grouped by date
  // Pagination states for monthly data
  thisMonthPagination: PaginationState;
  lastMonthPagination: PaginationState;
  isLoading: boolean;
  isMarkingAttendance: boolean;
  isSubmittingTask: boolean;
  error: string | null;
}

export interface TaskImageRecord {
  id: string;
  user_id: string;
  site_id: string;
  description: string | null;
  lat: number | null;
  lng: number | null;
  image_url: string;
  filename: string;
  timestamp: string;
  file_size: number | null;
  mime_type: string | null;
}

export interface GroupedTaskImages {
  [date: string]: TaskImageRecord[];
}

export interface GroupedAttendanceRecords {
  [date: string]: AttendanceRecord[];
}

export interface TaskGroupDisplayItem {
  id: string;
  date: string;
  images: TaskImageRecord[];
  displayImage: string; // First image URL
  imageCount: number;
  timestamp: string; // Latest timestamp for sorting
}

export interface AttendanceGroupDisplayItem {
  id: string;
  date: string;
  records: AttendanceRecord[];
  displayRecord: AttendanceRecord; // First/main record to display
  recordCount: number;
  timestamp: string; // Latest timestamp for sorting
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  SiteList: undefined;
  SiteDetail: { 
    site: Site; 
    sourceTab?: number; // 0 = My Sites, 1 = All Sites (for supervisors)
  };
  UserDetail: {
    user: MySweeper | AllSweeper;
    sourceTab?: number; // 0 = My Sweepers, 1 = All Sweepers
  };
};
