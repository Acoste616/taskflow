export interface Project {
  id: string;              // Unique identifier
  name: string;            // Project name
  description: string;     // Project description
  color: string;           // Color for UI representation
  createdAt: string;       // ISO date string
  updatedAt: string;       // ISO date string
  isActive: boolean;       // Whether project is active
} 