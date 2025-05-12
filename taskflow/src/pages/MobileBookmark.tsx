import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Input,
  Button,
  Heading,
  Text,
  useToast,
  Container,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  useColorModeValue,
  IconButton,
  HStack,
  Fade,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton
} from '@chakra-ui/react';
import { FiLink, FiSave, FiX, FiCheck } from 'react-icons/fi';
import axios from 'axios';

// Set your CloudFlare Tunnel URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bookmarks.twoja-domena.com/api';

const MobileBookmark: React.FC = () => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  useEffect(() => {
    // Check if page was opened with share intent
    const urlParams = new URLSearchParams(window.location.search);
    const sharedUrl = urlParams.get('url') || urlParams.get('text');
    const sharedTitle = urlParams.get('title');
    
    if (sharedUrl) {
      setUrl(sharedUrl);
      if (sharedTitle) {
        setTitle(sharedTitle);
      }
    }
    
    // Check if this is an Android Intent share
    if (window.location.pathname === '/share') {
      const text = urlParams.get('android.intent.extra.TEXT');
      const subject = urlParams.get('android.intent.extra.SUBJECT');
      
      if (text) {
        // Extract URL from text
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = text.match(urlRegex);
        if (urls && urls.length > 0) {
          setUrl(urls[0]);
        } else {
          setUrl(text);
        }
      }
      
      if (subject) {
        setTitle(subject);
      }
    }
  }, []);
  
  const handleSave = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/bookmarks/quick`, {
        url: url.trim(),
        title: title.trim() || undefined,
        source: 'android-web'
      });
      
      if (response.data.success) {
        setShowSuccess(true);
        toast({
          title: 'Bookmark saved!',
          description: `"${response.data.bookmark.title}" has been analyzed and saved.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Reset form
        setTimeout(() => {
          setUrl('');
          setTitle('');
          setShowSuccess(false);
          
          // Try to close tab on Android
          if (window.history.length > 1) {
            window.history.back();
          } else {
            // Or try to close window
            window.close();
          }
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error saving bookmark:', err);
      
      let errorMessage = 'Failed to save bookmark';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearForm = () => {
    setUrl('');
    setTitle('');
    setError(null);
  };
  
  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="md" py={8}>
        <VStack spacing={6} align="stretch">
          <Heading textAlign="center" color="blue.500">
            Quick Save Bookmark
          </Heading>
          
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
              <CloseButton 
                position="absolute" 
                right="8px" 
                top="8px" 
                onClick={() => setError(null)}
              />
            </Alert>
          )}
          
          <Fade in={showSuccess}>
            {showSuccess && (
              <Alert status="success" borderRadius="md">
                <AlertIcon as={FiCheck} />
                <Box>
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>
                    Your bookmark has been saved and analyzed.
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </Fade>
          
          <FormControl>
            <FormLabel>URL</FormLabel>
            <InputGroup size="lg">
              <InputLeftElement>
                <FiLink />
              </InputLeftElement>
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                bg={bgColor}
                borderColor={borderColor}
                _focus={{ borderColor: 'blue.500' }}
              />
            </InputGroup>
          </FormControl>
          
          <FormControl>
            <FormLabel>Title (optional)</FormLabel>
            <Input
              size="lg"
              placeholder="Enter a title or leave empty for auto-detection"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              bg={bgColor}
              borderColor={borderColor}
              _focus={{ borderColor: 'blue.500' }}
            />
          </FormControl>
          
          <HStack spacing={4}>
            <Button
              size="lg"
              colorScheme="blue"
              leftIcon={<FiSave />}
              onClick={handleSave}
              isLoading={isLoading}
              loadingText="Saving..."
              flex="1"
            >
              Save Bookmark
            </Button>
            <IconButton
              aria-label="Clear form"
              icon={<FiX />}
              size="lg"
              variant="outline"
              onClick={clearForm}
            />
          </HStack>
          
          {isLoading && (
            <Box>
              <Progress size="xs" isIndeterminate colorScheme="blue" />
              <Text textAlign="center" fontSize="sm" mt={2} color="gray.500">
                Analyzing your bookmark with AI...
              </Text>
            </Box>
          )}
          
          <Text textAlign="center" fontSize="sm" color="gray.500" mt={4}>
            Share any link from your browser or app to quickly save and analyze it.
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default MobileBookmark; 