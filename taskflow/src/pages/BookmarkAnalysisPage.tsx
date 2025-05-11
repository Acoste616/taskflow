import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Progress,
  useToast,
  SimpleGrid,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FiSearch,
  FiRefreshCw,
  FiZap,
  FiCpu,
  FiMessageCircle,
  FiBookmark,
  FiTag,
  FiFolder,
  FiArrowRight,
  FiExternalLink
} from 'react-icons/fi';
import Layout from '../components/layout/Layout';
import EnhancedBookmarkAnalysis from '../components/features/bookmarks/EnhancedBookmarkAnalysis';
import { useBookmarkContext } from '../contexts/BookmarkContext';
import { contentAnalysisService } from '../services/contentAnalysisService';

const BookmarkAnalysisPage: React.FC = () => {
  const { bookmarks, updateBookmark, refreshBookmarks } = useBookmarkContext();
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedBookmark, setSelectedBookmark] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({});
  const toast = useToast();
  
  // Get all unique categories from analysis results
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    
    Object.values(analysisResults).forEach(result => {
      if (result.categories && Array.isArray(result.categories)) {
        result.categories.forEach((category: string) => {
          uniqueCategories.add(category);
        });
      }
    });
    
    return ['all', ...Array.from(uniqueCategories)];
  }, [analysisResults]);
  
  // Filter bookmarks based on search and category
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bookmark => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!bookmark.title.toLowerCase().includes(query) && 
            !bookmark.url.toLowerCase().includes(query) &&
            !bookmark.description?.toLowerCase().includes(query) &&
            !bookmark.tags.some(tag => tag.toLowerCase().includes(query))) {
          return false;
        }
      }
      
      // Apply category filter if not 'all'
      if (categoryFilter !== 'all') {
        const analysis = analysisResults[bookmark.id];
        if (!analysis || !analysis.categories || 
            !analysis.categories.includes(categoryFilter)) {
          return false;
        }
      }
      
      return true;
    });
  }, [bookmarks, searchQuery, categoryFilter, analysisResults]);
  
  // Statistics about analyzed bookmarks
  const stats = useMemo(() => {
    const analyzed = Object.keys(analysisResults).length;
    const total = bookmarks.length;
    const categoryCounts: Record<string, number> = {};
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    
    Object.values(analysisResults).forEach(result => {
      // Count by category
      if (result.categories && Array.isArray(result.categories)) {
        result.categories.forEach((category: string) => {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      }
      
      // Count by sentiment
      if (result.sentiment) {
        sentimentCounts[result.sentiment as keyof typeof sentimentCounts]++;
      }
    });
    
    return {
      analyzed,
      total,
      progress: total > 0 ? Math.round((analyzed / total) * 100) : 0,
      categories: categoryCounts,
      sentiment: sentimentCounts
    };
  }, [analysisResults, bookmarks.length]);
  
  // Load previously analyzed results
  useEffect(() => {
    const loadResults = () => {
      try {
        const cachedResults = localStorage.getItem('bookmark-analysis-results');
        if (cachedResults) {
          setAnalysisResults(JSON.parse(cachedResults));
        }
      } catch (error) {
        console.error('Failed to load cached analysis results:', error);
      }
    };
    
    loadResults();
  }, []);
  
  // Save analysis results to localStorage
  useEffect(() => {
    if (Object.keys(analysisResults).length > 0) {
      try {
        localStorage.setItem('bookmark-analysis-results', JSON.stringify(analysisResults));
      } catch (error) {
        console.error('Failed to save analysis results to cache:', error);
      }
    }
  }, [analysisResults]);
  
  // Handle analyzing selected bookmarks
  const handleAnalyzeSelected = async () => {
    if (selectedBookmarks.length === 0) {
      toast({
        title: 'No bookmarks selected',
        description: 'Please select at least one bookmark to analyze',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    setIsAnalyzing(true);
    setProgress({ current: 0, total: selectedBookmarks.length });
    
    try {
      // Get selected bookmarks
      const bookmarksToAnalyze = bookmarks.filter(
        bookmark => selectedBookmarks.includes(bookmark.id)
      );
      
      // Analyze in batches
      const results = await contentAnalysisService.analyzeBatch(
        bookmarksToAnalyze,
        (processed, total) => {
          setProgress({ current: processed, total });
        }
      );
      
      // Update analysis results
      setAnalysisResults(prevResults => ({
        ...prevResults,
        ...results
      }));
      
      // Update bookmark tags if they were enhanced
      let updatedCount = 0;
      
      for (const bookmark of bookmarksToAnalyze) {
        const analysis = results[bookmark.id];
        if (analysis && analysis.suggestedTags && analysis.suggestedTags.length > 0) {
          // Merge existing tags with suggested tags
          const existingTags = new Set(bookmark.tags);
          const newTags = analysis.suggestedTags.filter((tag: string) => !existingTags.has(tag));
          
          if (newTags.length > 0) {
            // Take up to 3 new tags to avoid tag explosion
            const tagsToAdd = newTags.slice(0, 3);
            await updateBookmark(bookmark.id, {
              tags: [...bookmark.tags, ...tagsToAdd]
            });
            updatedCount++;
          }
        }
      }
      
      toast({
        title: 'Analysis complete',
        description: `Successfully analyzed ${selectedBookmarks.length} bookmarks` + 
                    (updatedCount > 0 ? ` and updated tags for ${updatedCount} bookmarks` : ''),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh bookmarks to pick up tag updates
      await refreshBookmarks();
      setSelectedBookmarks([]);
    } catch (error) {
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Handle analyzing all bookmarks
  const handleAnalyzeAll = async () => {
    setIsAnalyzing(true);
    setProgress({ current: 0, total: bookmarks.length });
    
    try {
      // Analyze all bookmarks
      const results = await contentAnalysisService.analyzeBatch(
        bookmarks,
        (processed, total) => {
          setProgress({ current: processed, total });
        }
      );
      
      // Update analysis results
      setAnalysisResults(results);
      
      toast({
        title: 'Analysis complete',
        description: `Successfully analyzed all ${bookmarks.length} bookmarks`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Toggle bookmark selection
  const toggleBookmarkSelection = (id: string) => {
    setSelectedBookmarks(prev => 
      prev.includes(id)
        ? prev.filter(bookmarkId => bookmarkId !== id)
        : [...prev, id]
    );
  };
  
  // Select/deselect all bookmarks
  const toggleSelectAll = () => {
    if (selectedBookmarks.length === filteredBookmarks.length) {
      setSelectedBookmarks([]);
    } else {
      setSelectedBookmarks(filteredBookmarks.map(bookmark => bookmark.id));
    }
  };
  
  // Update bookmark tags
  const handleUpdateTags = async (bookmarkId: string, tags: string[]) => {
    try {
      await updateBookmark(bookmarkId, { tags });
      toast({
        title: 'Tags updated',
        status: 'success',
        duration: 2000,
      });
      await refreshBookmarks();
    } catch (error) {
      toast({
        title: 'Failed to update tags',
        status: 'error',
        duration: 3000,
      });
    }
  };
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const tableBg = useColorModeValue('white', 'gray.800');
  const tableRowHoverBg = useColorModeValue('gray.50', 'gray.700');
  
  return (
    <Layout>
      <Box mb={8}>
        <Heading mb={4}>Bookmark Analysis</Heading>
        
        <Text mb={6}>
          Analyze your bookmarks with AI to get insights, summaries, and intelligent tag suggestions.
          This page helps you organize and understand your bookmarks better.
        </Text>
        
        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <Flex align="center" mb={2}>
                  <Icon as={FiBookmark} color="blue.500" mr={2} />
                  <StatLabel>Analyzed Bookmarks</StatLabel>
                </Flex>
                <StatNumber>{stats.analyzed} / {stats.total}</StatNumber>
                <StatHelpText>
                  {stats.progress}% of your collection
                </StatHelpText>
                <Progress value={stats.progress} colorScheme="blue" size="sm" mt={2} />
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <Flex align="center" mb={2}>
                  <Icon as={FiTag} color="green.500" mr={2} />
                  <StatLabel>Top Categories</StatLabel>
                </Flex>
                <Flex wrap="wrap" gap={2} mt={2}>
                  {Object.entries(stats.categories)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([category, count]) => (
                      <Badge key={category} colorScheme="green" variant="solid">
                        {category}: {count}
                      </Badge>
                    ))}
                </Flex>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <Flex align="center" mb={2}>
                  <Icon as={FiMessageCircle} color="purple.500" mr={2} />
                  <StatLabel>Content Sentiment</StatLabel>
                </Flex>
                <HStack spacing={4} mt={2}>
                  <VStack align="center">
                    <Badge colorScheme="green">{stats.sentiment.positive}</Badge>
                    <Text fontSize="xs">Positive</Text>
                  </VStack>
                  <VStack align="center">
                    <Badge colorScheme="gray">{stats.sentiment.neutral}</Badge>
                    <Text fontSize="xs">Neutral</Text>
                  </VStack>
                  <VStack align="center">
                    <Badge colorScheme="red">{stats.sentiment.negative}</Badge>
                    <Text fontSize="xs">Negative</Text>
                  </VStack>
                </HStack>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
        
        {/* Controls */}
        <Flex 
          mb={6} 
          direction={{ base: 'column', md: 'row' }} 
          gap={4}
          align={{ base: 'stretch', md: 'center' }}
        >
          <InputGroup flex="1">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search bookmarks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            width={{ base: '100%', md: '200px' }}
          >
            <option value="all">All Categories</option>
            {categories
              .filter(cat => cat !== 'all')
              .map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
          </Select>
          
          <HStack>
            <Button
              colorScheme="blue"
              leftIcon={<FiZap />}
              onClick={handleAnalyzeSelected}
              isLoading={isAnalyzing}
              isDisabled={selectedBookmarks.length === 0}
            >
              Analyze Selected
            </Button>
            
            <Button
              colorScheme="purple"
              leftIcon={<FiCpu />}
              onClick={handleAnalyzeAll}
              isLoading={isAnalyzing}
            >
              Analyze All
            </Button>
          </HStack>
        </Flex>
        
        {/* Progress indicator during analysis */}
        {isAnalyzing && (
          <Box mb={6}>
            <Progress 
              value={(progress.current / progress.total) * 100} 
              size="lg" 
              colorScheme="blue" 
              hasStripe
              isAnimated
              mb={2}
            />
            <Text textAlign="center">
              Analyzing bookmarks: {progress.current} of {progress.total}
            </Text>
          </Box>
        )}
        
        {/* Bookmark table */}
        <TableContainer mb={6} borderWidth="1px" borderRadius="lg" overflow="hidden">
          <Table variant="simple" bg={tableBg}>
            <Thead>
              <Tr>
                <Th width="50px">
                  <input
                    type="checkbox"
                    checked={
                      filteredBookmarks.length > 0 && 
                      selectedBookmarks.length === filteredBookmarks.length
                    }
                    onChange={toggleSelectAll}
                  />
                </Th>
                <Th>Bookmark</Th>
                <Th>Analysis</Th>
                <Th width="100px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredBookmarks.map(bookmark => (
                <Tr 
                  key={bookmark.id}
                  _hover={{ bg: tableRowHoverBg }}
                  bg={selectedBookmarks.includes(bookmark.id) ? tableRowHoverBg : undefined}
                  cursor="pointer"
                  onClick={() => toggleBookmarkSelection(bookmark.id)}
                >
                  <Td>
                    <input
                      type="checkbox"
                      checked={selectedBookmarks.includes(bookmark.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleBookmarkSelection(bookmark.id);
                      }}
                    />
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="semibold">{bookmark.title}</Text>
                      <Text fontSize="xs" color="gray.500" noOfLines={1}>
                        {bookmark.url}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    {analysisResults[bookmark.id] ? (
                      <VStack align="start" spacing={2}>
                        <Flex gap={1} flexWrap="wrap">
                          {analysisResults[bookmark.id].categories?.map((category: string) => (
                            <Badge key={category} colorScheme="green" size="sm">
                              {category}
                            </Badge>
                          ))}
                        </Flex>
                        {analysisResults[bookmark.id].suggestedTags && (
                          <Flex gap={1} flexWrap="wrap">
                            {analysisResults[bookmark.id].suggestedTags.slice(0, 3).map((tag: string) => (
                              <Tag key={tag} size="sm" colorScheme="blue" variant="outline">
                                {tag}
                              </Tag>
                            ))}
                            {analysisResults[bookmark.id].suggestedTags.length > 3 && (
                              <Tag size="sm" variant="outline">
                                +{analysisResults[bookmark.id].suggestedTags.length - 3} more
                              </Tag>
                            )}
                          </Flex>
                        )}
                      </VStack>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        Not analyzed yet
                      </Text>
                    )}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Button
                        aria-label="View detailed analysis"
                        leftIcon={<FiCpu />}
                        size="sm"
                        variant="ghost"
                        isDisabled={!analysisResults[bookmark.id]}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBookmark(bookmark.id === selectedBookmark ? null : bookmark.id);
                        }}
                      >
                        Details
                      </Button>
                      <Button
                        aria-label="Open bookmark"
                        leftIcon={<FiExternalLink />}
                        size="sm"
                        variant="ghost"
                        as="a"
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
              
              {filteredBookmarks.length === 0 && (
                <Tr>
                  <Td colSpan={4} textAlign="center" py={10}>
                    <Text color="gray.500">
                      No bookmarks match your search criteria.
                    </Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
        
        {/* Selected bookmark analysis */}
        {selectedBookmark && (
          <Box mb={6}>
            <Heading size="md" mb={4}>
              Detailed Analysis
            </Heading>
            <Box
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
            >
              {analysisResults[selectedBookmark] ? (
                <EnhancedBookmarkAnalysis
                  bookmark={bookmarks.find(b => b.id === selectedBookmark)!}
                  onUpdateTags={handleUpdateTags}
                  onClose={() => setSelectedBookmark(null)}
                />
              ) : (
                <Box p={6} textAlign="center">
                  <Text mb={4}>This bookmark hasn't been analyzed yet.</Text>
                  <Button
                    colorScheme="blue"
                    leftIcon={<FiCpu />}
                    onClick={() => {
                      const bookmark = bookmarks.find(b => b.id === selectedBookmark);
                      if (bookmark) {
                        setIsAnalyzing(true);
                        contentAnalysisService.analyzeBookmark(bookmark)
                          .then(result => {
                            setAnalysisResults(prev => ({
                              ...prev,
                              [selectedBookmark]: result
                            }));
                            setIsAnalyzing(false);
                          })
                          .catch(error => {
                            toast({
                              title: 'Analysis failed',
                              description: error instanceof Error ? error.message : 'An unexpected error occurred',
                              status: 'error',
                              duration: 5000,
                              isClosable: true,
                            });
                            setIsAnalyzing(false);
                          });
                      }
                    }}
                    isLoading={isAnalyzing}
                  >
                    Analyze Now
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default BookmarkAnalysisPage; 