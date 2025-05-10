import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import React from 'react';
import type { Project } from '../../../models/Project';
import ProjectCard from './ProjectCard';

interface ProjectListProps {
  projects: Project[];
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

const ProjectList = ({
  projects,
  onEditProject,
  onDeleteProject,
}: ProjectListProps) => {
  // Sort projects by updated date (most recent first)
  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  
  if (sortedProjects.length === 0) {
    return (
      <Box py={10} textAlign="center">
        <Text color="gray.500">
          No projects found. Create a new project to get started.
        </Text>
      </Box>
    );
  }
  
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
      {sortedProjects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEditProject}
          onDelete={onDeleteProject}
        />
      ))}
    </SimpleGrid>
  );
};

export default ProjectList; 