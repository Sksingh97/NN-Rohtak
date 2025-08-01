// Image compression configuration
export const IMAGE_COMPRESSION_CONFIG = {
  // Quality settings (0-1)
  ATTENDANCE_QUALITY: 0.8, // 80% quality for attendance images
  TASK_REPORT_QUALITY: 0.8, // 80% quality for task report images

  // Size limits (in pixels)
  ATTENDANCE_MAX_WIDTH: 1024,
  ATTENDANCE_MAX_HEIGHT: 1024,
  TASK_REPORT_MAX_WIDTH: 1024,
  TASK_REPORT_MAX_HEIGHT: 1024,
  
  // File format
  OUTPUT_FORMAT: 'jpg' as const, // Force JPEG for better compression
  
  // Compression method
  COMPRESSION_METHOD: 'auto' as const, // Let the library choose the best method
} as const;

// Helper to get compression options for attendance
export const getAttendanceCompressionOptions = () => ({
  quality: IMAGE_COMPRESSION_CONFIG.ATTENDANCE_QUALITY,
  maxWidth: IMAGE_COMPRESSION_CONFIG.ATTENDANCE_MAX_WIDTH,
  maxHeight: IMAGE_COMPRESSION_CONFIG.ATTENDANCE_MAX_HEIGHT,
});

// Helper to get compression options for task reports
export const getTaskReportCompressionOptions = () => ({
  quality: IMAGE_COMPRESSION_CONFIG.TASK_REPORT_QUALITY,
  maxWidth: IMAGE_COMPRESSION_CONFIG.TASK_REPORT_MAX_WIDTH,
  maxHeight: IMAGE_COMPRESSION_CONFIG.TASK_REPORT_MAX_HEIGHT,
});
