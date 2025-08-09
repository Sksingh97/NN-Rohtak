/**
 * Date pagination utilities for monthly and daily data fetching
 */

export interface MonthInfo {
  year: number;
  month: number; // 1-12
  totalDays: number;
  firstDay: Date;
  lastDay: Date;
}

export interface DateRange {
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
}

export interface PaginatedDateRange extends DateRange {
  page: number;
  hasMore: boolean;
}

/**
 * Get today's date range (start and end are the same)
 */
export const getTodayRange = (): DateRange => {
  const today = new Date();
  const todayStr = formatDateToString(today);
  return {
    startDate: todayStr,
    endDate: todayStr
  };
};

/**
 * Get current month's complete date range
 */
export const getCurrentMonthRange = (): DateRange => {
  const monthInfo = getCurrentMonthInfo();
  return {
    startDate: formatDateToString(monthInfo.firstDay),
    endDate: formatDateToString(monthInfo.lastDay)
  };
};

/**
 * Get last month's complete date range
 */
export const getLastMonthRange = (): DateRange => {
  const monthInfo = getLastMonthInfo();
  return {
    startDate: formatDateToString(monthInfo.firstDay),
    endDate: formatDateToString(monthInfo.lastDay)
  };
};

/**
 * Get information about a specific month
 */
export const getMonthInfo = (year: number, month: number): MonthInfo => {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();

  return {
    year,
    month,
    totalDays,
    firstDay,
    lastDay
  };
};

/**
 * Get current month info
 */
export const getCurrentMonthInfo = (): MonthInfo => {
  const now = new Date();
  return getMonthInfo(now.getFullYear(), now.getMonth() + 1);
};

/**
 * Get last month info
 */
export const getLastMonthInfo = (): MonthInfo => {
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return getMonthInfo(year, lastMonth);
};

/**
 * Format date to YYYY-MM-DD without timezone issues
 */
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get paginated date range for a month in descending order (most recent first)
 * @param monthInfo - Month information
 * @param page - Page number (1-based)
 * @param daysPerPage - Number of days per page (default: 6)
 * @param isCurrentMonth - Whether this is for current month (starts from today) or last month (starts from last day)
 */
export const getPaginatedMonthRange = (
  monthInfo: MonthInfo,
  page: number,
  daysPerPage: number = 6,
  isCurrentMonth: boolean = true
): PaginatedDateRange => {
  const today = new Date();
  
  // Determine the starting point for pagination
  let maxDay: number;
  if (isCurrentMonth) {
    // For current month, start from today's date if we're in the current month
    const todayDate = today.getDate();
    const isCurrentMonthAndYear = today.getFullYear() === monthInfo.year && (today.getMonth() + 1) === monthInfo.month;
    maxDay = isCurrentMonthAndYear ? todayDate : monthInfo.totalDays;
  } else {
    // For last month, start from the last day of that month
    maxDay = monthInfo.totalDays;
  }
  
  // Calculate the end day (most recent) and start day for this page
  // Page 1: endDay = maxDay, startDay = maxDay - 5 (6 days total)
  // Page 2: endDay = maxDay - 6, startDay = maxDay - 11 (6 days total)
  const endDay = Math.max(1, maxDay - ((page - 1) * daysPerPage));
  const startDay = Math.max(1, endDay - daysPerPage + 1);
  
  const startDate = new Date(monthInfo.year, monthInfo.month - 1, startDay);
  const endDate = new Date(monthInfo.year, monthInfo.month - 1, endDay);

  // Check if there are more pages (older dates) - if startDay > 1, there are more pages
  const hasMore = startDay > 1;

  return {
    startDate: formatDateToString(startDate),
    endDate: formatDateToString(endDate),
    page,
    hasMore
  };
};

/**
 * Check if there are more pages available for a month
 */
export const hasMorePages = (monthInfo: MonthInfo, currentPage: number, daysPerPage: number = 6): boolean => {
  const maxDay = currentPage * daysPerPage;
  return maxDay < monthInfo.totalDays;
};

/**
 * Get the next page number
 */
export const getNextPage = (currentPage: number): number => {
  return currentPage + 1;
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get month name for display
 */
export const getMonthName = (month: number): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1] || '';
};
