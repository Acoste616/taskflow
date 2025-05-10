import type { Task, TaskStatus, Priority } from '../models/Task';
import { isOverdue } from './dateUtils';

interface TaskFilters {
  status?: TaskStatus | 'ALL';
  priority?: Priority | 'ALL';
  projectId?: string | 'ALL';
  searchQuery?: string;
  dueDate?: 'today' | 'upcoming' | 'overdue' | 'ALL';
  tags?: string[];
}

export const filterTasks = (tasks: Task[], filters: TaskFilters): Task[] => {
  return tasks.filter(task => {
    // Status filter
    if (filters.status && filters.status !== 'ALL' && task.status !== filters.status) {
      return false;
    }
    
    // Priority filter
    if (filters.priority && filters.priority !== 'ALL' && task.priority !== filters.priority) {
      return false;
    }
    
    // Project filter
    if (filters.projectId && filters.projectId !== 'ALL' && task.projectId !== filters.projectId) {
      return false;
    }
    
    // Search query filter
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesDescription = task.description.toLowerCase().includes(query);
      const matchesNotes = task.notes.toLowerCase().includes(query);
      const matchesTags = task.tags.some(tag => tag.toLowerCase().includes(query));
      
      if (!(matchesTitle || matchesDescription || matchesNotes || matchesTags)) {
        return false;
      }
    }
    
    // Due date filter
    if (filters.dueDate) {
      if (filters.dueDate === 'overdue' && !isOverdue(task.dueDate)) {
        return false;
      }
      
      if (filters.dueDate === 'today') {
        if (!task.dueDate) return false;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dueDate = new Date(task.dueDate);
        
        if (dueDate < today || dueDate >= tomorrow) {
          return false;
        }
      }
      
      if (filters.dueDate === 'upcoming') {
        if (!task.dueDate) return false;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dueDate = new Date(task.dueDate);
        
        if (dueDate < tomorrow || dueDate >= sevenDaysLater) {
          return false;
        }
      }
    }
    
    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      if (!task.tags.some(tag => filters.tags?.includes(tag))) {
        return false;
      }
    }
    
    return true;
  });
};

export const sortTasks = (tasks: Task[], sortBy: string, sortDirection: 'asc' | 'desc'): Task[] => {
  const sortedTasks = [...tasks];
  
  switch (sortBy) {
    case 'dueDate':
      sortedTasks.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
      break;
      
    case 'priority':
      const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      sortedTasks.sort((a, b) => {
        const weightA = priorityWeight[a.priority as keyof typeof priorityWeight];
        const weightB = priorityWeight[b.priority as keyof typeof priorityWeight];
        
        return sortDirection === 'asc' ? weightA - weightB : weightB - weightA;
      });
      break;
      
    case 'title':
      sortedTasks.sort((a, b) => {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        
        if (titleA < titleB) return sortDirection === 'asc' ? -1 : 1;
        if (titleA > titleB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      break;
      
    case 'createdAt':
      sortedTasks.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
      break;
      
    case 'updatedAt':
      sortedTasks.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
      break;
      
    default:
      // Default to sorting by updatedAt descending
      sortedTasks.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        
        return dateB - dateA;
      });
  }
  
  return sortedTasks;
}; 