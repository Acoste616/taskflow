import { apiBookmarkService, apiFolderService, apiTagService } from '../services/bookmarkService';

// Dodaj nową funkcję do komponentu formularza, która będzie analizować zakładkę
const analyzeBookmark = async () => {
  if (!formData.title || !formData.url) {
    toast({
      title: 'Błąd analizy',
      description: 'Tytuł i URL są wymagane do analizy',
      status: 'error',
      duration: 3000,
      isClosable: true
    });
    return;
  }
  
  setIsLoading(true);
  
  try {
    // Wywołaj API analizy
    const result = await apiBookmarkService.analyze({
      title: formData.title,
      link: formData.url
    });
    
    // Aktualizuj formularz o sugerowane wartości
    setFormData(prev => ({
      ...prev,
      tags: result.tags || [],
      folder: result.suggestedFolder || prev.folder,
      description: result.summary || prev.description,
      category: result.category || prev.category,
      group: result.group || prev.group,
      status: result.status || 'Do przeczytania'
    }));
    
    toast({
      title: 'Analiza zakończona',
      description: 'Automatycznie dodano tagi i kategorię',
      status: 'success',
      duration: 3000,
      isClosable: true
    });
  } catch (error) {
    console.error('Błąd analizy zakładki:', error);
    toast({
      title: 'Błąd analizy',
      description: 'Nie udało się zanalizować zakładki. Spróbuj ponownie później.',
      status: 'error',
      duration: 3000,
      isClosable: true
    });
  } finally {
    setIsLoading(false);
  }
};

// Dodaj przycisk analizy w formularzu, przed przyciskiem "Zapisz"
<Button 
  onClick={analyzeBookmark}
  colorScheme="teal"
  isLoading={isLoading}
  mr={2}
  leftIcon={<Icon as={FaRobot} />}
>
  Analizuj
</Button> 