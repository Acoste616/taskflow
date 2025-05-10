import { Box, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, FormControl, FormLabel, HStack, IconButton, Input, Select, Stack, Switch, Tag, TagCloseButton, TagLabel, Text, Textarea, VStack, useToast } from '@chakra-ui/react';
import { FiFolder, FiLink, FiPlus, FiStar, FiTag, FiX } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { BookmarkCaptureService } from '../../../services/bookmarkCaptureService';
import { BookmarkCategorizer } from '../../../services/bookmarkCategorizer';
import type { NewBookmark } from '../../../models/Bookmark';

interface QuickBookmarkProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmark: NewBookmark) => void;
  folders?: string[];
}

export const QuickBookmark: React.FC<QuickBookmarkProps> = ({
  isOpen,
  onClose,
  onSave,
  folders = []
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [bookmark, setBookmark] = useState<NewBookmark>({
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
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      captureCurrentPage();
    }
  }, [isOpen]);

  const captureCurrentPage = async () => {
    setIsLoading(true);
    try {
      const capturedData = await BookmarkCaptureService.captureCurrentPage();
      setBookmark(capturedData);
    } catch (error) {
      toast({
        title: 'Error capturing page',
        description: 'Could not capture the current page. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof NewBookmark, value: string | boolean | string[]) => {
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

  const handleSave = () => {
    onSave(bookmark);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Quick Bookmark</DrawerHeader>

        <DrawerBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>URL</FormLabel>
              <Input
                value={bookmark.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="Enter URL"
              />
            </FormControl>

            <FormControl>
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
              <HStack mt={2} wrap="wrap">
                {bookmark.tags.map((tag) => (
                  <Tag key={tag} size="md" borderRadius="full" variant="solid" colorScheme="blue">
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
          </VStack>
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave}>
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}; 