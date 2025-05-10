import type { Task } from '../models/Task';
import type { Project } from '../models/Project';

// Constants for storage keys
const TASKS_STORAGE_KEY = 'taskflow_tasks';
const PROJECTS_STORAGE_KEY = 'taskflow_projects';
const TIME_ENTRIES_STORAGE_KEY = 'taskflow_time_entries';

// Generic function to get data from localStorage
const getFromStorage = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Generic function to save data to localStorage
const saveToStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Task operations
export const getTasks = (): Task[] => {
  return getFromStorage<Task>(TASKS_STORAGE_KEY);
};

export const saveTask = (task: Task): Task => {
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
};

export const deleteTask = (id: string): void => {
  const tasks = getTasks().filter(task => task.id !== id);
  saveToStorage(TASKS_STORAGE_KEY, tasks);
};

export const getTasksByProject = (projectId: string): Task[] => {
  return getTasks().filter(task => task.projectId === projectId);
};

export const getTasksByStatus = (status: string): Task[] => {
  return getTasks().filter(task => task.status === status);
};

// Project operations
export const getProjects = (): Project[] => {
  return getFromStorage<Project>(PROJECTS_STORAGE_KEY);
};

export const saveProject = (project: Project): Project => {
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
};

export const deleteProject = (id: string): void => {
  const projects = getProjects().filter(project => project.id !== id);
  saveToStorage(PROJECTS_STORAGE_KEY, projects);
};

// Data management - export/import
export const exportData = (): Blob => {
  const data = {
    tasks: getTasks(),
    projects: getProjects(),
    timeEntries: getFromStorage(TIME_ENTRIES_STORAGE_KEY)
  };
  
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

export const clearData = (): boolean => {
  try {
    localStorage.removeItem(TASKS_STORAGE_KEY);
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
    localStorage.removeItem(TIME_ENTRIES_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}; 