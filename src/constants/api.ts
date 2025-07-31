const BASE_URL = 'https://endlessly-helpful-oarfish.ngrok-free.app/api';

export const API_CONFIG = {
  BASE_URL,
  TIMEOUT: 30000, // 30 seconds
} as const;

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  
  // Sites
  SITES: {
    LIST: '/sites/',
    DETAILS: '/sites', // with /:id appended
  },
  
  // Attendance
  ATTENDANCE: {
    MARK: '/attendance/',
    LIST: '/attendance', // with query params for filtering
  },
  
  // Tasks
  TASKS: {
    SUBMIT: '/tasks/submit',
    TODAY: '/tasks/today',
    MONTH: '/tasks/month',
  },
  
  // Photos
  PHOTOS: {
    LIST: '/photos/', // with query params: site_id, start_date, end_date
  },
  
  // User
  USER: {
    PROFILE: '/user/profile',
  },
};

// Dummy API responses for development
export const DUMMY_RESPONSES = {
  LOGIN_SUCCESS: {
    success: true,
    data: {
      user: {
        id: 1,
        mobile: '0000000000',
        name: 'John Doe',
        role: 'supervisor', // Changed to string role
        token: 'dummy_jwt_token_12345',
      },
    },
  },

  LOGIN_SUCCESS_WORKER: {
    success: true,
    data: {
      user: {
        id: 2,
        mobile: '1111111111',
        name: 'Jane Smith',
        role: 'worker',
        token: 'dummy_jwt_token_67890',
      },
    },
  },
  
  SITES_LIST: {
    success: true,
    data: {
      sites: [
        {
          id: 1,
          name: 'Site A - Municipal Office',
          address: '123 Main Street, Sector 1, Rohtak',
          latitude: 28.8945,
          longitude: 76.6066,
        },
        {
          id: 2,
          name: 'Site B - Water Treatment Plant',
          address: '456 Industrial Area, Sector 2, Rohtak',
          latitude: 28.8955,
          longitude: 76.6076,
        },
        {
          id: 3,
          name: 'Site C - Waste Management Center',
          address: '789 Green Lane, Sector 3, Rohtak',
          latitude: 28.8965,
          longitude: 76.6086,
        },
        {
          id: 4,
          name: 'Site D - Community Center',
          address: '321 Community Road, Sector 4, Rohtak',
          latitude: 28.8975,
          longitude: 76.6096,
        },
        {
          id: 5,
          name: 'Site E - Health Center',
          address: '654 Health Street, Sector 5, Rohtak',
          latitude: 28.8985,
          longitude: 76.6106,
        },
      ],
    },
  },
  
  MY_SITES: {
    success: true,
    data: {
      sites: [
        {
          id: 1,
          name: 'Site A - Municipal Office',
          address: '123 Main Street, Sector 1, Rohtak',
          latitude: 28.8945,
          longitude: 76.6066,
        },
        {
          id: 2,
          name: 'Site B - Water Treatment Plant',
          address: '456 Industrial Area, Sector 2, Rohtak',
          latitude: 28.8955,
          longitude: 76.6076,
        },
      ],
    },
  },
  
  ATTENDANCE_TODAY: {
    success: true,
    data: {
      attendance: [
        {
          id: 1,
          siteId: 1,
          imageUrl: 'https://picsum.photos/200/200?random=1',
          timestamp: new Date().toISOString(),
          latitude: 28.8945,
          longitude: 76.6066,
          type: 'attendance',
        },
      ],
    },
  },
  
  ATTENDANCE_MONTH: {
    success: true,
    data: {
      attendance: [
        {
          id: 1,
          siteId: 1,
          imageUrl: 'https://picsum.photos/200/200?random=1',
          timestamp: new Date().toISOString(),
          latitude: 28.8945,
          longitude: 76.6066,
          type: 'attendance',
        },
        {
          id: 2,
          siteId: 1,
          imageUrl: 'https://picsum.photos/200/200?random=2',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          latitude: 28.8945,
          longitude: 76.6066,
          type: 'attendance',
        },
        {
          id: 3,
          siteId: 1,
          imageUrl: 'https://picsum.photos/200/200?random=3',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          latitude: 28.8945,
          longitude: 76.6066,
          type: 'attendance',
        },
      ],
    },
  },

  TASKS_TODAY: {
    success: true,
    data: {
      tasks: [
        {
          id: 101,
          siteId: 1,
          imageUrl: 'https://picsum.photos/200/200?random=11',
          imageUrls: [
            'https://picsum.photos/200/200?random=11',
            'https://picsum.photos/200/200?random=12',
            'https://picsum.photos/200/200?random=13',
          ],
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          latitude: 28.8945,
          longitude: 76.6066,
          type: 'task',
        },
      ],
    },
  },

  TASKS_MONTH: {
    success: true,
    data: {
      tasks: [
        {
          id: 101,
          siteId: 1,
          imageUrl: 'https://picsum.photos/200/200?random=11',
          imageUrls: [
            'https://picsum.photos/200/200?random=11',
            'https://picsum.photos/200/200?random=12',
            'https://picsum.photos/200/200?random=13',
          ],
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          latitude: 28.8945,
          longitude: 76.6066,
          type: 'task',
        },
        {
          id: 102,
          siteId: 1,
          imageUrl: 'https://picsum.photos/200/200?random=21',
          imageUrls: [
            'https://picsum.photos/200/200?random=21',
            'https://picsum.photos/200/200?random=22',
          ],
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          latitude: 28.8945,
          longitude: 76.6066,
          type: 'task',
        },
        {
          id: 103,
          siteId: 1,
          imageUrl: 'https://picsum.photos/200/200?random=31',
          imageUrls: ['https://picsum.photos/200/200?random=31'],
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          latitude: 28.8945,
          longitude: 76.6066,
          type: 'task',
        },
      ],
    },
  },
};
