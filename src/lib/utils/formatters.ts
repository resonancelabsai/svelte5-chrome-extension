/**
 * Format a date timestamp into a human-readable string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatDate(timestamp: number): string {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  
  // Format: "Jan 1, 2023"
  return date.toLocaleDateString('en-US', { 
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a date timestamp with time
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date and time string
 */
export function formatDateTime(timestamp: number): string {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  
  // Format: "Jan 1, 2023, 3:45 PM"
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format a relative date (e.g., "2 days ago")
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted relative date string
 */
export function formatRelativeDate(timestamp: number): string {
  if (!timestamp) return 'N/A';
  
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDay < 30) {
    return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  } else {
    return formatDate(timestamp);
  }
} 