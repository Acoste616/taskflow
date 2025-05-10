import type { Task } from '../models/Task';
import type { Project } from '../models/Project';

// Constants for storage keys
const TASKS_STORAGE_KEY = 'taskflow_tasks';
const PROJECTS_STORAGE_KEY = 'taskflow_projects';
const TIME_ENTRIES_STORAGE_KEY = 'taskflow_time_entries';
const BOOKMARKS_STORAGE_KEY = 'taskflow_bookmarks';

// Custom error class for storage operations
class StorageError extends Error {
  constructor(message: string, public readonly key?: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Generic function to get data from localStorage
const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error: unknown) {
    console.error(`Error retrieving data from localStorage for key ${key}:`, error);
    throw new StorageError(
      `Failed to retrieve data from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      key
    );
  }
};

// Generic function to save data to localStorage
const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error: unknown) {
    console.error(`Error saving data to localStorage for key ${key}:`, error);
    throw new StorageError(
      `Failed to save data to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      key
    );
  }
};

// Task operations
export const getTasks = (): Task[] => {
  try {
    return getFromStorage<Task>(TASKS_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw new StorageError('Failed to get tasks', TASKS_STORAGE_KEY);
  }
};

export const saveTask = (task: Task): Task => {
  try {
    const tasks = getTasks();
    const existingTaskIndex = tasks.findIndex(t => t.id === task.id);
    
    if (existingTaskIndex >= 0) {
      // Update existing task
      tasks[existingTaskIndex] = { ...task, updatedAt: new Date().toISOString() };
    } else {
      // Add new task
      tasks.push(task);
    }
    
    saveToStorage(TASKS_STORAGE_KEY, tasks);
    return task;
  } catch (error) {
    console.error('Error saving task:', error);
    throw new StorageError('Failed to save task', TASKS_STORAGE_KEY);
  }
};

export const deleteTask = (id: string): void => {
  try {
    const tasks = getTasks().filter(task => task.id !== id);
    saveToStorage(TASKS_STORAGE_KEY, tasks);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new StorageError('Failed to delete task', TASKS_STORAGE_KEY);
  }
};

export const getTasksByProject = (projectId: string): Task[] => {
  try {
    return getTasks().filter(task => task.projectId === projectId);
  } catch (error) {
    console.error('Error getting tasks by project:', error);
    throw new StorageError('Failed to get tasks by project', TASKS_STORAGE_KEY);
  }
};

export const getTasksByStatus = (status: string): Task[] => {
  try {
    return getTasks().filter(task => task.status === status);
  } catch (error) {
    console.error('Error getting tasks by status:', error);
    throw new StorageError('Failed to get tasks by status', TASKS_STORAGE_KEY);
  }
};

// Project operations
export const getProjects = (): Project[] => {
  try {
    return getFromStorage<Project>(PROJECTS_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting projects:', error);
    throw new StorageError('Failed to get projects', PROJECTS_STORAGE_KEY);
  }
};

export const saveProject = (project: Project): Project => {
  try {
    const projects = getProjects();
    const existingProjectIndex = projects.findIndex(p => p.id === project.id);
    
    if (existingProjectIndex >= 0) {
      // Update existing project
      projects[existingProjectIndex] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      // Add new project
      projects.push(project);
    }
    
    saveToStorage(PROJECTS_STORAGE_KEY, projects);
    return project;
  } catch (error) {
    console.error('Error saving project:', error);
    throw new StorageError('Failed to save project', PROJECTS_STORAGE_KEY);
  }
};

export const deleteProject = (id: string): void => {
  try {
    const projects = getProjects().filter(project => project.id !== id);
    saveToStorage(PROJECTS_STORAGE_KEY, projects);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new StorageError('Failed to delete project', PROJECTS_STORAGE_KEY);
  }
};

// Data management - export/import
export const exportData = (): Blob => {
  try {
    const data = {
      tasks: getTasks(),
      projects: getProjects(),
      timeEntries: getFromStorage(TIME_ENTRIES_STORAGE_KEY),
      bookmarks: getFromStorage(BOOKMARKS_STORAGE_KEY)
    };
    
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  } catch (error) {
    console.error('Error exporting data:', error);
    throw new StorageError('Failed to export data');
  }
};

export const importData = (data: string): boolean => {
  try {
    const parsedData = JSON.parse(data);
    
    if (parsedData.tasks) {
      saveToStorage(TASKS_STORAGE_KEY, parsedData.tasks);
    }
    
    if (parsedData.projects) {
      saveToStorage(PROJECTS_STORAGE_KEY, parsedData.projects);
    }
    
    if (parsedData.timeEntries) {
      saveToStorage(TIME_ENTRIES_STORAGE_KEY, parsedData.timeEntries);
    }
    
    if (parsedData.bookmarks) {
      saveToStorage(BOOKMARKS_STORAGE_KEY, parsedData.bookmarks);
    }
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    throw new StorageError('Failed to import data');
  }
};

export const clearData = (): boolean => {
  try {
    localStorage.removeItem(TASKS_STORAGE_KEY);
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
    localStorage.removeItem(TIME_ENTRIES_STORAGE_KEY);
    localStorage.removeItem(BOOKMARKS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    throw new StorageError('Failed to clear data');
  }
}; 