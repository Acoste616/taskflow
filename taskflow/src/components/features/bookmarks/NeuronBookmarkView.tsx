import React from 'react';
import { Box, Heading, Text, VStack, useToast } from '@chakra-ui/react';
import NeuralBookmarkVisualization from './NeuralBookmarkVisualization';
import { useBookmarkContext } from '../../../contexts/BookmarkContext';

const NeuronBookmarkView = () => {
  const { bookmarks, isLoading } = useBookmarkContext();
  const toast = useToast();
  
  const handleOpenBookmark = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    toast({
      title: 'Opening bookmark',
      status: 'info',
      duration: 2000,
    });
  };

  return (
    <VStack spacing={6} align="stretch" w="full">
      <Box>
        <Heading size="lg" mb={2}>Neural Network View</Heading>
        <Text color="gray.500">
          Explore your bookmarks in an interactive neural network visualization. 
          Click on nodes to zoom in, hover to see details, and use the controls to navigate.
        </Text>
      </Box>
      
      <Box 
        borderWidth="1px" 
        borderRadius="lg" 
        overflow="hidden"
        boxShadow="lg"
        bg="white"
        _dark={{ bg: 'gray.800' }}
      >
        <NeuralBookmarkVisualization 
          bookmarks={bookmarks}
          onOpenBookmark={handleOpenBookmark}
          isLoading={isLoading}
        />
      </Box>
    </VStack>
  );
};

export default NeuronBookmarkView; 