import { Box, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, Flex, Icon } from '@chakra-ui/react';
import { FiCheckSquare, FiClock, FiCalendar, FiFolder } from 'react-icons/fi';
import React from 'react';
import Card from '../../common/Card';
import { useTaskContext } from '../../../contexts/TaskContext';
import { useProjectContext } from '../../../contexts/ProjectContext';
import { formatTimeSpent } from '../../../utils/dateUtils';

const Summary = () => {
  const { tasks } = useTaskContext();
  const { projects } = useProjectContext();
  
  // Calculate task statistics
  const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length;
  const todoTasks = tasks.filter(task => task.status === 'TODO').length;
  
  // Calculate total time spent
  const totalTimeSpent = tasks.reduce((acc, task) => acc + task.timeSpent, 0);
  
  // Get upcoming tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate <= nextWeek && task.status !== 'COMPLETED';
  }).length;
  
  // Get active projects
  const activeProjects = projects.filter(project => project.isActive).length;
  
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
      <Card>
        <Stat>
          <Flex alignItems="center">
            <Box color="green.500" pr={2}>
              <Icon as={FiCheckSquare} boxSize={6} />
            </Box>
            <StatLabel>Task Progress</StatLabel>
          </Flex>
          <StatNumber>{completedTasks}</StatNumber>
          <StatHelpText>
            {inProgressTasks} in progress, {todoTasks} to do
          </StatHelpText>
        </Stat>
      </Card>
      
      <Card>
        <Stat>
          <Flex alignItems="center">
            <Box color="blue.500" pr={2}>
              <Icon as={FiClock} boxSize={6} />
            </Box>
            <StatLabel>Time Spent</StatLabel>
          </Flex>
          <StatNumber>{formatTimeSpent(totalTimeSpent)}</StatNumber>
          <StatHelpText>
            Total time across all tasks
          </StatHelpText>
        </Stat>
      </Card>
      
      <Card>
        <Stat>
          <Flex alignItems="center">
            <Box color="orange.500" pr={2}>
              <Icon as={FiCalendar} boxSize={6} />
            </Box>
            <StatLabel>Due Soon</StatLabel>
          </Flex>
          <StatNumber>{upcomingTasks}</StatNumber>
          <StatHelpText>
            Tasks due in the next 7 days
          </StatHelpText>
        </Stat>
      </Card>
      
      <Card>
        <Stat>
          <Flex alignItems="center">
            <Box color="purple.500" pr={2}>
              <Icon as={FiFolder} boxSize={6} />
            </Box>
            <StatLabel>Active Projects</StatLabel>
          </Flex>
          <StatNumber>{activeProjects}</StatNumber>
          <StatHelpText>
            Out of {projects.length} total projects
          </StatHelpText>
        </Stat>
      </Card>
    </SimpleGrid>
  );
};

export default Summary; 