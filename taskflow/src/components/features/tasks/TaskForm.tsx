import {
  Box,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  FormErrorMessage,
  Flex,
  Switch,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  FormHelperText,
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import type { Task, TaskStatus, Priority } from '../../../models/Task';
import { useProjectContext } from '../../../contexts/ProjectContext';

interface TaskFormProps {
  initialData?: Partial<Task>;
  onSubmit: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  tags?: string;
}

const TaskForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: TaskFormProps) => {
  const { projects } = useProjectContext();
  const toast = useToast();
  
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<TaskStatus>(initialData?.status || 'TODO');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'MEDIUM');
  const [projectId, setProjectId] = useState<string | null>(initialData?.projectId || null);
  const [dueDate, setDueDate] = useState<string | null>(initialData?.dueDate || null);
  const [timeSpent, setTimeSpent] = useState(initialData?.timeSpent || 0);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  // Tag input
  const [tagInput, setTagInput] = useState('');
  
  // Validation
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: FormErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    if (description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    // If there are validation errors, show them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // Mark all fields as touched to show errors
      const allTouched: Record<string, boolean> = {};
      Object.keys(newErrors).forEach(key => {
        allTouched[key] = true;
      });
      setTouched({ ...touched, ...allTouched });
      
      return;
    }
    
    // Create task data object
    const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title,
      description,
      status,
      priority,
      projectId,
      dueDate,
      timeSpent,
      tags,
      notes,
    };
    
    try {
      await onSubmit(taskData);
      toast({
        title: initialData?.id ? 'Task updated' : 'Task created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save task',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle adding a tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  // Handle removing a tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle tag input keydown (to add tag on Enter)
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <FormControl 
          isRequired 
          isInvalid={touched.title && !!errors.title}
        >
          <FormLabel>Title</FormLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched({ ...touched, title: true })}
            placeholder="Task title"
          />
          {errors.title && <FormErrorMessage>{errors.title}</FormErrorMessage>}
        </FormControl>
        
        <FormControl 
          isInvalid={touched.description && !!errors.description}
        >
          <FormLabel>Description</FormLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setTouched({ ...touched, description: true })}
            placeholder="Task description"
            rows={3}
          />
          {errors.description && <FormErrorMessage>{errors.description}</FormErrorMessage>}
        </FormControl>
        
        <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
          <FormControl>
            <FormLabel>Status</FormLabel>
            <Select 
              value={status} 
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>Priority</FormLabel>
            <Select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>
          </FormControl>
        </Flex>
        
        <FormControl>
          <FormLabel>Project</FormLabel>
          <Select 
            value={projectId || ''} 
            onChange={(e) => setProjectId(e.target.value || null)}
          >
            <option value="">No Project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>Due Date</FormLabel>
          <Input
            type="date"
            value={dueDate ? dueDate.substring(0, 10) : ''}
            onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : null)}
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>Tags</FormLabel>
          <Flex align="center" mb={2}>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add a tag"
              mr={2}
            />
            <Button onClick={addTag} isDisabled={!tagInput.trim()}>
              Add
            </Button>
          </Flex>
          
          {tags.length > 0 && (
            <HStack spacing={2} mt={2} flexWrap="wrap">
              {tags.map(tag => (
                <Tag key={tag} size="md" borderRadius="full" variant="solid" colorScheme="blue">
                  <TagLabel>{tag}</TagLabel>
                  <TagCloseButton onClick={() => removeTag(tag)} />
                </Tag>
              ))}
            </HStack>
          )}
          
          <FormHelperText>
            Press Enter to add a tag after typing
          </FormHelperText>
        </FormControl>
        
        <FormControl>
          <FormLabel>Notes</FormLabel>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes"
            rows={3}
          />
        </FormControl>
        
        <Flex justify="flex-end" mt={6} gap={3}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            colorScheme="blue" 
            isLoading={isLoading}
          >
            {initialData?.id ? 'Update Task' : 'Create Task'}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};

export default TaskForm; 