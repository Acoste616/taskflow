import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  Select,
  Tag,
  TagLabel,
  TagCloseButton,
  IconButton,
  Switch,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { FiPlus, FiX } from 'react-icons/fi';
import type { Bookmark } from '../../../models/Bookmark';
import { BookmarkCategorizer } from '../../../services/bookmarkCategorizer';

interface EnhancedBookmarkFormProps {
  initialData?: Bookmark;
  folders: string[];
  onSubmit: (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EnhancedBookmarkForm: React.FC<EnhancedBookmarkFormProps> = ({
  initialData,
  folders,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [bookmark, setBookmark] = useState<Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>>({
    url: '',
    title: '',
    description: '',
    folder: '',
    tags: [],
    isFavorite: false,
    favicon: '',
    isArchived: false
  });
  const [newTag, setNewTag] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (initialData) {
      setBookmark({
        url: initialData.url,
        title: initialData.title,
        description: initialData.description || '',
        folder: initialData.folder || '',
        tags: initialData.tags,
        isFavorite: initialData.isFavorite,
        favicon: initialData.favicon || '',
        isArchived: initialData.isArchived
      });
    }
  }, [initialData]);

  useEffect(() => {
    // Get suggested tags based on content
    const content = `${bookmark.title} ${bookmark.description} ${bookmark.url}`;
    const suggestions = BookmarkCategorizer.getSuggestedTags(content);
    setSuggestedTags(suggestions.filter(tag => !bookmark.tags.includes(tag)));
  }, [bookmark.title, bookmark.description, bookmark.url, bookmark.tags]);

  const handleInputChange = (field: keyof typeof bookmark, value: string | boolean | string[]) => {
    setBookmark(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTag && !bookmark.tags.includes(newTag)) {
      handleInputChange('tags', [...bookmark.tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', bookmark.tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddFolder = () => {
    if (newFolder && !folders.includes(newFolder)) {
      folders.push(newFolder);
      setNewFolder('');
    }
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!bookmark.tags.includes(tag)) {
      handleInputChange('tags', [...bookmark.tags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Apply final categorization before saving
      const categorizedBookmark = BookmarkCategorizer.categorize(bookmark);
      await onSubmit(categorizedBookmark);
    } catch (error) {
      toast({
        title: 'Error saving bookmark',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>URL</FormLabel>
          <Input
            value={bookmark.url}
            onChange={(e) => handleInputChange('url', e.target.value)}
            placeholder="Enter URL"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Title</FormLabel>
          <Input
            value={bookmark.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter title"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea
            value={bookmark.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter description"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Folder</FormLabel>
          <HStack>
            <Select
              value={bookmark.folder}
              onChange={(e) => handleInputChange('folder', e.target.value)}
            >
              <option value="">No Folder</option>
              {folders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </Select>
            <Input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="New folder"
            />
            <IconButton
              aria-label="Add folder"
              icon={<FiPlus />}
              onClick={handleAddFolder}
            />
          </HStack>
        </FormControl>

        <FormControl>
          <FormLabel>Tags</FormLabel>
          <HStack>
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <IconButton
              aria-label="Add tag"
              icon={<FiPlus />}
              onClick={handleAddTag}
            />
          </HStack>

          {/* Suggested tags */}
          {suggestedTags.length > 0 && (
            <Box mt={2}>
              <FormLabel fontSize="sm" color="gray.500">Suggested tags:</FormLabel>
              <HStack wrap="wrap" spacing={2}>
                {suggestedTags.map((tag) => (
                  <Tag
                    key={tag}
                    size="sm"
                    borderRadius="full"
                    variant="outline"
                    cursor="pointer"
                    onClick={() => handleAddSuggestedTag(tag)}
                  >
                    <TagLabel>{tag}</TagLabel>
                    <FiPlus size={12} />
                  </Tag>
                ))}
              </HStack>
            </Box>
          )}

          {/* Current tags */}
          <HStack mt={2} wrap="wrap" spacing={2}>
            {bookmark.tags.map((tag) => (
              <Tag
                key={tag}
                size="md"
                borderRadius="full"
                variant="solid"
                colorScheme="blue"
              >
                <TagLabel>{tag}</TagLabel>
                <TagCloseButton onClick={() => handleRemoveTag(tag)} />
              </Tag>
            ))}
          </HStack>
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Favorite</FormLabel>
          <Switch
            isChecked={bookmark.isFavorite}
            onChange={(e) => handleInputChange('isFavorite', e.target.checked)}
          />
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Archive</FormLabel>
          <Switch
            isChecked={bookmark.isArchived}
            onChange={(e) => handleInputChange('isArchived', e.target.checked)}
          />
        </FormControl>

        <HStack justify="flex-end" spacing={3} mt={4}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isLoading}
            loadingText="Saving..."
          >
            Save
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default EnhancedBookmarkForm; 