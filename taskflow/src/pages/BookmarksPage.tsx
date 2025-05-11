import React, { useState, useEffect, useMemo } from 'react';
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Divider,
  HStack,
  Tag,
  TagLabel,
  Select,
  useColorModeValue,
  Tooltip,
  Badge,
  Collapse,
  Text,
  useToast,
  Fade,
  ScaleFade,
  InputRightElement
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiX, 
  FiStar, 
  FiArchive, 
  FiFolder, 
  FiTag, 
  FiChevronDown,
  FiRefreshCw,
  FiInfo,
  FiLink,
  FiZap
} from 'react-icons/fi';
import Layout from '../components/layout/Layout';
import BookmarkList from '../components/features/bookmarks/BookmarkList';
import BookmarkForm from '../components/features/bookmarks/BookmarkForm';
import { useBookmarkContext } from '../contexts/BookmarkContext';
import type { Bookmark } from '../models/Bookmark';
import BookmarkImporter from '../components/features/bookmarks/BookmarkImporter';
import BookmarkCaptureService from '../services/bookmarkCaptureService';
import NeuronBookmarkView from '../components/features/bookmarks/NeuronBookmarkView';
import BookmarkDetailWithAnalysis from '../components/features/bookmarks/BookmarkDetailWithAnalysis';

const BookmarksPage: React.FC = () => {
  const {
    bookmarks,
    favoriteBookmarks,
    archivedBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    toggleFavorite,
    archiveBookmark,
    isLoading,
    error
  } = useBookmarkContext();
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // State for editing bookmark
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  
  // State for viewing analysis
  const [selectedBookmarkForAnalysis, setSelectedBookmarkForAnalysis] = useState<Bookmark | null>(null);
  
  // Get unique folders and tags
  const { folders, allTags } = useMemo(() => {
    const uniqueFolders = new Set<string>();
    const uniqueTags = new Set<string>();
    
    bookmarks.forEach(bookmark => {
      if (bookmark.folder) uniqueFolders.add(bookmark.folder);
      bookmark.tags.forEach(tag => uniqueTags.add(tag));
    });
    
    return {
      folders: Array.from(uniqueFolders).sort(),
      allTags: Array.from(uniqueTags).sort()
    };
  }, [bookmarks]);
  
  // Filter bookmarks
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bookmark => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        bookmark.title.toLowerCase().includes(searchLower) || 
        bookmark.description?.toLowerCase().includes(searchLower) ||
        bookmark.url.toLowerCase().includes(searchLower) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      const matchesFolder = folderFilter === null || bookmark.folder === folderFilter;
      const matchesTag = tagFilter === null || bookmark.tags.includes(tagFilter);
      
      return matchesSearch && matchesFolder && matchesTag;
    });
  }, [bookmarks, searchQuery, folderFilter, tagFilter]);
  
  // Open form for creating a new bookmark
  const handleAddBookmark = () => {
    setEditingBookmark(null);
    onOpen();
  };
  
  // Open form for editing a bookmark
  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    onOpen();
  };
  
  // Handle form submission
  const handleSubmit = async (bookmarkData: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingBookmark) {
        await updateBookmark(editingBookmark.id, bookmarkData);
        toast({
          title: 'Bookmark updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await addBookmark(bookmarkData);
        toast({
          title: 'Bookmark added',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
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
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFolderFilter(null);
    setTagFilter(null);
    setShowFilters(false);
  };
  
  // Handle bookmark deletion
  const handleDeleteBookmark = async (id: string) => {
    try {
      await deleteBookmark(id);
      toast({
        title: 'Bookmark deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete bookmark',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle imported bookmarks
  const handleImportBookmarks = async (importedBookmarks: Bookmark[]) => {
    try {
      // Add each imported bookmark
      for (const bookmark of importedBookmarks) {
        const { id, createdAt, updatedAt, ...newBookmark } = bookmark;
        await addBookmark({
          ...newBookmark,
          isArchived: newBookmark.isArchived ?? false,
          isFavorite: newBookmark.isFavorite ?? false,
          tags: newBookmark.tags ?? [],
          description: newBookmark.description ?? '',
          favicon: newBookmark.favicon ?? '',
          folder: newBookmark.folder ?? '',
        });
      }
      
      toast({
        title: 'Import successful',
        description: `Successfully imported ${importedBookmarks.length} bookmarks`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Failed to import bookmarks',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle capturing current page
  const handleCaptureCurrentPage = async () => {
    try {
      const bookmarkData = await BookmarkCaptureService.captureCurrentPage();
      await addBookmark(bookmarkData);
      
      toast({
        title: 'Page captured',
        description: 'Successfully added the current page to bookmarks',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Capture failed',
        description: err instanceof Error ? err.message : 'Failed to capture the current page',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle capturing from URL
  const [urlInput, setUrlInput] = useState('');
  const handleCaptureFromUrl = async () => {
    if (!urlInput.trim()) return;

    try {
      const bookmarkData = await BookmarkCaptureService.captureFromUrl(urlInput);
      await addBookmark(bookmarkData);
      setUrlInput('');
      
      toast({
        title: 'URL captured',
        description: 'Successfully added the URL to bookmarks',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Capture failed',
        description: err instanceof Error ? err.message : 'Failed to capture the URL',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle viewing bookmark analysis
  const handleViewAnalysis = (bookmark: Bookmark) => {
    setSelectedBookmarkForAnalysis(bookmark);
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Layout>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Bookmarks</Heading>
          <HStack spacing={4}>
            <BookmarkImporter onImport={handleImportBookmarks} />
            <Button
              leftIcon={<FiLink />}
              colorScheme="green"
              onClick={handleCaptureCurrentPage}
              isLoading={isLoading}
            >
              Capture Current Page
            </Button>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={handleAddBookmark}
              isLoading={isLoading}
            >
              New Bookmark
            </Button>
          </HStack>
        </Flex>
        
        {/* URL capture input */}
        <Box mb={6}>
          <InputGroup>
            <Input
              placeholder="Enter URL to capture..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCaptureFromUrl()}
            />
            <InputRightElement width="4.5rem">
              <Button
                h="1.75rem"
                size="sm"
                onClick={handleCaptureFromUrl}
                isDisabled={!urlInput.trim() || isLoading}
              >
                Capture
              </Button>
            </InputRightElement>
          </InputGroup>
        </Box>
        
        {/* Search and filters */}
        <Box 
          mb={6} 
          p={4} 
          bg={bgColor} 
          borderRadius="md" 
          borderWidth="1px"
          borderColor={borderColor}
          transition="all 0.2s"
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={4}
            align={{ base: 'stretch', md: 'center' }}
          >
            <InputGroup flex="1">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            
            <HStack spacing={3}>
              <Tooltip label="Toggle filters">
                <IconButton
                  icon={<FiFilter />}
                  aria-label="Toggle filters"
                  variant={showFilters ? 'solid' : 'outline'}
                  onClick={() => setShowFilters(!showFilters)}
                />
              </Tooltip>
              
              {(searchQuery || folderFilter !== null || tagFilter !== null) && (
                <Tooltip label="Clear filters">
                  <IconButton
                    icon={<FiX />}
                    aria-label="Clear filters"
                    variant="ghost"
                    onClick={clearFilters}
                  />
                </Tooltip>
              )}
            </HStack>
          </Flex>
          
          <Collapse in={showFilters}>
            <Box mt={4} pt={4} borderTopWidth="1px" borderColor={borderColor}>
              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={4}
                align={{ base: 'stretch', md: 'center' }}
              >
                <Menu>
                  <MenuButton 
                    as={Button} 
                    rightIcon={<FiChevronDown />} 
                    leftIcon={<FiFolder />} 
                    variant="outline"
                    flex="1"
                  >
                    {folderFilter || 'All Folders'}
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => setFolderFilter(null)}>All Folders</MenuItem>
                    <MenuItem onClick={() => setFolderFilter('')}>Root (No Folder)</MenuItem>
                    <Divider />
                    {folders.map(folder => (
                      <MenuItem key={folder} onClick={() => setFolderFilter(folder)}>
                        {folder}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
                
                <Menu>
                  <MenuButton 
                    as={Button} 
                    rightIcon={<FiChevronDown />} 
                    leftIcon={<FiTag />} 
                    variant="outline"
                    flex="1"
                  >
                    {tagFilter || 'All Tags'}
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => setTagFilter(null)}>All Tags</MenuItem>
                    <Divider />
                    {allTags.map(tag => (
                      <MenuItem key={tag} onClick={() => setTagFilter(tag)}>
                        {tag}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </Flex>
            </Box>
          </Collapse>
        </Box>
        
        {/* Active filters display */}
        {(searchQuery || folderFilter !== null || tagFilter !== null) && (
          <Flex mb={4} gap={2} flexWrap="wrap">
            {searchQuery && (
              <Badge colorScheme="blue" p={2} borderRadius="md">
                Search: {searchQuery}
              </Badge>
            )}
            {folderFilter !== null && (
              <Badge colorScheme="purple" p={2} borderRadius="md">
                Folder: {folderFilter || 'Root'}
              </Badge>
            )}
            {tagFilter && (
              <Badge colorScheme="green" p={2} borderRadius="md">
                Tag: {tagFilter}
              </Badge>
            )}
          </Flex>
        )}
        
        {/* Error display */}
        {error && (
          <Box mb={4} p={4} bg="red.50" color="red.500" borderRadius="md" _dark={{ bg: 'red.900' }}>
            <Flex align="center">
              <FiInfo style={{ marginRight: '8px' }} />
              <Text>{error}</Text>
            </Flex>
          </Box>
        )}
        
        {/* Tabs for different bookmark views */}
        <Tabs variant="line" colorScheme="blue">
          <TabList>
            <Tab>
              All Bookmarks
              <Badge ml={2} colorScheme="blue" borderRadius="full">
                {filteredBookmarks.length}
              </Badge>
            </Tab>
            <Tab>
              Favorites <FiStar style={{ marginLeft: '5px' }} />
              <Badge ml={2} colorScheme="yellow" borderRadius="full">
                {favoriteBookmarks.length}
              </Badge>
            </Tab>
            <Tab>
              Archive <FiArchive style={{ marginLeft: '5px' }} />
              <Badge ml={2} colorScheme="gray" borderRadius="full">
                {archivedBookmarks.length}
              </Badge>
            </Tab>
            <Tab>
              Neural View <FiZap style={{ marginLeft: '5px' }} />
            </Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <ScaleFade in={true}>
                <BookmarkList
                  bookmarks={filteredBookmarks}
                  onEditBookmark={handleEditBookmark}
                  onDeleteBookmark={handleDeleteBookmark}
                  onToggleFavorite={toggleFavorite}
                  onArchiveBookmark={archiveBookmark}
                  onViewAnalysis={handleViewAnalysis}
                  emptyMessage="No bookmarks found. Add your first bookmark by clicking the 'New Bookmark' button above."
                />
              </ScaleFade>
            </TabPanel>
            
            <TabPanel>
              <ScaleFade in={true}>
                <BookmarkList
                  bookmarks={favoriteBookmarks.filter(b => !b.isArchived)}
                  onEditBookmark={handleEditBookmark}
                  onDeleteBookmark={handleDeleteBookmark}
                  onToggleFavorite={toggleFavorite}
                  onArchiveBookmark={archiveBookmark}
                  emptyMessage="No favorite bookmarks yet. Mark bookmarks as favorites by clicking the star icon."
                />
              </ScaleFade>
            </TabPanel>
            
            <TabPanel>
              <ScaleFade in={true}>
                <BookmarkList
                  bookmarks={archivedBookmarks}
                  onEditBookmark={handleEditBookmark}
                  onDeleteBookmark={handleDeleteBookmark}
                  onToggleFavorite={toggleFavorite}
                  onArchiveBookmark={(id) => archiveBookmark(id, false)}
                  emptyMessage="No archived bookmarks."
                />
              </ScaleFade>
            </TabPanel>
            
            <TabPanel>
              <ScaleFade in={true}>
                <NeuronBookmarkView
                  bookmarks={filteredBookmarks}
                  onOpenBookmark={(url: string) => window.open(url, '_blank')}
                  isLoading={isLoading}
                />
              </ScaleFade>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      
      {/* Bookmark form modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent>
          <ModalHeader>
            {editingBookmark ? 'Edit Bookmark' : 'Add New Bookmark'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <BookmarkForm
              initialData={editingBookmark || undefined}
              folders={folders}
              onSubmit={handleSubmit}
              onCancel={onClose}
              isLoading={isLoading}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Bookmark analysis modal */}
      {selectedBookmarkForAnalysis && (
        <BookmarkDetailWithAnalysis
          bookmark={selectedBookmarkForAnalysis}
          onClose={() => setSelectedBookmarkForAnalysis(null)}
          onUpdate={async (id, data) => {
            await updateBookmark(id, data);
          }}
          isOpen={!!selectedBookmarkForAnalysis}
          folders={folders}
        />
      )}
    </Layout>
  );
};

export default BookmarksPage; 