/**
 * Attendance Configuration Constants
 * 
 * These constants control various aspects of attendance marking functionality.
 */

/**
 * Controls whether the "Select from Gallery" option is shown for attendance marking.
 * 
 * When set to false (recommended for security):
 * - Only camera capture is allowed for attendance
 * - Ensures user is physically present at the location
 * - Prevents use of old/fake images from gallery
 * 
 * When set to true:
 * - Both camera and gallery options are available
 * - Shows ImagePickerModal with both options
 * - Allows more flexibility but less security
 * 
 * To enable gallery selection for attendance:
 * 1. Change the value below to `true`
 * 2. Rebuild the app
 * 3. Users will see both "Camera" and "Gallery" options when marking attendance
 */
export const ATTENDANCE_SHOW_SELECT_FROM_GALLERY = true;
