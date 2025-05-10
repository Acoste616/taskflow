import { Box, Heading, Text, Flex, Badge, IconButton, Progress } from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import React from 'react';
import type { Project } from '../../../models/Project';
import Card from '../../common/Card';
import { useTaskContext } from '../../../contexts/TaskContext';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

const ProjectCard = ({ project, onEdit, onDelete }: ProjectCardProps) => {
  const { tasks } = useTaskContext();
  
  // Get all tasks for this project
  const projectTasks = tasks.filter(task => task.projectId === project.id);
  
  // Count tasks by status
  const completedTasks = projectTasks.filter(task => task.status === 'COMPLETED').length;
  const inProgressTasks = projectTasks.filter(task => task.status === 'IN_PROGRESS').length;
  const todoTasks = projectTasks.filter(task => task.status === 'TODO').length;
  
  // Calculate progress
  const totalTasks = projectTasks.length;
  const progressPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;
  
  // Determine color based on progress
  const getProgressColorScheme = () => {
    if (progressPercentage >= 80) return 'green';
    if (progressPercentage >= 50) return 'blue';
    if (progressPercentage >= 20) return 'orange';
    return 'red';
  };
  
  return (
    <Card mb={4} borderLeftWidth="4px" borderLeftColor={project.color}>
      <Flex justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Heading size="md" fontWeight="bold" mb={2}>
            {project.name}
          </Heading>
          
          <Text fontSize="sm" color="gray.600" mb={4} noOfLines={2} _dark={{ color: 'gray.300' }}>
            {project.description}
          </Text>
          
          <Box mb={3}>
            <Progress 
              value={progressPercentage} 
              size="sm" 
              colorScheme={getProgressColorScheme()} 
              borderRadius="full" 
            />
            <Text fontSize="xs" mt={1} textAlign="right">
              {progressPercentage}% Complete
            </Text>
          </Box>
          
          <Flex gap={2} wrap="wrap">
            <Badge colorScheme="green">{completedTasks} Completed</Badge>
            <Badge colorScheme="blue">{inProgressTasks} In Progress</Badge>
            <Badge colorScheme="gray">{todoTasks} To Do</Badge>
            <Badge colorScheme="purple">{totalTasks} Total</Badge>
          </Flex>
        </Box>
        
        <Flex>
          <IconButton
            icon={<FiEdit />}
            aria-label="Edit project"
            size="sm"
            variant="ghost"
            onClick={() => onEdit(project)}
            mr={1}
          />
          
          <IconButton
            icon={<FiTrash2 />}
            aria-label="Delete project"
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={() => onDelete(project.id)}
          />
        </Flex>
      </Flex>
      
      <Box as="time" fontSize="xs" color="gray.500" mt={4} display="block">
        Created on {new Date(project.createdAt).toLocaleDateString()}
      </Box>
    </Card>
  );
};

export default ProjectCard; 