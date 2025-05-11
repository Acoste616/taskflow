import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
  VStack,
  Heading,
  Text,
  Tag,
  TagLabel,
  Flex,
  Divider,
  Badge,
  Textarea,
  Icon,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  HStack
} from '@chakra-ui/react';
import { FaRobot, FaTag, FaFolder, FaCheck, FaExternalLinkAlt } from 'react-icons/fa';
import { apiBookmarkService } from '../services/bookmarkService';
import { useBookmarkContext } from '../contexts/BookmarkContext';

interface AnalysisResult {
  title: string;
  category: string;
  group: string;
  status: string;
  link: string;
  tags: string[];
  summary: string;
  suggestedFolder: string;
}

const BookmarkAnalysis: React.FC = () => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const toast = useToast();
  const { refreshBookmarks } = useBookmarkContext();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const tagColorScheme = useColorModeValue('teal', 'cyan');
  
  const handleAnalyze = async () => {
    if (!url) {
      toast({
        title: 'URL wymagany',
        description: 'Wprowadź adres URL strony do analizy',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await apiBookmarkService.analyze({
        title: title || undefined,
        link: url
      });
      
      setAnalysisResult(result);
      
      toast({
        title: 'Analiza zakończona',
        description: 'Strona została przeanalizowana przez LLM',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Błąd podczas analizy:', error);
      toast({
        title: 'Błąd analizy',
        description: 'Nie udało się przeanalizować strony. Sprawdź, czy LM Studio jest uruchomione.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!analysisResult) return;
    
    try {
      // Przygotuj dane do wysłania
      const bookmarkToSave = {
        title: analysisResult.title,
        category: analysisResult.category,
        group: analysisResult.group,
        status: analysisResult.status,
        link: analysisResult.link,
        summary: analysisResult.summary,
        tags: analysisResult.tags.map(tag => ({ name: tag })),
        folder: analysisResult.suggestedFolder ? { name: analysisResult.suggestedFolder } : null
      };
      
      console.log('Wysyłam dane:', bookmarkToSave);
      
      const savedBookmark = await apiBookmarkService.create(bookmarkToSave);
      
      console.log('Otrzymana odpowiedź:', savedBookmark);
      
      // Odśwież dane w kontekście
      await refreshBookmarks();
      
      toast({
        title: 'Zakładka zapisana',
        description: 'Zakładka została dodana do kolekcji',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form
      setUrl('');
      setTitle('');
      setAnalysisResult(null);
    } catch (error: any) {
      console.error('Błąd podczas zapisywania:', error);
      
      // Pokaż bardziej szczegółowy błąd
      let errorMessage = 'Nie udało się zapisać zakładki.';
      if (error.response) {
        errorMessage += ` Status: ${error.response.status}. Błąd: ${JSON.stringify(error.response.data)}`;
      }
      
      toast({
        title: 'Błąd zapisywania',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Box p={5}>
      <Heading mb={6}>Analiza Zakładek AI</Heading>
      
      <VStack spacing={4} align="stretch" mb={6}>
        <FormControl>
          <FormLabel>URL Strony</FormLabel>
          <Input 
            placeholder="https://example.com" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>Tytuł (opcjonalnie)</FormLabel>
          <Input 
            placeholder="Tytuł strony (zostaw puste dla automatycznej detekcji)" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormControl>
        
        <Button
          leftIcon={<Icon as={FaRobot} />}
          colorScheme="teal"
          isLoading={isLoading}
          onClick={handleAnalyze}
        >
          Analizuj Stronę
        </Button>
      </VStack>
      
      {analysisResult && (
        <Card bg={cardBg} shadow="md" mb={6}>
          <CardHeader>
            <Heading size="md">Wynik Analizy</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Heading size="sm">Tytuł</Heading>
                <Text>{analysisResult.title}</Text>
              </Box>
              
              <Divider />
              
              <Box>
                <Heading size="sm">Adres URL</Heading>
                <Flex align="center">
                  <Text mr={2}>{analysisResult.link}</Text>
                  <Icon 
                    as={FaExternalLinkAlt} 
                    color="blue.500" 
                    cursor="pointer" 
                    onClick={() => window.open(analysisResult.link, '_blank')}
                  />
                </Flex>
              </Box>
              
              <Divider />
              
              <Box>
                <Heading size="sm">Kategoria</Heading>
                <Badge colorScheme="purple">{analysisResult.category}</Badge>
                {analysisResult.group && (
                  <Badge ml={2} colorScheme="blue">{analysisResult.group}</Badge>
                )}
              </Box>
              
              <Box>
                <Heading size="sm">Status</Heading>
                <Badge colorScheme="orange">{analysisResult.status}</Badge>
              </Box>
              
              <Box>
                <Heading size="sm">
                  <Flex align="center">
                    <Icon as={FaTag} mr={2} />
                    Sugerowane Tagi
                  </Flex>
                </Heading>
                <HStack spacing={2} mt={2} flexWrap="wrap">
                  {analysisResult.tags.map((tag, index) => (
                    <Tag key={index} colorScheme={tagColorScheme} m={1}>
                      <TagLabel>{tag}</TagLabel>
                    </Tag>
                  ))}
                </HStack>
              </Box>
              
              <Box>
                <Heading size="sm">
                  <Flex align="center">
                    <Icon as={FaFolder} mr={2} />
                    Sugerowany Folder
                  </Flex>
                </Heading>
                <Text>{analysisResult.suggestedFolder}</Text>
              </Box>
              
              <Box>
                <Heading size="sm">Podsumowanie</Heading>
                <Textarea 
                  value={analysisResult.summary}
                  readOnly
                  height="100px"
                />
              </Box>
              
              <Button
                leftIcon={<Icon as={FaCheck} />}
                colorScheme="green"
                onClick={handleSave}
              >
                Zapisz Zakładkę
              </Button>
            </VStack>
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

export default BookmarkAnalysis; 