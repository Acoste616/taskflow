import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Divider,
  useToast,
  Card,
  CardHeader,
  CardBody,
  FormControl,
  FormLabel,
  Switch,
  useColorMode,
} from '@chakra-ui/react';
import { FiDownload, FiUpload, FiTrash2, FiMoon, FiSun } from 'react-icons/fi';
import React, { useRef, useState } from 'react';
import Layout from '../components/layout/Layout';
import * as exportService from '../services/exportService';
import * as storageService from '../services/storageService';

const SettingsPage = () => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { colorMode, toggleColorMode } = useColorMode();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  // Handle export data
  const handleExportData = () => {
    try {
      exportService.exportData();
      toast({
        title: 'Export successful',
        description: 'Your data has been exported to a JSON file.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle import data
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (!exportService.validateImportFile(file)) {
      toast({
        title: 'Invalid file',
        description: 'Please select a valid TaskFlow JSON backup file.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const success = await exportService.importData(file);
      if (success) {
        toast({
          title: 'Import successful',
          description: 'Your data has been imported successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Reload the page to reflect the new data
        window.location.reload();
      } else {
        throw new Error('Import failed');
      }
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'There was an error importing your data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle clear data
  const handleClearData = () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    
    try {
      storageService.clearData();
      toast({
        title: 'Data cleared',
        description: 'All your data has been deleted.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      setIsConfirmingDelete(false);
      
      // Reload the page to reflect the cleared data
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Clear failed',
        description: 'There was an error clearing your data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsConfirmingDelete(false);
    }
  };
  
  return (
    <Layout>
      <Box mb={8}>
        <Heading size="lg" mb={6}>Settings</Heading>
        
        <VStack spacing={6} align="stretch">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <Heading size="md">Appearance</Heading>
            </CardHeader>
            <CardBody>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">
                  Dark Mode {colorMode === 'dark' ? <FiMoon /> : <FiSun />}
                </FormLabel>
                <Switch
                  isChecked={colorMode === 'dark'}
                  onChange={toggleColorMode}
                />
              </FormControl>
            </CardBody>
          </Card>
          
          {/* Data Management */}
          <Card>
            <CardHeader>
              <Heading size="md">Data Management</Heading>
            </CardHeader>
            <CardBody>
              <Text mb={4}>
                TaskFlow stores all your data locally in your browser. You can export your data for backup or import previously exported data.
              </Text>
              
              <VStack spacing={4} align="stretch">
                <Box>
                  <Button
                    leftIcon={<FiDownload />}
                    onClick={handleExportData}
                    colorScheme="blue"
                    width={{ base: 'full', md: 'auto' }}
                  >
                    Export Data
                  </Button>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Save a backup of all your tasks and projects
                  </Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <Button
                    leftIcon={<FiUpload />}
                    onClick={handleImportClick}
                    colorScheme="green"
                    width={{ base: 'full', md: 'auto' }}
                  >
                    Import Data
                  </Button>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Restore from a previous backup (will replace current data)
                  </Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <Button
                    leftIcon={<FiTrash2 />}
                    onClick={handleClearData}
                    colorScheme="red"
                    width={{ base: 'full', md: 'auto' }}
                  >
                    {isConfirmingDelete ? 'Confirm Delete' : 'Clear All Data'}
                  </Button>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {isConfirmingDelete
                      ? 'This will permanently delete all your data. Click again to confirm.'
                      : 'Delete all tasks, projects, and settings (cannot be undone)'}
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
          
          {/* About */}
          <Card>
            <CardHeader>
              <Heading size="md">About TaskFlow</Heading>
            </CardHeader>
            <CardBody>
              <Text>
                TaskFlow is a personal project management application designed to help you track your tasks, projects, and time spent.
              </Text>
              <Text mt={2}>
                Version 1.0.0
              </Text>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </Layout>
  );
};

export default SettingsPage; 