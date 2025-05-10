// Format date to readable format (e.g., "May 10, 2025")
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'No date';
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Format due date with relative indicators (e.g., "Tomorrow", "Yesterday", "In 3 days")
export const formatDueDate = (dateString: string | null): string => {
  if (!dateString) return 'No due date';
  
  const dueDate = new Date(dateString);
  const today = new Date();
  
  // Reset time part for accurate day comparison
  today.setHours(0, 0, 0, 0);
  const dueDateNoTime = new Date(dueDate);
  dueDateNoTime.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = dueDateNoTime.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0) return `In ${diffDays} days`;
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  
  // Fallback to standard format
  return formatDate(dateString);
};

// Calculate time spent in human-readable format
export const formatTimeSpent = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
};

// Check if a task is overdue
export const isOverdue = (dueDate: string | null): boolean => {
  if (!dueDate) return false;
  
  const now = new Date();
  const taskDueDate = new Date(dueDate);
  
  return taskDueDate < now;
};

// Get a relative description of time (e.g., "Just now", "5 minutes ago", "2 hours ago")
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Convert to appropriate time units
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHr / 24);
  
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  // If more than a week, return formatted date
  return formatDate(dateString);
}; 