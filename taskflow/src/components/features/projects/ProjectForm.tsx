import { 
  Box, 
  Stack, 
  FormControl, 
  FormLabel, 
  Input, 
  Textarea, 
  Button, 
  FormErrorMessage, 
  Flex,
  useToast,
  FormHelperText,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import type { Project } from '../../../models/Project';

interface ProjectFormProps {
  initialData?: Partial<Project>;
  onSubmit: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  color?: string;
}

const ProjectForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProjectFormProps) => {
  const toast = useToast();
  
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || '#3182CE'); // Default to blue
  const [isActive, setIsActive] = useState(initialData?.isActive !== false); // Default to active
  
  // Validation
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: FormErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (name.length > 50) {
      newErrors.name = 'Project name must be less than 50 characters';
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
    
    // Create project data object
    const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      description,
      color,
      isActive,
    };
    
    try {
      await onSubmit(projectData);
      toast({
        title: initialData?.id ? 'Project updated' : 'Project created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save project',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <FormControl 
          isRequired 
          isInvalid={touched.name && !!errors.name}
        >
          <FormLabel>Project Name</FormLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched({ ...touched, name: true })}
            placeholder="Project name"
          />
          {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
        </FormControl>
        
        <FormControl 
          isInvalid={touched.description && !!errors.description}
        >
          <FormLabel>Description</FormLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setTouched({ ...touched, description: true })}
            placeholder="Project description"
            rows={3}
          />
          {errors.description && <FormErrorMessage>{errors.description}</FormErrorMessage>}
        </FormControl>
        
        <FormControl>
          <FormLabel>Color</FormLabel>
          <Flex alignItems="center">
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              width="80px"
              p={1}
              mr={3}
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#HEX color"
              maxWidth="200px"
            />
          </Flex>
          <FormHelperText>Choose a color to represent this project</FormHelperText>
        </FormControl>
        
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Active Project</FormLabel>
          <Input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <FormHelperText ml={2}>Inactive projects won't appear in task selectors</FormHelperText>
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
            {initialData?.id ? 'Update Project' : 'Create Project'}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};

export default ProjectForm; 