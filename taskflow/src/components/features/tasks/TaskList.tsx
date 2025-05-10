import { Box, Flex, Text, SimpleGrid } from '@chakra-ui/react';
import React, { useState } from 'react';
import type { Task, TaskStatus } from '../../../models/Task';
import { filterTasks, sortTasks } from '../../../utils/filterUtils';
import TaskCard from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  status?: TaskStatus | 'ALL';
  projectId?: string | 'ALL';
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onTrackTime: (task: Task) => void;
}

const TaskList = ({
  tasks,
  status = 'ALL',
  projectId = 'ALL',
  onEditTask,
  onDeleteTask,
  onTrackTime,
}: TaskListProps) => {
  // Filter and sort tasks
  const filteredTasks = filterTasks(tasks, { status, projectId });
  const sortedTasks = sortTasks(filteredTasks, 'updatedAt', 'desc');

  if (sortedTasks.length === 0) {
    return (
      <Box py={10} textAlign="center">
        <Text color="gray.500">No tasks found. Create a new task to get started.</Text>
      </Box>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 1, lg: 1 }} spacing={4}>
      {sortedTasks.map(task => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onEdit={onEditTask}
          onDelete={onDeleteTask}
          onTrackTime={onTrackTime}
        />
      ))}
    </SimpleGrid>
  );
};

export default TaskList; 