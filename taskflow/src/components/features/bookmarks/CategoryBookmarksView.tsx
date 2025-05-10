import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Badge,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  HStack,
  Select,
  Tag,
  Divider,
  useToast
} from '@chakra-ui/react';
import {
  FiFilter,
  FiGrid,
  FiList,
  FiChevronDown,
  FiTag,
  FiFolder,
  FiSearch,
  FiPlusCircle,
  FiX,
  FiTwitter,
  FiYoutube,
  FiGithub,
  FiLinkedin,
  FiFacebook,
  FiCpu,
  FiBriefcase,
  FiZap,
  FiFilm,
  FiHeart,
  FiBookOpen,
  FiBookmark,
  FiGlobe,
  FiStar
} from 'react-icons/fi';
import BookmarkCard from './BookmarkCard';
import BookmarkImporter from './BookmarkImporter';
import { QuickBookmark } from './QuickBookmark';
import { EnhancedBookmarkForm } from './EnhancedBookmarkForm';
import type { Bookmark } from '../../../models/Bookmark';
import { BookmarkCategorizer } from '../../../services/bookmarkCategorizer';

// Icons for categories
const CATEGORY_ICONS = {
  ai: FiCpu,
  business: FiBriefcase,
  development: FiZap,
  science: FiGlobe,
  entertainment: FiFilm,
  health: FiHeart,
  news: FiBookOpen,
  education: FiBookmark,
  twitter: FiTwitter,
  youtube: FiYoutube,
  github: FiGithub,
  linkedin: FiLinkedin,
  facebook: FiFacebook
};

// Color mapping for categories
const CATEGORY_COLORS = {
  ai: 'teal',
  business: 'orange',
  development: 'purple',
  science: 'blue',
  entertainment: 'pink',
  health: 'green',
  news: 'yellow',
  education: 'cyan',
  twitter: 'twitter',
  youtube: 'red',
  github: 'gray',
  facebook: 'facebook',
  linkedin: 'linkedin'
};

interface CategoryBookmarksViewProps {
  bookmarks: Bookmark[];
  folders: string[];
  onAddBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateBookmark: (id: string, bookmark: Partial<Bookmark>) => Promise<void>;
  onDeleteBookmark: (id: string) => Promise<void>;
  onImportBookmarks: (bookmarks: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  isLoading?: boolean;
}

const CategoryBookmarksView: React.FC<CategoryBookmarksViewProps> = ({
  bookmarks,
  folders,
  onAddBookmark,
  onUpdateBookmark,
  onDeleteBookmark,
  onImportBookmarks,
  isLoading = false
}) => {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  
  // UI state
  const { isOpen: isFilterOpen } = useDisclosure();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isQuickSaveOpen, onOpen: onQuickSaveOpen, onClose: onQuickSaveClose } = useDisclosure();
  const toast = useToast();
  
  // Theme
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Extract categories and group bookmarks
  const {
    categories,
    platforms,
    categoryBookmarks,
    platformBookmarks,
    filteredBookmarks
  } = useMemo(() => {
    // Extract all unique categories and platforms
    const categoriesSet = new Set<string>();
    const platformsSet = new Set<string>();
    
    // Group bookmarks by category and platform
    const byCategory: Record<string, Bookmark[]> = {};
    const byPlatform: Record<string, Bookmark[]> = {};
    
    // Filter bookmarks based on search and filters
    const filtered = bookmarks.filter(bookmark => {
      // Skip archived bookmarks
      if (bookmark.isArchived) return false;
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.description?.toLowerCase().includes(query) ||
          bookmark.url.toLowerCase().includes(query) ||
          bookmark.tags.some(tag => tag.toLowerCase().includes(query))
        );
        if (!matchesSearch) return false;
      }
      
      // Apply folder filter
      if (folderFilter !== null) {
        if (folderFilter === '') {
          if (bookmark.folder !== null) return false;
        } else if (bookmark.folder !== folderFilter) {
          return false;
        }
      }
      
      return true;
    });
    
    // Process bookmarks for categories and platforms
    filtered.forEach(bookmark => {
      // Extract categories from tags
      const categories = bookmark.tags.filter(tag => 
        Object.keys(CATEGORY_COLORS).includes(tag.toLowerCase())
      );
      
      const platforms = bookmark.tags.filter(tag =>
        ['twitter', 'youtube', 'github', 'linkedin', 'facebook'].includes(tag.toLowerCase())
      );
      
      // Add to categories
      categories.forEach(category => {
        categoriesSet.add(category);
        if (!byCategory[category]) byCategory[category] = [];
        byCategory[category].push(bookmark);
      });
      
      // Add to platforms
      platforms.forEach(platform => {
        platformsSet.add(platform);
        if (!byPlatform[platform]) byPlatform[platform] = [];
        byPlatform[platform].push(bookmark);
      });
      
      // Add uncategorized bookmarks
      if (categories.length === 0) {
        if (!byCategory['uncategorized']) byCategory['uncategorized'] = [];
        byCategory['uncategorized'].push(bookmark);
      }
    });
    
    return {
      categories: Array.from(categoriesSet),
      platforms: Array.from(platformsSet),
      categoryBookmarks: byCategory,
      platformBookmarks: byPlatform,
      filteredBookmarks: filtered
    };
  }, [bookmarks, searchQuery, folderFilter]);
  
  // Sort bookmarks
  const sortedBookmarks = useMemo(() => {
    return [...filteredBookmarks].sort((a, b) => {
      let comparison = 0;
      
      switch(sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredBookmarks, sortBy, sortDirection]);
  
  // Get unique folders from bookmarks
  const uniqueFolders = useMemo(() => {
    const foldersSet = new Set<string>();
    bookmarks.forEach(bookmark => {
      if (bookmark.folder) {
        foldersSet.add(bookmark.folder);
      }
    });
    return Array.from(foldersSet).sort();
  }, [bookmarks]);
  
  // Handle bookmark edit
  const handleEditBookmark = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    onFormOpen();
  };
  
  // Handle bookmark update
  const handleUpdateBookmark = async (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedBookmark) return;
    
    try {
      await onUpdateBookmark(selectedBookmark.id, data);
      toast({
        title: 'Bookmark updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setSelectedBookmark(null);
      onFormClose();
    } catch (error) {
      toast({
        title: 'Error updating bookmark',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Handle quick save bookmark
  const handleQuickSave = async (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await onAddBookmark(data);
      toast({
        title: 'Bookmark saved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onQuickSaveClose();
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
  
  // Handle import bookmarks
  const handleImportBookmarks = async (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      await onImportBookmarks(data);
      toast({
        title: 'Bookmarks imported',
        description: `Successfully imported ${data.length} bookmarks`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error importing bookmarks',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Return icon for category
  const getCategoryIcon = (category: string) => {
    const CategoryIcon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || FiBookmark;
    return <CategoryIcon />;
  };
  
  // Get color for category
  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || 'gray';
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter(null);
    setFolderFilter(null);
  };
  
  // Check if filters are active
  const hasActiveFilters = searchQuery || categoryFilter !== null || folderFilter !== null;
  
  return (
    <Box>
      {/* Header controls */}
      <Flex 
        mb={4}
        justify="space-between" 
        align={{ base: "stretch", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap={3}
      >
        <InputGroup maxW={{ base: "100%", md: "400px" }}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.500" />
          </InputLeftElement>
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <IconButton
              aria-label="Clear search"
              icon={<FiX />}
              position="absolute"
              right={0}
              top={0}
              height="100%"
              onClick={() => setSearchQuery('')}
              variant="ghost"
            />
          )}
        </InputGroup>
        
        <HStack spacing={3}>
          <Menu closeOnSelect={false}>
            <MenuButton as={Button} rightIcon={<FiChevronDown />} leftIcon={<FiFilter />}>
              Filter
            </MenuButton>
            <MenuList minW="220px">
              <Box px={3} py={2}>
                <Text fontWeight="medium" mb={2}>Filter by:</Text>
                <VStack align="stretch" spacing={3}>
                  <Box>
                    <Text fontSize="sm" mb={1}>Folder</Text>
                    <Select 
                      size="sm" 
                      value={folderFilter || ''}
                      onChange={(e) => setFolderFilter(e.target.value || null)}
                    >
                      <option value="">All Folders</option>
                      <option value="none">No Folder</option>
                      {uniqueFolders.map(folder => (
                        <option key={folder} value={folder}>{folder}</option>
                      ))}
                    </Select>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" mb={1}>Category</Text>
                    <Select 
                      size="sm" 
                      value={categoryFilter || ''}
                      onChange={(e) => setCategoryFilter(e.target.value || null)}
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </Select>
                  </Box>
                  
                  <HStack justify="space-between">
                    <Text fontSize="sm">Sort by:</Text>
                    <Select 
                      size="sm"
                      width="140px"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="updatedAt">Last Updated</option>
                      <option value="createdAt">Date Added</option>
                      <option value="title">Title</option>
                    </Select>
                  </HStack>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    leftIcon={<FiX />}
                    isDisabled={!hasActiveFilters}
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </VStack>
              </Box>
            </MenuList>
          </Menu>
          
          <HStack>
            <IconButton 
              aria-label="Grid view" 
              icon={<FiGrid />} 
              variant={viewMode === 'grid' ? 'solid' : 'outline'}
              onClick={() => setViewMode('grid')}
            />
            <IconButton 
              aria-label="List view" 
              icon={<FiList />} 
              variant={viewMode === 'list' ? 'solid' : 'outline'}
              onClick={() => setViewMode('list')}
            />
          </HStack>
          
          <HStack>
            <Button 
              leftIcon={<FiPlusCircle />} 
              colorScheme="blue"
              onClick={onQuickSaveOpen}
            >
              Quick Save
            </Button>
            <BookmarkImporter onImport={handleImportBookmarks} />
          </HStack>
        </HStack>
      </Flex>
      
      {/* Active filters display */}
      {hasActiveFilters && (
        <Flex mb={4} wrap="wrap" gap={2} align="center">
          <Text fontWeight="medium">Active filters:</Text>
          {searchQuery && (
            <Badge colorScheme="blue" px={2} py={1} borderRadius="full">
              Search: {searchQuery}
              <IconButton
                aria-label="Clear search"
                icon={<FiX />}
                size="xs"
                ml={1}
                onClick={() => setSearchQuery('')}
                variant="ghost"
              />
            </Badge>
          )}
          
          {folderFilter && (
            <Badge colorScheme="purple" px={2} py={1} borderRadius="full">
              Folder: {folderFilter === 'none' ? 'No Folder' : folderFilter}
              <IconButton
                aria-label="Clear folder filter"
                icon={<FiX />}
                size="xs"
                ml={1}
                onClick={() => setFolderFilter(null)}
                variant="ghost"
              />
            </Badge>
          )}
          
          {categoryFilter && (
            <Badge colorScheme={getCategoryColor(categoryFilter)} px={2} py={1} borderRadius="full">
              Category: {categoryFilter}
              <IconButton
                aria-label="Clear category filter"
                icon={<FiX />}
                size="xs"
                ml={1}
                onClick={() => setCategoryFilter(null)}
                variant="ghost"
              />
            </Badge>
          )}
          
          <Button size="xs" leftIcon={<FiX />} onClick={clearFilters}>
            Clear All
          </Button>
        </Flex>
      )}
      
      {/* Main content */}
      <Tabs variant="enclosed">
        <TabList>
          <Tab>All Bookmarks ({filteredBookmarks.length})</Tab>
          <Tab>By Category</Tab>
          <Tab>By Platform</Tab>
        </TabList>
        
        <TabPanels>
          {/* All bookmarks tab */}
          <TabPanel p={0} pt={4}>
            {sortedBookmarks.length === 0 ? (
              <Box textAlign="center" p={10} bg={bgColor} borderRadius="md" borderWidth="1px">
                <Text mb={4}>No bookmarks found matching your filters.</Text>
                {hasActiveFilters && (
                  <Button leftIcon={<FiX />} onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </Box>
            ) : (
              viewMode === 'grid' ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {sortedBookmarks.map(bookmark => (
                    <BookmarkCard
                      key={bookmark.id}
                      bookmark={bookmark}
                      onEdit={() => handleEditBookmark(bookmark)}
                      onDelete={() => onDeleteBookmark(bookmark.id)}
                      onToggleFavorite={() => 
                        onUpdateBookmark(bookmark.id, { isFavorite: !bookmark.isFavorite })
                      }
                      onArchive={() => 
                        onUpdateBookmark(bookmark.id, { isArchived: !bookmark.isArchived })
                      }
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <VStack spacing={3} align="stretch">
                  {sortedBookmarks.map(bookmark => (
                    <BookmarkCard
                      key={bookmark.id}
                      bookmark={bookmark}
                      onEdit={() => handleEditBookmark(bookmark)}
                      onDelete={() => onDeleteBookmark(bookmark.id)}
                      onToggleFavorite={() => 
                        onUpdateBookmark(bookmark.id, { isFavorite: !bookmark.isFavorite })
                      }
                      onArchive={() => 
                        onUpdateBookmark(bookmark.id, { isArchived: !bookmark.isArchived })
                      }
                    />
                  ))}
                </VStack>
              )
            )}
          </TabPanel>
          
          {/* By category tab */}
          <TabPanel p={0} pt={4}>
            {categories.length === 0 ? (
              <Box textAlign="center" p={10} bg={bgColor} borderRadius="md" borderWidth="1px">
                <Heading size="md" mb={2}>No categorized bookmarks</Heading>
                <Text mb={4}>
                  Add tags to your bookmarks to automatically categorize them.
                </Text>
                <Text fontSize="sm">
                  The Quick Save feature will automatically detect categories when you save a bookmark.
                </Text>
              </Box>
            ) : (
              <VStack spacing={6} align="stretch">
                {categories.map(category => (
                  <Box key={category}>
                    <Flex align="center" mb={3}>
                      <Box mr={2} color={`${getCategoryColor(category)}.500`}>
                        {getCategoryIcon(category)}
                      </Box>
                      <Heading size="md" textTransform="capitalize">
                        {category}
                      </Heading>
                      <Badge ml={2} colorScheme={getCategoryColor(category)}>
                        {categoryBookmarks[category]?.length || 0}
                      </Badge>
                    </Flex>
                    
                    {categoryBookmarks[category]?.length > 0 ? (
                      viewMode === 'grid' ? (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                          {categoryBookmarks[category].map(bookmark => (
                            <BookmarkCard
                              key={bookmark.id}
                              bookmark={bookmark}
                              onEdit={() => handleEditBookmark(bookmark)}
                              onDelete={() => onDeleteBookmark(bookmark.id)}
                              onToggleFavorite={() => 
                                onUpdateBookmark(bookmark.id, { isFavorite: !bookmark.isFavorite })
                              }
                              onArchive={() => 
                                onUpdateBookmark(bookmark.id, { isArchived: !bookmark.isArchived })
                              }
                            />
                          ))}
                        </SimpleGrid>
                      ) : (
                        <VStack spacing={3} align="stretch">
                          {categoryBookmarks[category].map(bookmark => (
                            <BookmarkCard
                              key={bookmark.id}
                              bookmark={bookmark}
                              onEdit={() => handleEditBookmark(bookmark)}
                              onDelete={() => onDeleteBookmark(bookmark.id)}
                              onToggleFavorite={() => 
                                onUpdateBookmark(bookmark.id, { isFavorite: !bookmark.isFavorite })
                              }
                              onArchive={() => 
                                onUpdateBookmark(bookmark.id, { isArchived: !bookmark.isArchived })
                              }
                            />
                          ))}
                        </VStack>
                      )
                    ) : (
                      <Text color="gray.500">No bookmarks in this category.</Text>
                    )}
                    
                    <Divider mt={6} mb={2} />
                  </Box>
                ))}
                
                {/* Uncategorized bookmarks */}
                {categoryBookmarks['uncategorized']?.length > 0 && (
                  <Box>
                    <Flex align="center" mb={3}>
                      <Box mr={2} color="gray.500">
                        <FiBookmark />
                      </Box>
                      <Heading size="md">
                        Uncategorized
                      </Heading>
                      <Badge ml={2} colorScheme="gray">
                        {categoryBookmarks['uncategorized'].length}
                      </Badge>
                    </Flex>
                    
                    {viewMode === 'grid' ? (
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                        {categoryBookmarks['uncategorized'].map(bookmark => (
                          <BookmarkCard
                            key={bookmark.id}
                            bookmark={bookmark}
                            onEdit={() => handleEditBookmark(bookmark)}
                            onDelete={() => onDeleteBookmark(bookmark.id)}
                            onToggleFavorite={() => 
                              onUpdateBookmark(bookmark.id, { isFavorite: !bookmark.isFavorite })
                            }
                            onArchive={() => 
                              onUpdateBookmark(bookmark.id, { isArchived: !bookmark.isArchived })
                            }
                          />
                        ))}
                      </SimpleGrid>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {categoryBookmarks['uncategorized'].map(bookmark => (
                          <BookmarkCard
                            key={bookmark.id}
                            bookmark={bookmark}
                            onEdit={() => handleEditBookmark(bookmark)}
                            onDelete={() => onDeleteBookmark(bookmark.id)}
                            onToggleFavorite={() => 
                              onUpdateBookmark(bookmark.id, { isFavorite: !bookmark.isFavorite })
                            }
                            onArchive={() => 
                              onUpdateBookmark(bookmark.id, { isArchived: !bookmark.isArchived })
                            }
                          />
                        ))}
                      </VStack>
                    )}
                  </Box>
                )}
              </VStack>
            )}
          </TabPanel>
          
          {/* By platform tab */}
          <TabPanel p={0} pt={4}>
            {platforms.length === 0 ? (
              <Box textAlign="center" p={10} bg={bgColor} borderRadius="md" borderWidth="1px">
                <Heading size="md" mb={2}>No platform-specific bookmarks</Heading>
                <Text mb={4}>
                  Bookmarks from platforms like Twitter, YouTube, or GitHub will appear here.
                </Text>
                <Text fontSize="sm">
                  Try using the Quick Save or Import feature to automatically detect platforms.
                </Text>
              </Box>
            ) : (
              <VStack spacing={6} align="stretch">
                {platforms.map(platform => (
                  <Box key={platform}>
                    <Flex align="center" mb={3}>
                      <Box mr={2} color={`${getCategoryColor(platform)}.500`}>
                        {getCategoryIcon(platform)}
                      </Box>
                      <Heading size="md" textTransform="capitalize">
                        {platform}
                      </Heading>
                      <Badge ml={2} colorScheme={getCategoryColor(platform)}>
                        {platformBookmarks[platform]?.length || 0}
                      </Badge>
                    </Flex>
                    
                    {platformBookmarks[platform]?.length > 0 ? (
                      viewMode === 'grid' ? (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                          {platformBookmarks[platform].map(bookmark => (
                            <BookmarkCard
                              key={bookmark.id}
                              bookmark={bookmark}
                              onEdit={() => handleEditBookmark(bookmark)}
                              onDelete={() => onDeleteBookmark(bookmark.id)}
                              onToggleFavorite={() => 
                                onUpdateBookmark(bookmark.id, { isFavorite: !bookmark.isFavorite })
                              }
                              onArchive={() => 
                                onUpdateBookmark(bookmark.id, { isArchived: !bookmark.isArchived })
                              }
                            />
                          ))}
                        </SimpleGrid>
                      ) : (
                        <VStack spacing={3} align="stretch">
                          {platformBookmarks[platform].map(bookmark => (
                            <BookmarkCard
                              key={bookmark.id}
                              bookmark={bookmark}
                              onEdit={() => handleEditBookmark(bookmark)}
                              onDelete={() => onDeleteBookmark(bookmark.id)}
                              onToggleFavorite={() => 
                                onUpdateBookmark(bookmark.id, { isFavorite: !bookmark.isFavorite })
                              }
                              onArchive={() => 
                                onUpdateBookmark(bookmark.id, { isArchived: !bookmark.isArchived })
                              }
                            />
                          ))}
                        </VStack>
                      )
                    ) : (
                      <Text color="gray.500">No bookmarks for this platform.</Text>
                    )}
                    
                    <Divider mt={6} mb={2} />
                  </Box>
                ))}
              </VStack>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Edit Bookmark Modal */}
      {isFormOpen && (
        <Drawer
          isOpen={isFormOpen}
          placement="right"
          onClose={onFormClose}
          size="lg"
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px">
              Edit Bookmark
            </DrawerHeader>
            <DrawerBody>
              <EnhancedBookmarkForm
                initialData={selectedBookmark || undefined}
                folders={uniqueFolders}
                onSubmit={handleUpdateBookmark}
                onCancel={onFormClose}
                isLoading={isLoading}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}
      
      {/* Quick Save Drawer */}
      <QuickBookmark
        isOpen={isQuickSaveOpen}
        onClose={onQuickSaveClose}
        onSave={handleQuickSave}
        folders={uniqueFolders}
      />
    </Box>
  );
};

export default CategoryBookmarksView; 