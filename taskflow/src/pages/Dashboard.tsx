import { Box, Flex, Heading, Text, SimpleGrid, Button, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton } from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Summary from '../components/features/dashboard/Summary';
import ProgressChart from '../components/features/dashboard/ProgressChart';
import TaskList from '../components/features/tasks/TaskList';
import TaskForm from '../components/features/tasks/TaskForm';
import { useTaskContext } from '../contexts/TaskContext';
import { useProjectContext } from '../contexts/ProjectContext';
import type { Task } from '../models/Task';

const Dashboard = () => {
  const { tasks, addTask } = useTaskContext();
  const { projects } = useProjectContext();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
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

  // Handle form submission
  const handleSubmit = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addTask(taskData);
    onClose();
  };
  
  return (
    <Layout>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Dashboard</Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={onOpen}
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

      {/* Task form modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Task</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <TaskForm
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default Dashboard; 