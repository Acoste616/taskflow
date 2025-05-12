import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  Textarea,
  FormControl,
  FormLabel,
  Divider,
  Flex,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  HStack,
  ButtonGroup,
  Link,
  Icon
} from '@chakra-ui/react';
import { FiCpu, FiRefreshCw, FiLink, FiSave, FiDownload, FiExternalLink } from 'react-icons/fi';
import Layout from '../components/layout/Layout';
import ThoughtProcessViewer from '../components/features/bookmarks/ThoughtProcessViewer';
import { contentAnalysisService } from '../services/contentAnalysisService';
import { useBookmarkContext } from '../contexts/BookmarkContext';

const CoRTDemoPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);
  
  const toast = useToast();
  const { addBookmark } = useBookmarkContext();
  
  // Sprawdź status połączenia z LLM przy ładowaniu komponentu
  useEffect(() => {
    checkLLMConnection();
  }, []);
  
  // Funkcja sprawdzająca połączenie z LLM
  const checkLLMConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const result = await contentAnalysisService.checkLMStudioConnection();
      setConnectionStatus(result);
      
      if (!result.connected) {
        toast({
          title: 'Problem z połączeniem LLM',
          description: result.message,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      setConnectionStatus({
        connected: false,
        message: 'Błąd podczas sprawdzania połączenia z LLM'
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };
  
  const handleAnalyze = async () => {
    if (!url) {
      toast({
        title: 'URL wymagany',
        description: 'Proszę wprowadzić adres URL do analizy',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    // Sprawdź połączenie przed analizą
    if (!connectionStatus?.connected) {
      const result = await contentAnalysisService.checkLMStudioConnection();
      setConnectionStatus(result);
      
      if (!result.connected) {
        toast({
          title: 'Brak połączenia z LLM',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }
    
    setIsAnalyzing(true);
    try {
      // Stwórz mock bookmarku do analizy
      const mockBookmark = {
        id: 'demo',
        title: title || 'Demo Bookmark',
        url,
        description: '',
        tags: [],
        folder: '',
        favicon: '',
        isFavorite: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Uruchom analizę
      const analysisResult = await contentAnalysisService.analyzeBookmark(mockBookmark);
      
      // Log na konsolę dla debugowania procesu myślowego
      console.log("Analysis result:", analysisResult);
      console.log("Thought process available:", !!analysisResult.thoughtProcess);
      if (analysisResult.thoughtProcess) {
        console.log("Initial thoughts length:", analysisResult.thoughtProcess.initial?.length);
        console.log("Refined thoughts length:", analysisResult.thoughtProcess.refined?.length);
      }
      
      setResult(analysisResult);
      
      toast({
        title: 'Analiza zakończona',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Błąd analizy:', error);
      
      // Spróbuj sprawdzić czy problem jest z LLM
      await checkLLMConnection();
      
      toast({
        title: 'Analiza nieudana',
        description: error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Funkcja do zapisywania analizy jako zakładki
  const handleSaveAsBookmark = async () => {
    if (!result) return;
    
    setIsSaving(true);
    try {
      // Utwórz zakładkę z wynikami analizy
      await addBookmark({
        title: result.title || title || url,
        url: url,
        description: result.summary || '',
        tags: result.suggestedTags || [],
        folder: result.suggestedFolder || '',
        favicon: '',
        isFavorite: false,
        isArchived: false
      });
      
      toast({
        title: 'Zakładka zapisana',
        description: 'Analiza została zapisana jako zakładka',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Błąd podczas zapisywania',
        description: error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Funkcja do eksportu procesu myślowego jako pliku JSON
  const handleExportThoughtProcess = () => {
    if (!result || !result.thoughtProcess) return;
    
    try {
      // Utwórz obiekt do eksportu
      const exportData = {
        url: url,
        title: result.title || title,
        thoughtProcess: result.thoughtProcess,
        analysis: {
          summary: result.summary,
          keypoints: result.keypoints,
          categories: result.categories,
          tags: result.suggestedTags,
          confidence: result.confidence
        }
      };
      
      // Konwertuj do JSON
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      
      // Utwórz link do pobrania
      const link = document.createElement('a');
      link.href = href;
      link.download = `cort-analysis-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Posprzątaj
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      
      toast({
        title: 'Proces myślowy wyeksportowany',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Błąd podczas eksportu',
        description: error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd',
        status: 'error',
        duration: 5000,
      });
    }
  };
  
  return (
    <Layout>
      <Box mb={8}>
        <Heading mb={4}>Chain of Recursive Thoughts Demo</Heading>
        
        <Alert status="info" mb={6}>
          <AlertIcon />
          <Box>
            <AlertTitle mb={1}>O Chain of Recursive Thoughts (CoRT)</AlertTitle>
            <AlertDescription>
              Chain of Recursive Thoughts to technika, która umożliwia modelom LLM przeprowadzanie stopniowej, wieloetapowej analizy. 
              Model najpierw generuje początkowe przemyślenia, a następnie krytycznie analizuje swoje własne rozumowanie, 
              udoskonalając wnioski przed wydaniem ostatecznej oceny. Ta metoda zapewnia głębsze zrozumienie i lepszą kategoryzację treści.
            </AlertDescription>
          </Box>
        </Alert>
        
        {/* Alert o statusie połączenia z LLM */}
        {connectionStatus && !connectionStatus.connected && (
          <Alert status="warning" mb={6}>
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Problem z połączeniem LLM</AlertTitle>
              <AlertDescription display="block">
                {connectionStatus.message}
                <Box mt={2}>
                  <Text>Jak uruchomić LM Studio:</Text>
                  <VStack align="start" spacing={1} mt={1} ml={4}>
                    <Text>1. Uruchom LM Studio</Text>
                    <Text>2. Przejdź do zakładki "Models"</Text>
                    <Text>3. Wybierz i załaduj model (kliknij "Load")</Text>
                    <Text>4. Upewnij się, że serwer LM Studio nasłuchuje na porcie 1234</Text>
                    <Text>5. Kliknij przycisk "Sprawdź połączenie" poniżej</Text>
                  </VStack>
                </Box>
              </AlertDescription>
            </Box>
            <ButtonGroup>
              <Button 
                leftIcon={<FiRefreshCw />} 
                colorScheme="blue" 
                size="sm"
                onClick={checkLLMConnection}
                isLoading={isCheckingConnection}
              >
                Sprawdź połączenie
              </Button>
              <Button
                size="sm"
                colorScheme="orange"
                onClick={() => {
                  // Opcja do pracy bez LLM - używa tylko reguł
                  contentAnalysisService.disableLLM();
                  toast({
                    title: 'Tryb awaryjny włączony',
                    description: 'Analiza będzie działać bez LLM, z ograniczoną funkcjonalnością',
                    status: 'info',
                    duration: 5000,
                  });
                  
                  // Odśwież stan
                  setConnectionStatus({
                    connected: false,
                    message: "Tryb awaryjny - analiza działa bez LLM"
                  });
                }}
              >
                Tryb awaryjny (bez LLM)
              </Button>
            </ButtonGroup>
          </Alert>
        )}
        
        {/* Alert o pomyślnym połączeniu */}
        {connectionStatus && connectionStatus.connected && (
          <Alert status="success" mb={6}>
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Połączenie z LLM nawiązane</AlertTitle>
              <AlertDescription>
                Możesz teraz przeprowadzać analizy CoRT używając lokalnego modelu LLM.
              </AlertDescription>
            </Box>
          </Alert>
        )}
        
        <VStack spacing={6} align="stretch">
          <FormControl>
            <FormLabel>URL strony do analizy</FormLabel>
            <Input 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </FormControl>
          
          <FormControl>
            <FormLabel>Tytuł (opcjonalnie)</FormLabel>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tytuł strony"
            />
          </FormControl>
          
          <Button
            colorScheme="blue"
            leftIcon={<FiCpu />}
            onClick={handleAnalyze}
            isLoading={isAnalyzing}
            isDisabled={!connectionStatus?.connected}
          >
            Przeprowadź analizę CoRT
          </Button>
          
          {isAnalyzing && (
            <Flex justify="center" py={10}>
              <Spinner size="xl" />
              <Text ml={4}>Analizuję stronę przy użyciu Chain of Recursive Thoughts...</Text>
            </Flex>
          )}
          
          {result && (
            <Box mt={6}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Wyniki analizy</Heading>
                <ButtonGroup>
                  <Button 
                    size="sm" 
                    leftIcon={<FiSave />}
                    onClick={handleSaveAsBookmark}
                    isLoading={isSaving}
                    colorScheme="green"
                  >
                    Zapisz jako zakładkę
                  </Button>
                  {result.thoughtProcess && (
                    <Button 
                      size="sm" 
                      leftIcon={<FiDownload />}
                      onClick={handleExportThoughtProcess}
                      colorScheme="purple"
                    >
                      Eksportuj proces myślowy
                    </Button>
                  )}
                </ButtonGroup>
              </Flex>
              
              <Box p={4} borderWidth="1px" borderRadius="md">
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontWeight="bold">Tytuł:</Text>
                    <Text>{result.title}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Podsumowanie:</Text>
                    <Text>{result.summary}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Kategoria:</Text>
                    <Text>{result.categories?.join(', ')}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Sugerowane tagi:</Text>
                    <Flex gap={2} flexWrap="wrap">
                      {result.suggestedTags?.map((tag: string) => (
                        <Code key={tag} px={2} py={1} borderRadius="md">
                          {tag}
                        </Code>
                      ))}
                    </Flex>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Kluczowe punkty:</Text>
                    <Box>
                      {result.keypoints?.map((point: string, idx: number) => (
                        <Text key={idx}>• {point}</Text>
                      ))}
                    </Box>
                  </Box>
                  
                  <Divider />
                  
                  {/* Wyświetl proces myślowy */}
                  {result.thoughtProcess ? (
                    <ThoughtProcessViewer 
                      thoughtProcess={result.thoughtProcess}
                      confidence={result.confidence}
                    />
                  ) : (
                    <Alert status="warning">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Brak procesu myślowego</AlertTitle>
                        <AlertDescription>
                          Proces myślowy modelu nie został zwrócony przez API LLM. 
                          Upewnij się, że twój lokalny model LLM jest poprawnie skonfigurowany 
                          i obsługuje Chain of Recursive Thoughts.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              </Box>
            </Box>
          )}
          
          {/* Informacje pomocnicze */}
          {!result && (
            <Box mt={6} p={4} borderWidth="1px" borderRadius="md">
              <Heading size="sm" mb={3}>Jak działa CoRT?</Heading>
              <Text mb={3}>
                Chain of Recursive Thoughts (CoRT) to zaawansowana technika prompting, która umożliwia modelom 
                LLM na dwustopniową analizę treści:
              </Text>
              <Box pl={4} mb={3}>
                <Text>1. <strong>Początkowa analiza</strong> - model generuje pierwsze przemyślenia o treści</Text>
                <Text>2. <strong>Rekurencyjne udoskonalenie</strong> - model analizuje swoje własne pierwotne przemyślenia, ulepszając wnioski</Text>
                <Text>3. <strong>Finalna synteza</strong> - model tworzy ostateczną ocenę i kategoryzację treści</Text>
              </Box>
              <Text>
                Ta technika pomaga uzyskać głębsze, bardziej przemyślane analizy i jest szczególnie efektywna 
                przy kategoryzacji treści, wykrywaniu problemów rozumowania i pogłębianiu analizy.
              </Text>
              
              <Divider my={4} />
              
              <Heading size="sm" mb={3}>Wymagania techniczne:</Heading>
              <Text>• Uruchomione LM Studio z załadowanym modelem (Qwen, Mistral, Llama lub podobne)</Text>
              <Text>• API LM Studio aktywne na porcie 1234</Text>
              <Link href="https://lmstudio.ai/" isExternal color="blue.500" display="inline-flex" alignItems="center" mt={2}>
                Pobierz LM Studio <Icon as={FiExternalLink} mx="2px" />
              </Link>
            </Box>
          )}
        </VStack>
      </Box>
    </Layout>
  );
};

export default CoRTDemoPage; 