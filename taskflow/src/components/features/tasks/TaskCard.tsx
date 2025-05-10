import { Box, HStack, Text, Badge, Flex, IconButton, Menu, MenuButton, MenuItem, MenuList, Spacer } from '@chakra-ui/react';
import { FiMoreVertical, FiEdit, FiTrash2, FiClock } from 'react-icons/fi';
import React from 'react';
import type { Task } from '../../../models/Task';
import Card from '../../common/Card';
import { formatDueDate, formatTimeSpent, isOverdue } from '../../../utils/dateUtils';
import { useProjectContext } from '../../../contexts/ProjectContext';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onTrackTime: (task: Task) => void;
}

const TaskCard = ({ task, onEdit, onDelete, onTrackTime }: TaskCardProps) => {
  const { projects } = useProjectContext();
  
  // Find project for this task
  const taskProject = task.projectId 
    ? projects.find(p => p.id === task.projectId) 
    : null;

  // Determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'gray';
      case 'IN_PROGRESS':
        return 'blue';
      case 'COMPLETED':
        return 'green';
      default:
        return 'gray';
    }
  };

  // Determine priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'red';
      case 'MEDIUM':
        return 'orange';
      case 'LOW':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Card mb={4}>
      <Flex direction="column">
        <Flex justify="space-between" align="center">
          <Text fontWeight="semibold" fontSize="lg" mb={2}>
            {task.title}
          </Text>
          
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FiMoreVertical />}
              variant="ghost"
              size="sm"
              aria-label="Options"
            />
            <MenuList>
              <MenuItem icon={<FiEdit />} onClick={() => onEdit(task)}>
                Edit
              </MenuItem>
              <MenuItem icon={<FiClock />} onClick={() => onTrackTime(task)}>
                Track Time
              </MenuItem>
              <MenuItem icon={<FiTrash2 />} onClick={() => onDelete(task.id)}>
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
        
        {task.description && (
          <Text fontSize="sm" color="gray.600" mb={3} noOfLines={2} _dark={{ color: 'gray.300' }}>
            {task.description}
          </Text>
        )}
        
        <HStack spacing={2} mb={3} flexWrap="wrap">
          <Badge colorScheme={getStatusColor(task.status)}>
            {task.status}
          </Badge>
          
          <Badge colorScheme={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
          
          {taskProject && (
            <Badge 
              colorScheme="purple" 
              style={{ backgroundColor: taskProject.color }}
            >
              {taskProject.name}
            </Badge>
          )}
        </HStack>
        
        <Flex justify="space-between" fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
          <Box>
            {task.timeSpent > 0 && (
              <Text mr={4}>
                <FiClock style={{ display: 'inline', marginRight: '5px' }} />
                {formatTimeSpent(task.timeSpent)}
              </Text>
            )}
          </Box>
          
          <Spacer />
          
          {task.dueDate && (
            <Text
              color={isOverdue(task.dueDate) ? 'red.500' : 'inherit'}
              fontWeight={isOverdue(task.dueDate) ? 'semibold' : 'normal'}
            >
              Due: {formatDueDate(task.dueDate)}
            </Text>
          )}
        </Flex>
        
        {task.tags.length > 0 && (
          <Box mt={3}>
            <HStack spacing={2} flexWrap="wrap">
              {task.tags.map(tag => (
                <Badge key={tag} colorScheme="blue" variant="subtle">
                  {tag}
                </Badge>
              ))}
            </HStack>
          </Box>
        )}
      </Flex>
    </Card>
  );
};

export default TaskCard; 