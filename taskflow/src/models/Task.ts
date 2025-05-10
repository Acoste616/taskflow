export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;              // Unique identifier
  title: string;           // Task title
  description: string;     // Task description
  status: TaskStatus;      // Current status
  priority: Priority;      // Task priority
  projectId: string | null; // Associated project
  dueDate: string | null;  // ISO date string
  createdAt: string;       // ISO date string
  updatedAt: string;       // ISO date string
  timeSpent: number;       // Time spent in minutes
  tags: string[];          // Array of tag strings
  notes: string;           // Additional notes
}

export interface TimeEntry {
  id: string;              // Unique identifier
  taskId: string;          // Associated task
  startTime: string;       // ISO date string
  endTime: string | null;  // ISO date string, null if ongoing
  duration: number;        // Duration in minutes (calculated)
  notes: string;           // Notes about this time entry
} 