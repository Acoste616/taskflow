import React, { useState, useMemo } from 'react';
import {
  Box,
  Text,
  SimpleGrid,
  Button,
  Flex,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  useColorModeValue,
  IconButton,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Collapse
} from '@chakra-ui/react';
import { 
  FiSearch, 
  FiFilter, 
  FiGrid, 
  FiList, 
  FiChevronDown,
  FiArrowUp,
  FiArrowDown,
  FiX
} from 'react-icons/fi';
import BookmarkCard from './BookmarkCard';
import type { Bookmark } from '../../../models/Bookmark';

type SortOption = 'title' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'list' | 'grid';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onArchiveBookmark: (id: string) => void;
  emptyMessage?: string;
}

const BookmarkList: React.FC<BookmarkListProps> = ({
  bookmarks,
  onEditBookmark,
  onDeleteBookmark,
  onToggleFavorite,
  onArchiveBookmark,
  emptyMessage = "No bookmarks found."
}) => {
  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { isOpen, onToggle } = useDisclosure();

  // Get all unique tags from bookmarks
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    bookmarks.forEach(bookmark => {
      bookmark.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [bookmarks]);

  // Filter and sort bookmarks
  const filteredAndSortedBookmarks = useMemo(() => {
    return bookmarks
      .filter(bookmark => {
        const matchesSearch = 
          bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.url.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesTags = selectedTags.length === 0 || 
          selectedTags.every(tag => bookmark.tags.includes(tag));
        
        return matchesSearch && matchesTags;
      })
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
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
  }, [bookmarks, searchQuery, sortBy, sortDirection, selectedTags]);

  // Handle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (bookmarks.length === 0) {
    return (
      <Box py={10} textAlign="center">
        <Text color="gray.500">{emptyMessage}</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Controls */}
      <Box 
        mb={4} 
        p={4} 
        bg={bgColor} 
        borderRadius="md" 
        borderWidth="1px" 
        borderColor={borderColor}
      >
        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
          {/* Search */}
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

          {/* View Mode */}
          <HStack>
            <Tooltip label="List View">
              <IconButton
                aria-label="List view"
                icon={<FiList />}
                variant={viewMode === 'list' ? 'solid' : 'ghost'}
                onClick={() => setViewMode('list')}
              />
            </Tooltip>
            <Tooltip label="Grid View">
              <IconButton
                aria-label="Grid view"
                icon={<FiGrid />}
                variant={viewMode === 'grid' ? 'solid' : 'ghost'}
                onClick={() => setViewMode('grid')}
              />
            </Tooltip>
          </HStack>

          {/* Sort */}
          <Menu>
            <MenuButton as={Button} rightIcon={<FiChevronDown />}>
              Sort by: {sortBy}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => setSortBy('title')}>Title</MenuItem>
              <MenuItem onClick={() => setSortBy('createdAt')}>Created Date</MenuItem>
              <MenuItem onClick={() => setSortBy('updatedAt')}>Updated Date</MenuItem>
            </MenuList>
          </Menu>

          {/* Sort Direction */}
          <IconButton
            aria-label="Toggle sort direction"
            icon={sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />}
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          />

          {/* Filter Toggle */}
          <Button
            leftIcon={<FiFilter />}
            onClick={onToggle}
            variant={selectedTags.length > 0 ? 'solid' : 'outline'}
          >
            Filters {selectedTags.length > 0 && `(${selectedTags.length})`}
          </Button>
        </Flex>

        {/* Filter Panel */}
        <Collapse in={isOpen}>
          <Box mt={4} pt={4} borderTopWidth="1px" borderColor={borderColor}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontWeight="medium">Filter by tags</Text>
              {selectedTags.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<FiX />}
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              )}
            </Flex>
            <HStack spacing={2} flexWrap="wrap">
              {allTags.map(tag => (
                <Button
                  key={tag}
                  size="sm"
                  variant={selectedTags.includes(tag) ? 'solid' : 'outline'}
                  colorScheme={selectedTags.includes(tag) ? 'blue' : 'gray'}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </HStack>
          </Box>
        </Collapse>
      </Box>

      {/* Results count */}
      {filteredAndSortedBookmarks.length !== bookmarks.length && (
        <Text mb={4} color="gray.500">
          Showing {filteredAndSortedBookmarks.length} of {bookmarks.length} bookmarks
        </Text>
      )}

      {/* Bookmarks */}
      {viewMode === 'grid' ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {filteredAndSortedBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onEdit={onEditBookmark}
              onDelete={onDeleteBookmark}
              onToggleFavorite={onToggleFavorite}
              onArchive={onArchiveBookmark}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Box>
          {filteredAndSortedBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onEdit={onEditBookmark}
              onDelete={onDeleteBookmark}
              onToggleFavorite={onToggleFavorite}
              onArchive={onArchiveBookmark}
            />
          ))}
        </Box>
      )}

      {/* Empty state for filtered results */}
      {filteredAndSortedBookmarks.length === 0 && (
        <Box py={10} textAlign="center">
          <Text color="gray.500">No bookmarks match your filters.</Text>
          <Button mt={4} onClick={clearFilters}>
            Clear filters
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default BookmarkList; 