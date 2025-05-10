import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskStatus } from '../models/Task';
import * as storageService from '../services/storageService';
import type { ReactNode } from 'react';

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, task: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTasksByProject: (projectId: string) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider = ({ children }: TaskProviderProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks from localStorage on component mount
  useEffect(() => {
    try {
      const loadedTasks = storageService.getTasks();
      setTasks(loadedTasks);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load tasks');
      setIsLoading(false);
    }
  }, []);

  // Add a new task
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };

    try {
      const savedTask = storageService.saveTask(newTask);
      setTasks(prevTasks => [...prevTasks, newTask]);
      return savedTask;
    } catch (err) {
      setError('Failed to add task');
      throw new Error('Failed to add task');
    }
  };

  // Update an existing task
  const updateTask = async (id: string, taskData: Partial<Task>): Promise<Task> => {
    try {
      const taskToUpdate = tasks.find(task => task.id === id);
      
      if (!taskToUpdate) {
        throw new Error(`Task with id ${id} not found`);
      }
      
      const updatedTask: Task = {
        ...taskToUpdate,
        ...taskData,
        updatedAt: new Date().toISOString()
      };
      
      const savedTask = storageService.saveTask(updatedTask);
      
      setTasks(prevTasks => 
        prevTasks.map(task => (task.id === id ? updatedTask : task))
      );
      
      return savedTask;
    } catch (err) {
      setError('Failed to update task');
      throw new Error('Failed to update task');
    }
  };

  // Delete a task
  const deleteTask = async (id: string): Promise<void> => {
    try {
      storageService.deleteTask(id);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    } catch (err) {
      setError('Failed to delete task');
      throw new Error('Failed to delete task');
    }
  };

  // Get tasks by project
  const getTasksByProject = (projectId: string): Task[] => {
    return tasks.filter(task => task.projectId === projectId);
  };

  // Get tasks by status
  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status);
  };

  const value = {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    getTasksByProject,
    getTasksByStatus
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}; 