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
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import ProjectList from '../components/features/projects/ProjectList';
import ProjectForm from '../components/features/projects/ProjectForm';
import { useProjectContext } from '../contexts/ProjectContext';
import type { Project } from '../models/Project';

const ProjectsPage = () => {
  const { projects, addProject, updateProject, deleteProject } = useProjectContext();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Project being edited
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Handle project edit
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    onOpen();
  };
  
  // Handle project creation
  const handleAddProject = () => {
    setEditingProject(null);
    onOpen();
  };
  
  // Handle form submission
  const handleSubmit = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProject) {
      await updateProject(editingProject.id, projectData);
    } else {
      await addProject(projectData);
    }
    onClose();
  };
  
  // Filter projects by search query
  const filteredProjects = projects.filter(project => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query)
    );
  });
  
  return (
    <Layout>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Projects</Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleAddProject}
          >
            New Project
          </Button>
        </Flex>
        
        {/* Search */}
        <Box mb={6}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Box>
        
        {/* Project list */}
        <ProjectList
          projects={filteredProjects}
          onEditProject={handleEditProject}
          onDeleteProject={deleteProject}
        />
      </Box>
      
      {/* Project form modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <ProjectForm
              initialData={editingProject || undefined}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default ProjectsPage; 