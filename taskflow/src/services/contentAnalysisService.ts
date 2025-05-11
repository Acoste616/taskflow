import { type Bookmark } from '../models/Bookmark';

/**
 * Konfiguracja lokalnego LLM
 */
const LOCAL_LLM_CONFIG = {
  endpoint: 'http://127.0.0.1:1234',
  // Dodajemy alternatywne endpointy
  alternativeEndpoints: [
    'http://127.0.0.1:8080/v1/chat/completions',  // LM Studio
    'http://127.0.0.1:11434/api/generate',        // Ollama
    'http://127.0.0.1:5000/v1/completions'        // Text Generation WebUI
  ],
  model: 'deepseek-llama',
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
  analyzed: boolean;
  lastAnalyzed: Date;
  error?: string;
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

  constructor() {
    this.loadCache();
    this.checkLLMConnection();
  }

  /**
   * Check if local LLM is available and responsive
   */
  private async checkLLMConnection(): Promise<void> {
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
    }
  }
  
  /**
   * Test pojedynczego endpointu LLM
   */
  private async testEndpoint(endpoint: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Krótszy timeout dla testu
      
      const testPrompt = "You are a helpful AI assistant. Respond with one word: 'Connected'";
      
      // Format żądania zależy od endpointu
      let requestData;
      
      if (endpoint.includes('/v1/chat')) {
        // Format zgodny z OpenAI Chat API
        requestData = {
          model: LOCAL_LLM_CONFIG.model,
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
          model: LOCAL_LLM_CONFIG.model,
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
        return false;
      }
      
      const data = await response.json();
      
      // Sprawdzamy różne formaty odpowiedzi
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
      
      return responseText.toLowerCase().includes('connected');
    } catch (error) {
      console.warn(`Failed to connect to LLM endpoint ${endpoint}:`, error);
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
        
        if (endpoint.includes('/v1/chat')) {
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
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        const data = await response.json();
        
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
   * Enhance analysis with LLM
   */
  private async enhanceWithLLM(
    analysis: ContentAnalysis, 
    initialTags: string[], 
    contentContext: string
  ): Promise<ContentAnalysis> {
    // Najpierw sprawdźmy, czy lokalny LLM jest dostępny
    if (!this.isLLMAvailable) {
      console.log('Local LLM not available, using rule-based analysis');
      return this.enhanceWithRules(analysis, initialTags, contentContext);
    }

    try {
      const prompt = `
You are an expert content analyzer. Your task is to analyze the following content and provide a structured analysis.

CONTENT TO ANALYZE:
"""
${contentContext}
"""

INSTRUCTIONS:
Analyze the above content and extract the following information:
1. A concise one-sentence summary that captures the essence of the content
2. The main topic of the content (single phrase)
3. 3-5 key points extracted from the content
4. 2-4 relevant categories from this list (choose only the most relevant ones): technology, business, finance, science, ai, development, entertainment, memes, health, news, social, education, other
5. A sentiment analysis (must be one of: positive, negative, or neutral)
6. 3-7 suggested tags for this content (short keywords that describe the content well)

IMPORTANT: Your response must be formatted as a valid JSON object with the following structure:

{
  "summary": "your concise summary here",
  "mainTopic": "main topic here",
  "keypoints": ["point 1", "point 2", "point 3"],
  "categories": ["category1", "category2"],
  "sentiment": "positive|negative|neutral",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}

DO NOT include any explanations, introductions, or additional text. Provide ONLY the JSON object.
      `;

      // Wywołaj lokalny LLM
      const responseContent = await this.callLocalLLM(prompt);

      if (responseContent && responseContent.trim()) {
        try {
          // Find JSON in the response (in case the model includes extra text)
          const jsonRegex = /\{[\s\S]*?\}(?=\s*$)/;
          const jsonMatch = responseContent.match(jsonRegex);
          const jsonStr = jsonMatch ? jsonMatch[0] : responseContent;
          
          // Próbujemy oczyścić odpowiedź z formatowania, które może przeszkadzać
          const cleanedJson = jsonStr
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          
          // Parsujemy odpowiedź jako JSON
          const llmAnalysis = JSON.parse(cleanedJson);
          
          // Aktualizujemy analizę
          if (llmAnalysis.summary) analysis.summary = llmAnalysis.summary;
          if (llmAnalysis.mainTopic) analysis.mainTopic = llmAnalysis.mainTopic;
          if (llmAnalysis.keypoints && Array.isArray(llmAnalysis.keypoints)) {
            analysis.keypoints = llmAnalysis.keypoints.filter((point: any) => point && typeof point === 'string');
          }
          
          // Kategorie
          if (llmAnalysis.categories && Array.isArray(llmAnalysis.categories)) {
            const validCategories = llmAnalysis.categories
              .filter((cat: string) => cat && typeof cat === 'string')
              .map((cat: string) => this.mapToContentCategory(cat.toLowerCase()))
              .filter((cat: ContentCategory) => cat !== ContentCategory.OTHER || analysis.categories.length === 0);
            
            if (validCategories.length > 0) {
              analysis.categories = validCategories;
            }
          }
          
          // Nastrój
          if (llmAnalysis.sentiment && ['positive', 'negative', 'neutral'].includes(llmAnalysis.sentiment)) {
            analysis.sentiment = llmAnalysis.sentiment as 'positive' | 'negative' | 'neutral';
          }
          
          // Tagi
          if (llmAnalysis.suggestedTags && Array.isArray(llmAnalysis.suggestedTags)) {
            const validTags = llmAnalysis.suggestedTags
              .filter((tag: string) => tag && typeof tag === 'string')
              .map((tag: string) => tag.toLowerCase().trim());
            
            // Łączymy tagi, eliminując duplikaty
            if (validTags.length > 0) {
              analysis.suggestedTags = [...new Set([...initialTags, ...validTags])];
            }
          }
          
          // Oznaczamy, że analiza została przeprowadzona poprawnie
          analysis.analyzed = true;
        } catch (parseError) {
          console.error('Error parsing LLM response:', parseError);
          console.log('Raw response:', responseContent);
          // W przypadku błędu parsowania używamy analizy opartej na regułach
          return this.enhanceWithRules(analysis, initialTags, contentContext);
        }
      } else {
        console.warn('Empty LLM response, falling back to rule-based analysis');
        return this.enhanceWithRules(analysis, initialTags, contentContext);
      }

      return analysis;
    } catch (error) {
      console.error('Error in LLM analysis:', error);
      // W przypadku jakiegokolwiek błędu, używamy analizy opartej na regułach
      return this.enhanceWithRules(analysis, initialTags, contentContext);
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
    initialTags: string[], 
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
      const suggestedTags = [...initialTags];
      
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
   * Manually trigger LLM connection check and reset workingEndpoint
   */
  public async refreshLLMConnection(): Promise<boolean> {
    // Reset working endpoint to default
    this.workingEndpoint = LOCAL_LLM_CONFIG.endpoint;
    await this.checkLLMConnection();
    return this.isLLMAvailable;
  }
}

// Export singleton instance
export const contentAnalysisService = new ContentAnalysisService(); 