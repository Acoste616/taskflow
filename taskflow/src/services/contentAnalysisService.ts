import { type Bookmark } from '../models/Bookmark';

/**
 * Konfiguracja lokalnego LLM
 */
const LOCAL_LLM_CONFIG = {
  endpoint: 'http://localhost:1234/v1/chat/completions',
  // Dodajemy alternatywne endpointy
  alternativeEndpoints: [
    'http://localhost:1234/v1/completions',  // LM Studio alternatywny endpoint
    'http://localhost:11434/api/generate',   // Ollama
    'http://localhost:5000/v1/completions'   // Text Generation WebUI
  ],
  model: 'local-model',  // Zmień na nazwę twojego modelu w LM Studio
  maxTokens: 1500,        // Zwiększamy limit tokenów
  temperature: 0.1,       // Obniżamy temperaturę dla bardziej deterministycznych wyników
  timeout: 30000,         // Zwiększamy timeout do 30 sekund
  retryCount: 3,          // Dodajemy liczbę ponownych prób
  retryDelay: 1000        // Opóźnienie między ponownymi próbami (ms)
};

/**
 * Types of content for specialized analysis
 */
export enum ContentType {
  YOUTUBE = 'youtube',
  TWITTER = 'twitter',
  GITHUB = 'github',
  MEDIUM = 'medium',
  LINKEDIN = 'linkedin',
  REDDIT = 'reddit',
  NEWS = 'news',
  GENERAL = 'general',
}

/**
 * Categories for content classification
 */
export enum ContentCategory {
  TECHNOLOGY = 'technology',
  BUSINESS = 'business',
  FINANCE = 'finance',
  SCIENCE = 'science',
  AI = 'ai',
  DEVELOPMENT = 'development',
  ENTERTAINMENT = 'entertainment',
  MEMES = 'memes',
  HEALTH = 'health',
  NEWS = 'news',
  SOCIAL = 'social',
  EDUCATION = 'education',
  OTHER = 'other',
}

/**
 * Content analysis result
 */
export interface ContentAnalysis {
  title: string;
  description: string;
  summary: string;
  mainTopic: string;
  contentType: ContentType;
  categories: ContentCategory[];
  keypoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  suggestedTags: string[];
  contentValue?: 'wysoka' | 'średnia' | 'niska';
  suggestedFolder?: string;
  analyzed: boolean;
  lastAnalyzed: Date;
  error?: string;
  confidence?: number;
  thoughtProcess?: {
    initial: string;
    refined: string;
  };
}

/**
 * Cache structure for content analysis
 */
interface AnalysisCache {
  [url: string]: {
    analysis: ContentAnalysis;
    timestamp: number;
  };
}

/**
 * Content Analysis Service - Provides detailed analysis of bookmarked content
 */
export class ContentAnalysisService {
  private cache: AnalysisCache = {};
  private cacheLifetime = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  private isLLMAvailable = false;
  private readonly CACHE_KEY = 'content-analysis-cache';
  private workingEndpoint: string = LOCAL_LLM_CONFIG.endpoint;
  private connectionError: string | null = null;

  constructor() {
    this.loadCache();
    console.log('ContentAnalysisService initialized, checking LLM connection...');
    // Uncomment below line to disable LLM and work in fallback mode
    // this.isLLMAvailable = false;
    this.checkLLMConnection();
  }

  /**
   * Check if local LLM is available and responsive
   */
  private async checkLLMConnection(): Promise<void> {
    this.connectionError = null;
    
    // Najpierw sprawdzamy domyślny endpoint
    let connected = await this.testEndpoint(LOCAL_LLM_CONFIG.endpoint);
    
    // Jeśli domyślny nie działa, sprawdzamy alternatywne
    if (!connected) {
      for (const endpoint of LOCAL_LLM_CONFIG.alternativeEndpoints) {
        connected = await this.testEndpoint(endpoint);
        if (connected) {
          this.workingEndpoint = endpoint;
          break;
        }
      }
    }
    
    this.isLLMAvailable = connected;
    console.log(`Local LLM connection test: ${this.isLLMAvailable ? 'Success' : 'Failed'}`);
    
    if (this.isLLMAvailable) {
      console.log(`Using LLM endpoint: ${this.workingEndpoint}`);
      this.connectionError = null;
    } else {
      this.connectionError = "Nie można połączyć się z lokalnym modelem LLM. Upewnij się, że LM Studio jest uruchomione i model jest załadowany.";
      console.error(this.connectionError);
    }
  }
  
  /**
   * Sprawdź połączenie z LM Studio (endpoint: http://127.0.0.1:1234)
   */
  public async checkLMStudioConnection(): Promise<{ connected: boolean, message: string }> {
    const lmStudioEndpoint = 'http://localhost:1234/v1/chat/completions';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Sprawdź, czy LM Studio API jest dostępne
      const response = await fetch(lmStudioEndpoint, {
        method: 'HEAD',
        signal: controller.signal
      }).catch(() => null);
      
      clearTimeout(timeoutId);
      
      if (!response) {
        return { 
          connected: false, 
          message: "LM Studio nie jest uruchomione lub jest niedostępne. Uruchom LM Studio i załaduj model." 
        };
      }
      
      // Test z rzeczywistym zapytaniem, aby sprawdzić czy model jest załadowany
      const modelResponse = await fetch(lmStudioEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "local-model",
          messages: [
            {"role": "system", "content": "You are a helpful AI assistant."},
            {"role": "user", "content": "Say one word: Connected"}
          ],
          max_tokens: 20,
          temperature: 0.1
        })
      });
      
      if (modelResponse.status === 404 || modelResponse.status === 400) {
        try {
          const errorData = await modelResponse.json();
          if (errorData.error && errorData.error.message && 
              (errorData.error.message.includes("No models loaded") || 
               errorData.error.code === "model_not_found")) {
            
            return { 
              connected: false, 
              message: "LM Studio jest uruchomione, ale nie załadowano modelu. Uruchom LM Studio i wykonaj następujące kroki:\n1. Przejdź do zakładki 'Models'\n2. Wybierz model z listy lub pobierz nowy\n3. Kliknij 'Load' aby załadować model\n4. Przejdź do zakładki 'Chat' i upewnij się, że model działa" 
            };
          }
        } catch (e) {
          console.error("Failed to parse error response", e);
        }
        
        return { 
          connected: false, 
          message: "LM Studio jest uruchomione, ale API zwraca błąd. Sprawdź czy model jest poprawnie załadowany." 
        };
      }
      
      // Teraz sprawdź, czy model jest załadowany
      const connected = await this.testEndpoint(lmStudioEndpoint);
      
      if (connected) {
        this.workingEndpoint = lmStudioEndpoint;
        this.isLLMAvailable = true;
        this.connectionError = null;
        return { 
          connected: true, 
          message: "Połączono z LM Studio pomyślnie." 
        };
      } else {
        return { 
          connected: false, 
          message: "LM Studio jest uruchomione, ale nie udało się uzyskać odpowiedzi z modelu. Upewnij się, że model jest załadowany i serwer API jest uruchomiony." 
        };
      }
    } catch (error) {
      console.error('Error checking LM Studio connection:', error);
      return { 
        connected: false, 
        message: `Błąd podczas łączenia z LM Studio: ${error instanceof Error ? error.message : 'Nieznany błąd'}` 
      };
    }
  }
  
  /**
   * Test pojedynczego endpointu LLM
   */
  private async testEndpoint(endpoint: string): Promise<boolean> {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Krótszy timeout dla testu
      
      const testPrompt = "You are a helpful AI assistant. Respond with one word: 'Connected'";
      
      // Format żądania zależy od endpointu
      let requestData;
      
      if (endpoint.includes('/v1/chat/completions')) {
        // Format zgodny z OpenAI Chat API
        requestData = {
          model: "local-model", // Fixed model name
          messages: [
            {"role": "system", "content": "You are a helpful AI assistant."},
            {"role": "user", "content": "Respond with one word: 'Connected'"}
          ],
          max_tokens: 20,
          temperature: 0.1
        };
      } else if (endpoint.includes('ollama')) {
        // Format Ollama
        requestData = {
          model: "llama2", // Common Ollama model 
          prompt: testPrompt,
          stream: false
        };
      } else {
        // Standardowy format completions
        requestData = {
          prompt: testPrompt,
          max_tokens: 20,
          temperature: 0.1
        };
      }
      
      console.log(`Sending request to ${endpoint}:`, requestData);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Response status: ${response.status}`);
      
      // Check if server is responding, even with an error
      if (response.status === 200) {
        const data = await response.json();
        console.log(`Response data:`, data);
        
        // LM Studio server appears to be running with some response
        // Check if this is a "No models loaded" error
        if (data.error && data.error.message && data.error.message.includes("No models loaded")) {
          console.warn(`LLM server is running but no models are loaded: ${endpoint}`);
          this.connectionError = "LM Studio uruchomione, ale nie załadowano modelu. Przejdź do LM Studio i załaduj model.";
          return false;
        }
        
        // If we get any text output, consider it successful 
        // (since the actual "Connected" response may vary by model)
        let responseText = '';
        
        if (data.choices && data.choices.length > 0) {
          responseText = data.choices[0].message?.content || data.choices[0].text || '';
        } else if (data.response) {
          responseText = data.response;
        } else if (data.generated_text) {
          responseText = data.generated_text;
        } else if (typeof data === 'string') {
          responseText = data;
        }
        
        console.log(`Extracted text: ${responseText}`);
        
        // Consider a non-empty response as successful
        if (responseText && responseText.length > 0) {
          return true;
        }
      } else if (response.status === 404 || response.status === 400) {
        // Check if this is a model not found error (common with LM Studio)
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message && 
              (errorData.error.message.includes("No models loaded") || 
               errorData.error.code === "model_not_found")) {
            console.warn(`LLM error: No models loaded at ${endpoint}`);
            this.connectionError = "LM Studio uruchomione, ale nie załadowano modelu. Przejdź do LM Studio i załaduj model.";
          }
        } catch (e) {
          // If we can't parse the error, just log it
          console.error("Failed to parse error response", e);
        }
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to connect to LLM endpoint ${endpoint}:`, error);
      return false;
    }
  }

  /**
   * Call local LLM endpoint with the given prompt
   */
  private async callLocalLLM(prompt: string): Promise<string> {
    if (!this.isLLMAvailable) {
      throw new Error('LLM is not available');
    }
    
    let lastError: Error | null = null;
    
    // Implementacja mechanizmu ponownych prób
    for (let attempt = 0; attempt < LOCAL_LLM_CONFIG.retryCount; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), LOCAL_LLM_CONFIG.timeout);
    
        // Dostosuj format żądania w zależności od endpointu
        let requestData;
        const endpoint = this.workingEndpoint;
        
        console.log(`Calling LLM endpoint: ${endpoint} (attempt ${attempt + 1}/${LOCAL_LLM_CONFIG.retryCount})`);
        
        if (endpoint.includes('/v1/chat/completions')) {
          // Format zgodny z OpenAI Chat API
          requestData = {
            model: LOCAL_LLM_CONFIG.model,
            messages: [
              {"role": "system", "content": "You are a helpful AI assistant specializing in content analysis."},
              {"role": "user", "content": prompt}
            ],
            max_tokens: LOCAL_LLM_CONFIG.maxTokens,
            temperature: LOCAL_LLM_CONFIG.temperature
          };
        } else if (endpoint.includes('ollama')) {
          // Format Ollama
          requestData = {
            model: LOCAL_LLM_CONFIG.model,
            prompt: prompt,
            options: {
              temperature: LOCAL_LLM_CONFIG.temperature
            },
            stream: false
          };
        } else {
          // Standardowy format completions
          requestData = {
            prompt: `<|system|>
You are a helpful AI assistant specializing in content analysis.
Return only a valid JSON object with the requested fields.
<|user|>
${prompt}
<|assistant|>`,
            max_tokens: LOCAL_LLM_CONFIG.maxTokens,
            temperature: LOCAL_LLM_CONFIG.temperature,
            stop: ["\n\n", "</s>", "<|user|>"]
          };
        }
    
        // Wysyłanie zapytania do lokalnego API
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          signal: controller.signal
        });
    
        clearTimeout(timeoutId);
    
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response from LLM: ${errorText}`);
          throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }
    
        const data = await response.json();
        console.log('LLM response received successfully');
        
        // Obsługa różnych formatów odpowiedzi
        if (data.choices && data.choices.length > 0) {
          // Format OpenAI-podobny (chat lub completion)
          return data.choices[0].message?.content || data.choices[0].text || '';
        } else if (data.response) {
          // Format Ollama
          return data.response;
        } else if (data.generated_text) {
          // Format HuggingFace
          return data.generated_text;
        } else if (typeof data === 'string') {
          return data;
        }
        
        // Jeśli nie rozpoznaliśmy formatu, zwracamy surowe dane
        return JSON.stringify(data);
      } catch (error) {
        console.error(`Error calling local LLM (attempt ${attempt + 1}/${LOCAL_LLM_CONFIG.retryCount}):`, error);
        
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Jeśli to nie ostatnia próba, poczekaj przed ponownym wywołaniem
        if (attempt < LOCAL_LLM_CONFIG.retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, LOCAL_LLM_CONFIG.retryDelay));
        }
      }
    }
    
    throw lastError || new Error('Failed to call LLM after multiple attempts');
  }

  /**
   * Analyze a bookmark's content
   * @param bookmark Bookmark to analyze
   * @returns Analysis result with description, categories, etc.
   */
  public async analyzeBookmark(bookmark: Bookmark): Promise<ContentAnalysis> {
    // Check cache first
    const cachedAnalysis = this.getCachedAnalysis(bookmark.url);
    if (cachedAnalysis) {
      return cachedAnalysis;
    }

    try {
      // Determine content type for specialized analysis
      const contentType = this.determineContentType(bookmark.url);
      
      // Set default analysis
      let analysis: ContentAnalysis = {
        title: bookmark.title,
        description: bookmark.description,
        summary: '',
        mainTopic: '',
        contentType,
        categories: [],
        keypoints: [],
        sentiment: 'neutral',
        suggestedTags: [...bookmark.tags],
        contentValue: undefined,
        suggestedFolder: undefined,
        analyzed: false,
        lastAnalyzed: new Date(),
      };

      // Use different methods based on content type
      switch (contentType) {
        case ContentType.YOUTUBE:
          analysis = await this.analyzeYouTubeContent(bookmark, analysis);
          break;
        case ContentType.TWITTER:
          analysis = await this.analyzeTwitterContent(bookmark, analysis);
          break;
        case ContentType.GITHUB:
          analysis = await this.analyzeGitHubContent(bookmark, analysis);
          break;
        default:
          analysis = await this.analyzeGeneralContent(bookmark, analysis);
      }

      // Cache the result
      this.cacheAnalysis(bookmark.url, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing content:', error);
      return {
        title: bookmark.title,
        description: bookmark.description,
        summary: '',
        mainTopic: '',
        contentType: ContentType.GENERAL,
        categories: [],
        keypoints: [],
        sentiment: 'neutral',
        suggestedTags: [...bookmark.tags],
        contentValue: undefined,
        suggestedFolder: undefined,
        analyzed: false,
        lastAnalyzed: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error analyzing content',
      };
    }
  }

  /**
   * Determine content type based on URL
   */
  private determineContentType(url: string): ContentType {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return ContentType.YOUTUBE;
    } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
      return ContentType.TWITTER;
    } else if (urlLower.includes('github.com')) {
      return ContentType.GITHUB;
    } else if (urlLower.includes('medium.com')) {
      return ContentType.MEDIUM;
    } else if (urlLower.includes('linkedin.com')) {
      return ContentType.LINKEDIN;
    } else if (urlLower.includes('reddit.com')) {
      return ContentType.REDDIT;
    } else if (
      urlLower.includes('news.') || 
      urlLower.includes('bbc.') || 
      urlLower.includes('cnn.') || 
      urlLower.includes('reuters.') ||
      urlLower.includes('nytimes.')
    ) {
      return ContentType.NEWS;
    }
    
    return ContentType.GENERAL;
  }

  /**
   * Analyze YouTube content using video ID and metadata
   */
  private async analyzeYouTubeContent(bookmark: Bookmark, analysis: ContentAnalysis): Promise<ContentAnalysis> {
    try {
      // Extract YouTube video ID
      const videoId = this.extractYouTubeId(bookmark.url);
      if (!videoId) {
        return this.analyzeGeneralContent(bookmark, analysis);
      }

      // Use YouTube Data API or extract metadata from oEmbed endpoint
      const videoInfo = await this.fetchYouTubeMetadata(videoId);
      
      if (videoInfo) {
        // Enhance analysis with video-specific information
        analysis.title = videoInfo.title || bookmark.title;
        analysis.description = videoInfo.description || bookmark.description;
        
        // Use LLM to analyze the video content from title and description
        analysis = await this.enhanceWithLLM(analysis, videoInfo.keywords, `YouTube video about: ${analysis.title}. ${analysis.description}`);
        
        // Add YouTube-specific tags
        analysis.suggestedTags = [...new Set([...analysis.suggestedTags, 'youtube', 'video'])];
      } else {
        // Fallback to general analysis
        analysis = await this.analyzeGeneralContent(bookmark, analysis);
      }
      
      analysis.analyzed = true;
      return analysis;
    } catch (error) {
      console.error('Error analyzing YouTube content:', error);
      return this.analyzeGeneralContent(bookmark, analysis);
    }
  }

  /**
   * Extract YouTube video ID from URL
   */
  private extractYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  /**
   * Fetch YouTube metadata using oEmbed endpoint
   */
  private async fetchYouTubeMetadata(videoId: string): Promise<any> {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch YouTube metadata: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching YouTube metadata:', error);
      return null;
    }
  }

  /**
   * Analyze Twitter/X content
   */
  private async analyzeTwitterContent(bookmark: Bookmark, analysis: ContentAnalysis): Promise<ContentAnalysis> {
    try {
      // Metadata extraction is limited without API, use general analysis with Twitter context
      analysis = await this.analyzeGeneralContent(bookmark, analysis);
      
      // Add Twitter-specific context
      analysis.contentType = ContentType.TWITTER;
      analysis.suggestedTags = [...new Set([...analysis.suggestedTags, 'twitter', 'social media'])];
      
      // Extract username from URL
      const twitterRegex = /twitter\.com\/([^\/\?]+)/i;
      const xRegex = /x\.com\/([^\/\?]+)/i;
      
      const twitterMatch = bookmark.url.match(twitterRegex);
      const xMatch = bookmark.url.match(xRegex);
      
      const username = twitterMatch ? twitterMatch[1] : xMatch ? xMatch[1] : null;
      if (username && username !== 'hashtag' && username !== 'search') {
        analysis.suggestedTags.push(`@${username}`);
      }
      
      analysis.analyzed = true;
      return analysis;
    } catch (error) {
      console.error('Error analyzing Twitter content:', error);
      return this.analyzeGeneralContent(bookmark, analysis);
    }
  }

  /**
   * Analyze GitHub content
   */
  private async analyzeGitHubContent(bookmark: Bookmark, analysis: ContentAnalysis): Promise<ContentAnalysis> {
    try {
      // Extract repo owner and name from URL
      const githubRegex = /github\.com\/([^\/]+)\/([^\/\?]+)/i;
      const match = bookmark.url.match(githubRegex);
      
      if (match) {
        const [, owner, repo] = match;
        const repoInfo = await this.fetchGitHubRepoMetadata(owner, repo);
        
        if (repoInfo) {
          analysis.title = repoInfo.name || bookmark.title;
          analysis.description = repoInfo.description || bookmark.description;
          analysis.mainTopic = 'Software Development';
          
          // Add programming languages as tags
          if (repoInfo.language) {
            analysis.suggestedTags.push(repoInfo.language.toLowerCase());
          }
          
          // Set categories
          analysis.categories = [ContentCategory.DEVELOPMENT, ContentCategory.TECHNOLOGY];
          
          // GitHub-specific tags
          analysis.suggestedTags = [...new Set([
            ...analysis.suggestedTags, 
            'github', 
            'repository', 
            'code'
          ])];
          
          // Use LLM to enhance description
          analysis = await this.enhanceWithLLM(analysis, analysis.suggestedTags, 
            `GitHub repository: ${analysis.title} by ${owner}. ${analysis.description}`);
        }
      }
      
      analysis.analyzed = true;
      return analysis;
    } catch (error) {
      console.error('Error analyzing GitHub content:', error);
      return this.analyzeGeneralContent(bookmark, analysis);
    }
  }

  /**
   * Fetch GitHub repository metadata
   */
  private async fetchGitHubRepoMetadata(owner: string, repo: string): Promise<any> {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch GitHub metadata: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching GitHub metadata:', error);
      return null;
    }
  }

  /**
   * Analyze general web content
   */
  private async analyzeGeneralContent(bookmark: Bookmark, analysis: ContentAnalysis): Promise<ContentAnalysis> {
    try {
      // Extract initial tags from the bookmark
      const initialTags = [...bookmark.tags];
      
      // Enhance analysis using LLM
      analysis = await this.enhanceWithLLM(analysis, initialTags, 
        `Web page: ${bookmark.title}. ${bookmark.description}`);
      
      analysis.analyzed = true;
      return analysis;
    } catch (error) {
      console.error('Error analyzing general content:', error);
      
      // Return basic analysis based on available information
      analysis.summary = bookmark.description || bookmark.title;
      analysis.analyzed = false;
      return analysis;
    }
  }

  /**
   * Enhance analysis using a local LLM with improved prompt
   */
  private async enhanceWithLLM(
    analysis: ContentAnalysis, 
    initialTags: string[], 
    contentContext: string
  ): Promise<ContentAnalysis> {
    // Check if local LLM is available
    if (!this.isLLMAvailable) {
      console.log('Local LLM not available, using rule-based analysis');
      return this.enhanceWithRules(analysis, initialTags || [], contentContext);
    }

    try {
      const prompt = `
Jesteś zaawansowanym narzędziem do analizy treści internetowych. Przeanalizuj dokładnie poniższą treść i zwróć kompleksową analizę.

TREŚĆ DO ANALIZY:
"""
${contentContext}
"""

ZADANIE:
Przeprowadź głęboką analizę powyższej treści i wyodrębnij następujące informacje:
1. Zwięzłe podsumowanie (1-2 zdania), które ujmuje sedno treści
2. Główny temat/zagadnienie treści (pojedyncze wyrażenie)
3. Kluczowe punkty (3-5 najważniejszych informacji z treści)
4. Kategorię treści (wybierz 2-4 najbardziej odpowiednie): technologia, biznes, finanse, nauka, ai, programowanie, rozrywka, memy, zdrowie, wiadomości, social media, edukacja, inne
5. Ocenę wydźwięku treści (pozytywny, negatywny lub neutralny)
6. Sugerowane tagi (5-7 krótkich słów kluczowych, które dobrze opisują treść)
7. Określ wartość merytoryczną treści (wysoka, średnia, niska)
8. Sugerowany folder dla organizacji tej zakładki
9. Poziom pewności analizy (wartość od 0.0 do 1.0)

FORMAT ODPOWIEDZI:
Swój tok myślenia umieść w sekcji <think>...</think>, a następnie zwróć odpowiedź jako poprawnie sformatowany obiekt JSON w bloku:

<think>
Tutaj opisz swój tok myślenia, jak analizujesz treść...
</think>

\`\`\`json
{
  "summary": "zwięzłe podsumowanie",
  "mainTopic": "główny temat",
  "keypoints": ["punkt 1", "punkt 2", "punkt 3"],
  "categories": ["kategoria1", "kategoria2"],
  "sentiment": "pozytywny|negatywny|neutralny",
  "contentValue": "wysoka|średnia|niska",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedFolder": "nazwa folderu",
  "confidence": 0.85
}
\`\`\`
      `;

      // Wywołaj lokalny LLM
      const responseContent = await this.callLocalLLM(prompt);

      if (responseContent && responseContent.trim()) {
        try {
          console.log('Raw response:', responseContent);
          
          // First, directly extract thinking process
          const thinkingProcess = this.extractThinkingProcess(responseContent);
          
          // Store thinking process if found
          if (thinkingProcess) {
            console.log(`Extracted thinking process (${thinkingProcess.length} chars)`);
            analysis.thoughtProcess = {
              initial: thinkingProcess,
              refined: ''
            };
          } else {
            console.log('No thinking process extracted');
          }
          
          // Next, extract and parse JSON
          const jsonContent = this.extractJSONFromResponse(responseContent);
          
          if (!jsonContent) {
            console.log('No JSON content found in response');
            // Return analysis with only the thinking process if we have it
            if (analysis.thoughtProcess) {
              // Use rule-based analysis for the rest of the fields
              const ruleBasedAnalysis = await this.enhanceWithRules(analysis, initialTags || [], contentContext);
              ruleBasedAnalysis.thoughtProcess = analysis.thoughtProcess;
              return ruleBasedAnalysis;
            }
            
            return this.enhanceWithRules(analysis, initialTags || [], contentContext);
          }
          
          // Parse JSON content
          try {
            const llmAnalysis = JSON.parse(jsonContent);
            
            // Update analysis with JSON content
            if (llmAnalysis.summary) analysis.summary = llmAnalysis.summary;
            if (llmAnalysis.mainTopic) analysis.mainTopic = llmAnalysis.mainTopic;
            if (llmAnalysis.keypoints && Array.isArray(llmAnalysis.keypoints)) {
              analysis.keypoints = llmAnalysis.keypoints.filter((point: any) => point && typeof point === 'string');
            }
            
            // Categories
            if (llmAnalysis.categories && Array.isArray(llmAnalysis.categories)) {
              const validCategories = llmAnalysis.categories
                .filter((cat: string) => cat && typeof cat === 'string')
                .map((cat: string) => this.mapToContentCategory(cat.toLowerCase()))
                .filter((cat: ContentCategory) => cat !== ContentCategory.OTHER || analysis.categories.length === 0);
              
              if (validCategories.length > 0) {
                analysis.categories = validCategories;
              }
            }
            
            // Sentiment
            if (llmAnalysis.sentiment && ['positive', 'negative', 'neutral'].includes(llmAnalysis.sentiment)) {
              analysis.sentiment = llmAnalysis.sentiment as 'positive' | 'negative' | 'neutral';
            }
            
            // Content value
            if (llmAnalysis.contentValue) {
              analysis.contentValue = llmAnalysis.contentValue;
            }
            
            // Suggested folder
            if (llmAnalysis.suggestedFolder) {
              analysis.suggestedFolder = llmAnalysis.suggestedFolder;
            }
            
            // Confidence
            if (llmAnalysis.confidence && typeof llmAnalysis.confidence === 'number') {
              analysis.confidence = llmAnalysis.confidence;
            }
            
            // Tags
            if (llmAnalysis.suggestedTags && Array.isArray(llmAnalysis.suggestedTags)) {
              const validTags = llmAnalysis.suggestedTags
                .filter((tag: string) => tag && typeof tag === 'string')
                .map((tag: string) => tag.toLowerCase().trim());
              
              // Combine tags, eliminating duplicates
              if (validTags.length > 0) {
                analysis.suggestedTags = [...new Set([...(initialTags || []), ...validTags])];
              }
            }
            
            // Mark analysis as completed
            analysis.analyzed = true;
          } catch (jsonError) {
            console.error('Error parsing JSON part:', jsonError);
            // Keep the thinking process but use rule-based for the rest
            const ruleBasedAnalysis = await this.enhanceWithRules(analysis, initialTags || [], contentContext);
            if (analysis.thoughtProcess) {
              ruleBasedAnalysis.thoughtProcess = analysis.thoughtProcess;
            }
            return ruleBasedAnalysis;
          }
        } catch (error) {
          console.error('Error processing LLM response:', error);
          return this.enhanceWithRules(analysis, initialTags || [], contentContext);
        }
      } else {
        console.warn('Empty LLM response, falling back to rule-based analysis');
        return this.enhanceWithRules(analysis, initialTags || [], contentContext);
      }

      return analysis;
    } catch (error) {
      console.error('Error in LLM analysis:', error);
      // On any error, use rule-based analysis
      return this.enhanceWithRules(analysis, initialTags || [], contentContext);
    }
  }
  
  /**
   * Extract thinking process from <think> tags
   */
  private extractThinkingProcess(response: string): string | null {
    try {
      // Direct check for <think> tag at the beginning
      if (response.trim().startsWith('<think>')) {
        console.log("Response starts with <think> tag");
        
        // Get everything between <think> and the first occurrence of ```json
        const endIndex = response.indexOf('```json');
        if (endIndex > -1) {
          const thinkContent = response.substring(7, endIndex).trim();
          console.log("Successfully extracted thinking content of length:", thinkContent.length);
          return thinkContent;
        }
      }
      
      // Fallback to regex patterns
      console.log("Trying regex patterns for think tag");
      
      // First try the standard format with closing tag
      const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkMatch && thinkMatch[1]) {
        console.log("Found thinking process with closing tag");
        return thinkMatch[1].trim();
      }
      
      // Try to match just the <think> tag up to the JSON block
      const simpleThinkMatch = response.match(/<think>([\s\S]*?)```json/);
      if (simpleThinkMatch && simpleThinkMatch[1]) {
        console.log("Found thinking process with simple match");
        return simpleThinkMatch[1].trim();
      }
      
      console.log("No thinking process found with current patterns");
      return null;
    } catch (error) {
      console.error('Error extracting thinking process:', error);
      return null;
    }
  }
  
  /**
   * Extract JSON content from LLM response
   * Handles different formats including <think> tags
   */
  private extractJSONFromResponse(response: string): string | null {
    try {
      // Direct extraction using ```json markers
      const jsonStart = response.indexOf('```json');
      if (jsonStart > -1) {
        const contentStart = jsonStart + 7; // Length of ```json
        const jsonEnd = response.indexOf('```', contentStart);
        
        if (jsonEnd > contentStart) {
          const jsonContent = response.substring(contentStart, jsonEnd).trim();
          console.log("Extracted JSON with direct method");
          return jsonContent;
        }
      }
      
      // Fallback to regex patterns
      console.log("Trying regex patterns for JSON");
      
      // Check for JSON code block format (```json ... ```)
      const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        console.log("Found JSON in code block");
        return codeBlockMatch[1].trim();
      }
      
      // Fallback: look for any JSON object in the response
      const jsonRegex = /(\{[\s\S]*\})/g;
      const matches = response.match(jsonRegex);
      
      if (matches && matches.length > 0) {
        console.log("Found JSON with regex, validating...");
        
        // Try the last match first (most likely to be the final result)
        for (let i = matches.length - 1; i >= 0; i--) {
          try {
            const match = matches[i];
            // Validate it's proper JSON
            JSON.parse(match);
            console.log(`Valid JSON found at match ${i+1}/${matches.length}`);
            return match;
          } catch (e) {
            console.log(`Match ${i+1} is not valid JSON`);
            // Continue to next match
          }
        }
      }
      
      console.log("No valid JSON found in response");
      return null;
    } catch (error) {
      console.error('Error extracting JSON from response:', error);
      return null;
    }
  }

  /**
   * Map string to ContentCategory enum
   */
  private mapToContentCategory(category: string): ContentCategory {
    const categoryMap: { [key: string]: ContentCategory } = {
      'technology': ContentCategory.TECHNOLOGY,
      'tech': ContentCategory.TECHNOLOGY,
      'business': ContentCategory.BUSINESS,
      'finance': ContentCategory.FINANCE,
      'money': ContentCategory.FINANCE,
      'investing': ContentCategory.FINANCE,
      'science': ContentCategory.SCIENCE,
      'scientific': ContentCategory.SCIENCE,
      'ai': ContentCategory.AI,
      'artificial intelligence': ContentCategory.AI,
      'machine learning': ContentCategory.AI,
      'development': ContentCategory.DEVELOPMENT,
      'programming': ContentCategory.DEVELOPMENT,
      'coding': ContentCategory.DEVELOPMENT,
      'software': ContentCategory.DEVELOPMENT,
      'entertainment': ContentCategory.ENTERTAINMENT,
      'fun': ContentCategory.ENTERTAINMENT,
      'gaming': ContentCategory.ENTERTAINMENT,
      'memes': ContentCategory.MEMES,
      'funny': ContentCategory.MEMES,
      'humor': ContentCategory.MEMES,
      'health': ContentCategory.HEALTH,
      'medical': ContentCategory.HEALTH,
      'fitness': ContentCategory.HEALTH,
      'wellness': ContentCategory.HEALTH,
      'news': ContentCategory.NEWS,
      'current events': ContentCategory.NEWS,
      'social': ContentCategory.SOCIAL,
      'social media': ContentCategory.SOCIAL,
      'education': ContentCategory.EDUCATION,
      'learning': ContentCategory.EDUCATION,
      'tutorial': ContentCategory.EDUCATION,
      'course': ContentCategory.EDUCATION
    };

    return categoryMap[category] || ContentCategory.OTHER;
  }

  /**
   * Rule-based fallback for content analysis
   */
  private enhanceWithRules(
    analysis: ContentAnalysis, 
    initialTags: string[] = [], 
    contentContext: string
  ): Promise<ContentAnalysis> {
    return new Promise(resolve => {
      const lowerContent = contentContext.toLowerCase();
      
      // Derive categories from content text
      const categories: ContentCategory[] = [];
      const categoriesChecks = [
        { terms: ['programming', 'code', 'developer', 'software', 'web', 'app'], category: ContentCategory.DEVELOPMENT },
        { terms: ['tech', 'technology', 'digital'], category: ContentCategory.TECHNOLOGY },
        { terms: ['ai', 'machine learning', 'neural', 'deep learning', 'artificial intelligence'], category: ContentCategory.AI },
        { terms: ['business', 'company', 'startup', 'entrepreneur'], category: ContentCategory.BUSINESS },
        { terms: ['finance', 'money', 'investing', 'stock', 'market'], category: ContentCategory.FINANCE },
        { terms: ['science', 'research', 'study', 'scientific'], category: ContentCategory.SCIENCE },
        { terms: ['health', 'medical', 'fitness', 'wellness'], category: ContentCategory.HEALTH },
        { terms: ['news', 'current events', 'latest'], category: ContentCategory.NEWS },
        { terms: ['meme', 'funny', 'humor', 'jokes'], category: ContentCategory.MEMES },
        { terms: ['entertainment', 'movie', 'tv', 'music', 'game'], category: ContentCategory.ENTERTAINMENT },
        { terms: ['education', 'learn', 'course', 'tutorial'], category: ContentCategory.EDUCATION },
        { terms: ['social', 'community', 'people', 'network'], category: ContentCategory.SOCIAL },
      ];
      
      // Check for each category terms
      categoriesChecks.forEach(check => {
        const hasCategory = check.terms.some(term => lowerContent.includes(term));
        if (hasCategory) {
          categories.push(check.category);
        }
      });
      
      // If no categories detected, add OTHER
      if (categories.length === 0) {
        categories.push(ContentCategory.OTHER);
      }
      
      // Generate a simple summary from title and description
      const summary = analysis.title || '';
      
      // Get sentiment based on positive/negative word matching
      const positiveWords = ['great', 'awesome', 'excellent', 'good', 'best', 'positive', 'amazing'];
      const negativeWords = ['bad', 'terrible', 'worst', 'negative', 'problem', 'issue', 'fail'];
      
      const positiveMatches = positiveWords.filter(word => lowerContent.includes(word)).length;
      const negativeMatches = negativeWords.filter(word => lowerContent.includes(word)).length;
      
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (positiveMatches > negativeMatches) {
        sentiment = 'positive';
      } else if (negativeMatches > positiveMatches) {
        sentiment = 'negative';
      }
      
      // Generate suggested tags from content and existing categories
      const suggestedTags = [...(initialTags || [])];
      
      // Add category names as tags
      categories.forEach(category => {
        if (!suggestedTags.includes(category)) {
          suggestedTags.push(category);
        }
      });
      
      // Extract key topics from title words
      const titleWords = analysis.title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 3);
      
      // Add important title words as tags
      titleWords.forEach(word => {
        if (!suggestedTags.includes(word) && word.length > 3) {
          suggestedTags.push(word);
        }
      });
      
      // Update analysis with the derived information
      analysis.summary = summary;
      analysis.categories = categories;
      analysis.sentiment = sentiment;
      analysis.suggestedTags = [...new Set(suggestedTags)];
      analysis.mainTopic = categories[0] || ContentCategory.OTHER;
      analysis.keypoints = [analysis.description || ''];
      
      resolve(analysis);
    });
  }

  /**
   * Get cached analysis for a URL
   */
  private getCachedAnalysis(url: string): ContentAnalysis | null {
    const cached = this.cache[url];
    if (!cached) return null;
    
    // Check if cache is still valid
    const now = Date.now();
    if (now - cached.timestamp > this.cacheLifetime) {
      // Cache expired
      delete this.cache[url];
      return null;
    }
    
    return cached.analysis;
  }

  /**
   * Cache analysis result for a URL
   */
  private cacheAnalysis(url: string, analysis: ContentAnalysis): void {
    this.cache[url] = {
      analysis,
      timestamp: Date.now(),
    };
    
    this.saveCache();
  }

  /**
   * Save cache to localStorage
   */
  private saveCache(): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('Error saving content analysis cache:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadCache(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error loading content analysis cache:', error);
      this.cache = {};
    }
  }

  /**
   * Clear analysis cache
   */
  public clearCache(): void {
    this.cache = {};
    localStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Check if LLM is enabled
   */
  public isLLMEnabled(): boolean {
    return this.isLLMAvailable;
  }
  
  /**
   * Get current connection error if any
   */
  public getConnectionError(): string | null {
    return this.connectionError;
  }

  /**
   * Manually trigger LLM connection check and reset workingEndpoint
   */
  public async refreshLLMConnection(): Promise<boolean> {
    // Reset working endpoint to default
    this.workingEndpoint = LOCAL_LLM_CONFIG.endpoint;
    await this.checkLLMConnection();
    return this.isLLMAvailable;
  }

  /**
   * Process a batch of bookmarks for analysis
   * @param bookmarks Array of bookmarks to analyze
   * @param progressCallback Optional callback to track progress
   * @returns Promise resolving to a record of bookmark IDs and their analyses
   */
  public async analyzeBatch(
    bookmarks: Bookmark[], 
    progressCallback?: (processed: number, total: number) => void
  ): Promise<Record<string, ContentAnalysis>> {
    const results: Record<string, ContentAnalysis> = {};
    const total = bookmarks.length;
    
    // Process in batches of 3 to avoid overwhelming the LLM
    for (let i = 0; i < bookmarks.length; i += 3) {
      const batch = bookmarks.slice(i, i + 3);
      
      // Process batch concurrently
      const batchPromises = batch.map(bookmark => this.analyzeBookmark(bookmark));
      const batchResults = await Promise.all(batchPromises);
      
      // Store results
      batch.forEach((bookmark, index) => {
        results[bookmark.id] = batchResults[index];
      });
      
      // Call progress callback if provided
      if (progressCallback) {
        progressCallback(Math.min(i + 3, total), total);
      }
      
      // Throttle requests to not overwhelm the LLM
      if (i + 3 < bookmarks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Wyłącz LLM i przejdź w tryb analizy opartej na regułach
   */
  public disableLLM(): void {
    this.isLLMAvailable = false;
    console.log('LLM disabled, switching to rule-based analysis only');
  }
}

// Export singleton instance
export const contentAnalysisService = new ContentAnalysisService(); 