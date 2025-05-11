import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Link,
  HStack,
  Image,
  useColorModeValue,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  Button
} from '@chakra-ui/react';
import { 
  FiMoreVertical, 
  FiEdit, 
  FiTrash2, 
  FiStar, 
  FiArchive, 
  FiExternalLink, 
  FiDownload,
  FiFolder,
  FiActivity
} from 'react-icons/fi';
import Card from '../../common/Card';
import type { Bookmark } from '../../../models/Bookmark';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onArchive: (id: string) => void;
  onViewAnalysis?: (bookmark: Bookmark) => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  onEdit,
  onDelete,
  onToggleFavorite,
  onArchive,
  onViewAnalysis
}) => {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgHover = useColorModeValue('gray.50', 'gray.700');
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuHoverBg = useColorModeValue('gray.100', 'gray.700');

  // Parse domain from URL for display
  const getDomain = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.replace('www.', '');
    } catch (e) {
      return url;
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(bookmark.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = bookmark.title;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading bookmark:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(bookmark.id);
      toast({
        title: 'Bookmark deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting bookmark',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  return (
    <>
      <Card
        mb={4}
        _hover={{ bg: bgHover }}
        transition="all 0.2s"
        borderLeft={bookmark.isFavorite ? '4px solid' : ''}
        borderColor={bookmark.isFavorite ? 'yellow.400' : ''}
      >
        <Flex justify="space-between" align="flex-start">
          <Flex flex="1">
            {bookmark.favicon && (
              <Box mr={3} mt={1}>
                <Image 
                  src={bookmark.favicon} 
                  alt={`${bookmark.title} favicon`} 
                  boxSize="20px"
                  fallbackSrc="https://via.placeholder.com/20"
                  borderRadius="sm"
                />
              </Box>
            )}
            <Box flex="1">
              <Link 
                href={bookmark.url} 
                isExternal 
                fontWeight="semibold" 
                fontSize="md"
                display="block"
                mb={1}
              >
                {bookmark.title} <FiExternalLink style={{ display: 'inline', marginLeft: '5px' }} />
              </Link>
              
              <Text fontSize="sm" color="gray.500" mb={2}>
                {getDomain(bookmark.url)}
              </Text>
              
              {bookmark.description && (
                <Text fontSize="sm" color="gray.600" mb={3} noOfLines={2} _dark={{ color: 'gray.300' }}>
                  {bookmark.description}
                </Text>
              )}
              
              {bookmark.tags.length > 0 && (
                <HStack spacing={2} mt={2} flexWrap="wrap">
                  {bookmark.tags.map(tag => (
                    <Badge key={tag} colorScheme="blue" variant="subtle" fontSize="xs">
                      {tag}
                    </Badge>
                  ))}
                </HStack>
              )}

              {bookmark.folder && (
                <HStack mt={2} spacing={1}>
                  <FiFolder size={14} />
                  <Text fontSize="xs" color="gray.500">
                    {bookmark.folder}
                  </Text>
                </HStack>
              )}
            </Box>
          </Flex>

          <Menu>
            <Tooltip label="More actions" placement="top">
              <MenuButton
                as={IconButton}
                icon={<FiMoreVertical />}
                variant="ghost"
                size="sm"
                aria-label="More actions"
              />
            </Tooltip>
            <MenuList bg={menuBg}>
              <MenuItem 
                icon={<FiStar />} 
                onClick={() => onToggleFavorite(bookmark.id)}
                _hover={{ bg: menuHoverBg }}
              >
                {bookmark.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              </MenuItem>
              <MenuItem 
                icon={<FiEdit />} 
                onClick={() => onEdit(bookmark)}
                _hover={{ bg: menuHoverBg }}
              >
                Edit
              </MenuItem>
              <MenuItem 
                icon={<FiArchive />} 
                onClick={() => onArchive(bookmark.id)}
                _hover={{ bg: menuHoverBg }}
              >
                {bookmark.isArchived ? 'Unarchive' : 'Archive'}
              </MenuItem>
              {onViewAnalysis && (
                <MenuItem 
                  icon={<FiActivity />} 
                  onClick={() => onViewAnalysis(bookmark)}
                  _hover={{ bg: menuHoverBg }}
                >
                  View Analysis
                </MenuItem>
              )}
              <MenuItem 
                icon={<FiDownload />} 
                onClick={handleDownload}
                _hover={{ bg: menuHoverBg }}
              >
                Download
              </MenuItem>
              <MenuItem 
                icon={<FiTrash2 />} 
                onClick={() => setIsDeleteAlertOpen(true)}
                color="red.500"
                _hover={{ bg: menuHoverBg }}
              >
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Card>

      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteAlertOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Bookmark
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{bookmark.title}"? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteAlertOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default BookmarkCard; 