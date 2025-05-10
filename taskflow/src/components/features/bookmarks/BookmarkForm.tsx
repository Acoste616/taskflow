import React, { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Flex,
  FormErrorMessage,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  FormHelperText,
  Select,
  Switch,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { FiLink, FiFolder, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';
import type { Bookmark } from '../../../models/Bookmark';

interface BookmarkFormProps {
  initialData?: Partial<Bookmark>;
  folders?: string[];
  onSubmit: (bookmarkData: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  title?: string;
  url?: string;
  description?: string;
  tags?: string;
}

const BookmarkForm: React.FC<BookmarkFormProps> = ({
  initialData,
  folders = [],
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const toast = useToast();
  const inputBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [folder, setFolder] = useState<string | null>(initialData?.folder || null);
  const [isFavorite, setIsFavorite] = useState(initialData?.isFavorite || false);
  const [favicon, setFavicon] = useState<string | null>(initialData?.favicon || null);
  const [isUrlValid, setIsUrlValid] = useState<boolean>(true);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState<boolean>(false);
  
  // Tag input state
  const [tagInput, setTagInput] = useState('');
  
  // Validation
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate URL format
  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  // Fetch metadata from URL
  const fetchMetadata = async (urlString: string) => {
    if (!validateUrl(urlString)) return;

    setIsFetchingMetadata(true);
    try {
      // Try to fetch favicon
      const urlObj = new URL(urlString);
      const faviconUrl = `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
      
      // Check if favicon exists
      const faviconResponse = await fetch(faviconUrl, { method: 'HEAD' });
      if (faviconResponse.ok) {
        setFavicon(faviconUrl);
      }

      // If no title is set, use domain as default
      if (!title) {
        setTitle(urlObj.hostname.replace('www.', ''));
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setIsFetchingMetadata(false);
    }
  };
  
  // Handle URL changes
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setIsUrlValid(validateUrl(newUrl));
    setTouched({ ...touched, url: true });
  };

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
    
    if (!url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!validateUrl(url)) {
      newErrors.url = 'Please enter a valid URL';
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
    
    // Create bookmark data object
    const bookmarkData: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'> = {
      title,
      url,
      description,
      tags,
      folder,
      isFavorite,
      favicon,
      isArchived: false
    };
    
    try {
      await onSubmit(bookmarkData);
      toast({
        title: initialData?.id ? 'Bookmark updated' : 'Bookmark created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save bookmark',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle adding a tag
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      if (tags.length >= 10) {
        toast({
          title: 'Too many tags',
          description: 'You can add up to 10 tags per bookmark',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      setTags([...tags, trimmedTag]);
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
  
  // Create new folder option
  const [newFolder, setNewFolder] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  
  const handleAddFolder = () => {
    if (newFolder.trim()) {
      setFolder(newFolder.trim());
      setNewFolder('');
      setIsAddingFolder(false);
    }
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <FormControl 
          isRequired 
          isInvalid={touched.url && !!errors.url}
        >
          <FormLabel>URL</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FiLink color="gray.300" />
            </InputLeftElement>
            <Input
              value={url}
              onChange={handleUrlChange}
              onBlur={() => {
                setTouched({ ...touched, url: true });
                if (url && validateUrl(url)) {
                  fetchMetadata(url);
                }
              }}
              placeholder="https://example.com"
              type="url"
              bg={inputBg}
              borderColor={borderColor}
            />
            <InputRightElement>
              {url && (
                <Tooltip label={isUrlValid ? "Valid URL" : "Invalid URL"}>
                  <Box>
                    {isUrlValid ? (
                      <FiCheck color="green.500" />
                    ) : (
                      <FiX color="red.500" />
                    )}
                  </Box>
                </Tooltip>
              )}
            </InputRightElement>
          </InputGroup>
          {errors.url && <FormErrorMessage>{errors.url}</FormErrorMessage>}
          <FormHelperText>
            Enter a valid URL to automatically fetch metadata
          </FormHelperText>
        </FormControl>
        
        <FormControl 
          isRequired 
          isInvalid={touched.title && !!errors.title}
        >
          <FormLabel>Title</FormLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched({ ...touched, title: true })}
            placeholder="Bookmark title"
            bg={inputBg}
            borderColor={borderColor}
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
            placeholder="Add a description or notes about this bookmark"
            rows={3}
            bg={inputBg}
            borderColor={borderColor}
          />
          {errors.description && <FormErrorMessage>{errors.description}</FormErrorMessage>}
          <FormHelperText>
            {description.length}/500 characters
          </FormHelperText>
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
              bg={inputBg}
              borderColor={borderColor}
            />
            <Button 
              onClick={addTag} 
              isDisabled={!tagInput.trim()}
              leftIcon={<FiCheck />}
            >
              Add
            </Button>
          </Flex>
          
          {tags.length > 0 && (
            <HStack spacing={2} mt={2} flexWrap="wrap">
              {tags.map(tag => (
                <Tag 
                  key={tag} 
                  size="md" 
                  borderRadius="full" 
                  variant="solid" 
                  colorScheme="blue"
                >
                  <TagLabel>{tag}</TagLabel>
                  <TagCloseButton onClick={() => removeTag(tag)} />
                </Tag>
              ))}
            </HStack>
          )}
          
          <FormHelperText>
            Press Enter to add a tag. Maximum 10 tags per bookmark.
          </FormHelperText>
        </FormControl>
        
        <FormControl>
          <FormLabel>Folder</FormLabel>
          {isAddingFolder ? (
            <Flex>
              <Input
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                placeholder="New folder name"
                mr={2}
                bg={inputBg}
                borderColor={borderColor}
              />
              <Button 
                onClick={handleAddFolder}
                leftIcon={<FiCheck />}
              >
                Add
              </Button>
              <Button 
                ml={2} 
                variant="ghost" 
                onClick={() => setIsAddingFolder(false)}
                leftIcon={<FiX />}
              >
                Cancel
              </Button>
            </Flex>
          ) : (
            <Flex>
              <Select 
                value={folder || ''} 
                onChange={(e) => setFolder(e.target.value || null)}
                placeholder="Select a folder"
                mr={2}
                bg={inputBg}
                borderColor={borderColor}
              >
                <option value="">Root (No Folder)</option>
                {folders.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
              <Button 
                onClick={() => setIsAddingFolder(true)}
                leftIcon={<FiFolder />}
              >
                New Folder
              </Button>
            </Flex>
          )}
        </FormControl>
        
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Add to Favorites</FormLabel>
          <Switch
            isChecked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
            colorScheme="yellow"
          />
        </FormControl>
        
        <Flex justify="flex-end" mt={6} gap={3}>
          <Button 
            variant="ghost" 
            onClick={onCancel}
            leftIcon={<FiX />}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            colorScheme="blue" 
            isLoading={isLoading || isFetchingMetadata}
            leftIcon={<FiCheck />}
          >
            {initialData?.id ? 'Update Bookmark' : 'Save Bookmark'}
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};

export default BookmarkForm; 