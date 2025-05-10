import { Box, Flex, Heading, Text, SimpleGrid, Button } from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Summary from '../components/features/dashboard/Summary';
import ProgressChart from '../components/features/dashboard/ProgressChart';
import TaskList from '../components/features/tasks/TaskList';
import { useTaskContext } from '../contexts/TaskContext';
import { useProjectContext } from '../contexts/ProjectContext';

const Dashboard = () => {
  const { tasks } = useTaskContext();
  const { projects } = useProjectContext();
  
  // Get recent tasks
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  
  // Get tasks due soon
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextDay = new Date(tomorrow);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const dueSoonTasks = tasks.filter(task => {
    if (!task.dueDate || task.status === 'COMPLETED') return false;
    
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    return dueDate <= nextDay;
  });
  
  return (
    <Layout>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Dashboard</Heading>
          <Button
            as={Link}
            to="/tasks/new"
            leftIcon={<FiPlus />}
            colorScheme="blue"
          >
            New Task
          </Button>
        </Flex>
        
        <Summary />
        
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6} mb={8}>
          <ProgressChart />
          
          <Box>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Tasks Due Soon</Heading>
              <Button 
                as={Link} 
                to="/tasks" 
                variant="ghost" 
                size="sm"
              >
                View All
              </Button>
            </Flex>
            
            {dueSoonTasks.length > 0 ? (
              <TaskList 
                tasks={dueSoonTasks} 
                onEditTask={() => {}} 
                onDeleteTask={() => {}} 
                onTrackTime={() => {}}
              />
            ) : (
              <Text color="gray.500">No tasks due soon.</Text>
            )}
          </Box>
        </SimpleGrid>
        
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">Recent Tasks</Heading>
            <Button 
              as={Link} 
              to="/tasks" 
              variant="ghost" 
              size="sm"
            >
              View All
            </Button>
          </Flex>
          
          {recentTasks.length > 0 ? (
            <TaskList 
              tasks={recentTasks} 
              onEditTask={() => {}} 
              onDeleteTask={() => {}} 
              onTrackTime={() => {}}
            />
          ) : (
            <Text color="gray.500">No tasks created yet.</Text>
          )}
        </Box>
      </Box>
    </Layout>
  );
};

export default Dashboard; 