import {
  Box,
  Flex,
  Heading,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Select,
  Input,
  HStack,
  InputGroup,
  InputLeftElement,
  IconButton,
} from '@chakra-ui/react';
import { FiPlus, FiSearch, FiFilter, FiX } from 'react-icons/fi';
import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import TaskList from '../components/features/tasks/TaskList';
import TaskForm from '../components/features/tasks/TaskForm';
import { useTaskContext } from '../contexts/TaskContext';
import { useProjectContext } from '../contexts/ProjectContext';
import type { Task, TaskStatus, Priority } from '../models/Task';
import { filterTasks, sortTasks } from '../utils/filterUtils';

const TasksPage = () => {
  const { tasks, addTask, updateTask, deleteTask } = useTaskContext();
  const { projects } = useProjectContext();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [projectFilter, setProjectFilter] = useState<string | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Task being edited
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('ALL');
    setProjectFilter('ALL');
    setPriorityFilter('ALL');
    setSearchQuery('');
  };
  
  // Handle task edit
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    onOpen();
  };
  
  // Handle task creation
  const handleAddTask = () => {
    setEditingTask(null);
    onOpen();
  };
  
  // Handle form submission
  const handleSubmit = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await addTask(taskData);
    }
    onClose();
  };
  
  // Filter and sort tasks
  const filteredTasks = filterTasks(tasks, {
    status: statusFilter,
    projectId: projectFilter,
    priority: priorityFilter,
    searchQuery,
  });
  
  const sortedTasks = sortTasks(filteredTasks, 'updatedAt', 'desc');
  
  return (
    <Layout>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Tasks</Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleAddTask}
          >
            New Task
          </Button>
        </Flex>
        
        {/* Filter controls */}
        <Box mb={6} p={4} bg="white" borderRadius="md" boxShadow="sm" _dark={{ bg: 'gray.800' }}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={4}
            align={{ base: 'stretch', md: 'center' }}
          >
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            
            <HStack spacing={3} flex="1">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'ALL')}
              >
                <option value="ALL">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </Select>
              
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | 'ALL')}
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
              
              <Select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="ALL">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
              
              <IconButton
                icon={<FiX />}
                aria-label="Clear filters"
                variant="ghost"
                onClick={clearFilters}
              />
            </HStack>
          </Flex>
        </Box>
        
        {/* Task list */}
        <TaskList
          tasks={sortedTasks}
          onEditTask={handleEditTask}
          onDeleteTask={deleteTask}
          onTrackTime={() => {}} // Placeholder for time tracking functionality
        />
      </Box>
      
      {/* Task form modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <TaskForm
              initialData={editingTask || undefined}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default TasksPage; 