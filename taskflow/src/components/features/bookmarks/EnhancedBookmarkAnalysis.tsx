import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Badge,
  Flex,
  Spinner,
  VStack,
  HStack,
  Tag,
  TagLabel,
  Button,
  useColorModeValue,
  Divider,
  Alert,
  AlertIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import { FiExternalLink, FiRefreshCw, FiCpu, FiTag, FiInfo } from 'react-icons/fi';
import { contentAnalysisService } from '../../../services/contentAnalysisService';
import type { Bookmark } from '../../../models/Bookmark';
import ThoughtProcessViewer from './ThoughtProcessViewer';

interface EnhancedBookmarkAnalysisProps {
  bookmark: Bookmark;
  onUpdateTags?: (bookmarkId: string, tags: string[]) => Promise<void>;
  onClose?: () => void;
}

const EnhancedBookmarkAnalysis: React.FC<EnhancedBookmarkAnalysisProps> = ({
  bookmark,
  onUpdateTags,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([...bookmark.tags]);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Analyze bookmark when component mounts
  useEffect(() => {
    analyzeBookmark();
  }, [bookmark.id]);
  
  // Function to run analysis
  const analyzeBookmark = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await contentAnalysisService.analyzeBookmark(bookmark);
      setAnalysis(result);
      
      // Auto-select new tags if they're not already selected
      if (result.suggestedTags) {
        setSelectedTags(prev => {
          const newTags = [...prev];
          result.suggestedTags.forEach((tag: string) => {
            if (!newTags.includes(tag)) {
              newTags.push(tag);
            }
          });
          return newTags;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze bookmark');
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle a tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };
  
  // Save updated tags
  const saveUpdatedTags = async () => {
    if (!onUpdateTags) return;
    
    try {
      await onUpdateTags(bookmark.id, selectedTags);
    } catch (err) {
      console.error('Failed to update tags:', err);
    }
  };
  
  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Analyzing bookmark content...</Text>
        <Text fontSize="sm" mt={2} color="gray.500">
          This may take a moment as we process the content with AI.
        </Text>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={6}>
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
        <Button leftIcon={<FiRefreshCw />} onClick={analyzeBookmark}>
          Try Again
        </Button>
      </Box>
    );
  }
  
  if (!analysis) {
    return (
      <Box p={6}>
        <Alert status="warning">
          <AlertIcon />
          No analysis available for this bookmark.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box p={6} bg={bgColor} borderRadius="lg" borderColor={borderColor} borderWidth="1px">
      <VStack spacing={4} align="stretch">
        {/* Header with bookmark info */}
        <Box>
          <Heading size="md" mb={2}>{bookmark.title}</Heading>
          <Flex align="center">
            <Text fontSize="sm" color="gray.500" mr={2}>
              {bookmark.url}
            </Text>
            <Button
              as="a"
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              leftIcon={<FiExternalLink />}
              variant="ghost"
            >
              Open
            </Button>
          </Flex>
        </Box>
        
        <Divider />
        
        {/* Main analysis summary */}
        <Box>
          <HStack mb={3}>
            <FiCpu />
            <Heading size="sm">AI Analysis</Heading>
          </HStack>
          
          <Box mb={4} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
            <Heading size="xs" mb={2}>Summary</Heading>
            <Text>{analysis.summary}</Text>
          </Box>
          
          {analysis.keypoints && analysis.keypoints.length > 0 && (
            <Box mb={4}>
              <Heading size="xs" mb={2}>Key Points</Heading>
              <VStack align="start" spacing={1}>
                {analysis.keypoints.map((point: string, idx: number) => (
                  <Text key={idx} fontSize="sm">• {point}</Text>
                ))}
              </VStack>
            </Box>
          )}
          
          <Flex wrap="wrap" gap={2} mb={4}>
            {analysis.categories?.map((category: string, idx: number) => (
              <Badge key={idx} colorScheme="purple">
                {category}
              </Badge>
            ))}
          </Flex>
        </Box>
        
        <Divider />
        
        {/* Tag management */}
        <Box>
          <HStack mb={3}>
            <FiTag />
            <Heading size="sm">Tags</Heading>
          </HStack>
          
          <Text fontSize="sm" mb={2}>
            Select tags to apply to this bookmark:
          </Text>
          
          <Flex wrap="wrap" gap={2} mb={4}>
            {/* Original tags */}
            {bookmark.tags.map(tag => (
              <Tag 
                key={`original-${tag}`}
                colorScheme={selectedTags.includes(tag) ? "blue" : "gray"}
                variant={selectedTags.includes(tag) ? "solid" : "outline"}
                cursor="pointer"
                onClick={() => toggleTag(tag)}
              >
                <TagLabel>{tag}</TagLabel>
              </Tag>
            ))}
            
            {/* Suggested tags from AI (if not already in original tags) */}
            {analysis.suggestedTags?.filter((tag: string) => !bookmark.tags.includes(tag)).map((tag: string) => (
              <Tag 
                key={`suggested-${tag}`}
                colorScheme={selectedTags.includes(tag) ? "green" : "gray"}
                variant={selectedTags.includes(tag) ? "solid" : "outline"}
                cursor="pointer"
                onClick={() => toggleTag(tag)}
              >
                <TagLabel>{tag}</TagLabel>
              </Tag>
            ))}
          </Flex>
          
          {onUpdateTags && (
            <Button 
              size="sm" 
              colorScheme="blue" 
              onClick={saveUpdatedTags}
              isDisabled={
                selectedTags.length === bookmark.tags.length && 
                selectedTags.every(tag => bookmark.tags.includes(tag))
              }
            >
              Update Tags
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {/* Additional analysis in accordion */}
        <Accordion allowToggle>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <HStack>
                    <FiInfo />
                    <Text>Additional Analysis</Text>
                  </HStack>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <VStack align="start" spacing={3}>
                {analysis.mainTopic && (
                  <Box>
                    <Text fontWeight="bold">Main Topic:</Text>
                    <Text>{analysis.mainTopic}</Text>
                  </Box>
                )}
                
                {analysis.sentiment && (
                  <Box>
                    <Text fontWeight="bold">Content Sentiment:</Text>
                    <Badge colorScheme={
                      analysis.sentiment === 'positive' ? 'green' : 
                      analysis.sentiment === 'negative' ? 'red' : 'gray'
                    }>
                      {analysis.sentiment}
                    </Badge>
                  </Box>
                )}
                
                {analysis.contentType && (
                  <Box>
                    <Text fontWeight="bold">Content Type:</Text>
                    <Text>{analysis.contentType}</Text>
                  </Box>
                )}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
        
        {/* Display thought process if available */}
        {analysis.thoughtProcess && (
          <>
            <Divider my={4} />
            <ThoughtProcessViewer 
              thoughtProcess={analysis.thoughtProcess}
              confidence={analysis.confidence}
            />
          </>
        )}
        
        {/* Actions */}
        <HStack justifyContent="space-between">
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={analyzeBookmark}
            size="sm"
            variant="outline"
          >
            Refresh Analysis
          </Button>
          
          {onClose && (
            <Button onClick={onClose} size="sm">
              Close
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

export default EnhancedBookmarkAnalysis; 