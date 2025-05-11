import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Badge,
  Flex,
  Spinner,
  Heading,
  Divider,
  VStack,
  HStack,
  Tag,
  TagLabel,
  TagLeftIcon,
  useColorModeValue,
  Button,
  Tooltip
} from '@chakra-ui/react';
import { FiInfo, FiCheckCircle, FiAlertCircle, FiTag, FiRefreshCw } from 'react-icons/fi';
import type { Bookmark } from '../../../models/Bookmark';
import { contentAnalysisService, type ContentAnalysis, ContentCategory } from '../../../services/contentAnalysisService';

interface BookmarkContentAnalysisProps {
  bookmark: Bookmark;
  isOpen: boolean;
}

const BookmarkContentAnalysis: React.FC<BookmarkContentAnalysisProps> = ({ bookmark, isOpen }) => {
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Kategorie z odpowiednimi kolorami
  const categoryColors: Record<ContentCategory, string> = {
    [ContentCategory.TECHNOLOGY]: 'blue',
    [ContentCategory.BUSINESS]: 'orange',
    [ContentCategory.FINANCE]: 'green',
    [ContentCategory.SCIENCE]: 'teal',
    [ContentCategory.AI]: 'purple',
    [ContentCategory.DEVELOPMENT]: 'cyan',
    [ContentCategory.ENTERTAINMENT]: 'pink',
    [ContentCategory.MEMES]: 'yellow',
    [ContentCategory.HEALTH]: 'green',
    [ContentCategory.NEWS]: 'red',
    [ContentCategory.SOCIAL]: 'linkedin',
    [ContentCategory.EDUCATION]: 'blue',
    [ContentCategory.OTHER]: 'gray'
  };
  
  // Analiza zawartości przy pierwszym otwarciu lub zmianie URL
  useEffect(() => {
    if (isOpen && bookmark && !analysis) {
      analyzeContent();
    }
  }, [isOpen, bookmark]);
  
  // Analiza zawartości zakładki
  const analyzeContent = async () => {
    if (!bookmark) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await contentAnalysisService.analyzeBookmark(bookmark);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas analizy treści');
      console.error('Błąd analizy:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Odświeżenie analizy
  const refreshAnalysis = () => {
    // Wyczyść poprzednią analizę
    setAnalysis(null);
    // Rozpocznij nową analizę
    analyzeContent();
  };
  
  // Wygeneruj ikonę dla kategorii
  const getCategoryIcon = (category: ContentCategory) => {
    return <FiInfo />;
  };
  
  // Wyświetl ikony nastroju
  const renderSentimentIcon = () => {
    if (!analysis) return null;
    
    switch (analysis.sentiment) {
      case 'positive':
        return <FiCheckCircle color="green" />;
      case 'negative':
        return <FiAlertCircle color="red" />;
      default:
        return <FiInfo color="gray" />;
    }
  };
  
  // Gdy zawartość jest analizowana
  if (isLoading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner size="md" />
        <Text mt={2}>Analizowanie zawartości...</Text>
      </Box>
    );
  }
  
  // Jeśli wystąpił błąd
  if (error) {
    return (
      <Box p={4}>
        <Flex align="center" color="red.500" mb={2}>
          <FiAlertCircle style={{ marginRight: '8px' }} />
          <Text fontWeight="bold">Błąd analizy</Text>
        </Flex>
        <Text fontSize="sm">{error}</Text>
        <Button 
          leftIcon={<FiRefreshCw />} 
          size="sm" 
          mt={3} 
          colorScheme="blue" 
          onClick={refreshAnalysis}
        >
          Spróbuj ponownie
        </Button>
      </Box>
    );
  }
  
  // Jeśli nie ma analizy
  if (!analysis) {
    return null;
  }
  
  return (
    <Box
      p={4}
      rounded="md"
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      width="100%"
    >
      {/* Główny temat */}
      {analysis.mainTopic && (
        <Flex align="center" mb={3}>
          <Text fontSize="sm" fontWeight="bold" color="gray.500" mr={2}>
            Główny temat:
          </Text>
          <Heading size="sm">{analysis.mainTopic}</Heading>
        </Flex>
      )}
      
      {/* Podsumowanie */}
      {analysis.summary && (
        <Box mb={3}>
          <Text fontSize="sm" fontWeight="bold" color="gray.500" mb={1}>
            Podsumowanie:
          </Text>
          <Text>{analysis.summary}</Text>
        </Box>
      )}
      
      {/* Główne punkty */}
      {analysis.keypoints && analysis.keypoints.length > 0 && (
        <Box mb={3}>
          <Text fontSize="sm" fontWeight="bold" color="gray.500" mb={1}>
            Kluczowe informacje:
          </Text>
          <VStack align="start" spacing={1}>
            {analysis.keypoints.map((point, index) => (
              <Text key={index} fontSize="sm">• {point}</Text>
            ))}
          </VStack>
        </Box>
      )}
      
      <Divider my={3} />
      
      {/* Kategorie */}
      {analysis.categories && analysis.categories.length > 0 && (
        <Box mb={3}>
          <Text fontSize="sm" fontWeight="bold" color="gray.500" mb={2}>
            Kategorie:
          </Text>
          <Flex flexWrap="wrap" gap={2}>
            {analysis.categories.map((category, index) => (
              <Tag 
                key={index} 
                size="md" 
                colorScheme={categoryColors[category]} 
                variant="subtle"
                borderRadius="full"
              >
                <TagLeftIcon as={() => getCategoryIcon(category)} />
                <TagLabel>{category}</TagLabel>
              </Tag>
            ))}
          </Flex>
        </Box>
      )}
      
      {/* Nastrój */}
      <Flex align="center" mb={3}>
        <Text fontSize="sm" fontWeight="bold" color="gray.500" mr={2}>
          Nastrój:
        </Text>
        <HStack>
          {renderSentimentIcon()}
          <Text fontSize="sm">
            {analysis.sentiment === 'positive' ? 'Pozytywny' : 
              analysis.sentiment === 'negative' ? 'Negatywny' : 'Neutralny'}
          </Text>
        </HStack>
      </Flex>
      
      {/* Sugerowane tagi */}
      {analysis.suggestedTags && analysis.suggestedTags.length > 0 && (
        <Box>
          <Flex align="center" mb={2}>
            <FiTag style={{ marginRight: '8px' }} />
            <Text fontSize="sm" fontWeight="bold" color="gray.500">
              Sugerowane tagi:
            </Text>
          </Flex>
          <Flex flexWrap="wrap" gap={1}>
            {analysis.suggestedTags.map((tag, index) => (
              <Badge 
                key={index} 
                borderRadius="full" 
                px={2} 
                py={1} 
                bg="gray.100" 
                color="gray.700"
                fontSize="xs"
              >
                {tag}
              </Badge>
            ))}
          </Flex>
        </Box>
      )}
      
      {/* Przycisk odświeżenia analizy */}
      <Box mt={4} textAlign="right">
        <Tooltip label="Odśwież analizę">
          <Button 
            size="xs" 
            leftIcon={<FiRefreshCw />} 
            variant="ghost"
            onClick={refreshAnalysis}
          >
            Odśwież
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default BookmarkContentAnalysis; 