import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '../models/Project';
import * as storageService from '../services/storageService';

interface ProjectContextType {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, project: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects from localStorage on component mount
  useEffect(() => {
    try {
      const loadedProjects = storageService.getProjects();
      setProjects(loadedProjects);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load projects');
      setIsLoading(false);
    }
  }, []);

  // Add a new project
  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...projectData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };

    try {
      const savedProject = storageService.saveProject(newProject);
      setProjects(prevProjects => [...prevProjects, newProject]);
      return savedProject;
    } catch (err) {
      setError('Failed to add project');
      throw new Error('Failed to add project');
    }
  };

  // Update an existing project
  const updateProject = async (id: string, projectData: Partial<Project>): Promise<Project> => {
    try {
      const projectToUpdate = projects.find(project => project.id === id);
      
      if (!projectToUpdate) {
        throw new Error(`Project with id ${id} not found`);
      }
      
      const updatedProject: Project = {
        ...projectToUpdate,
        ...projectData,
        updatedAt: new Date().toISOString()
      };
      
      const savedProject = storageService.saveProject(updatedProject);
      
      setProjects(prevProjects => 
        prevProjects.map(project => (project.id === id ? updatedProject : project))
      );
      
      return savedProject;
    } catch (err) {
      setError('Failed to update project');
      throw new Error('Failed to update project');
    }
  };

  // Delete a project
  const deleteProject = async (id: string): Promise<void> => {
    try {
      storageService.deleteProject(id);
      setProjects(prevProjects => prevProjects.filter(project => project.id !== id));
    } catch (err) {
      setError('Failed to delete project');
      throw new Error('Failed to delete project');
    }
  };

  const value = {
    projects,
    isLoading,
    error,
    addProject,
    updateProject,
    deleteProject
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}; 