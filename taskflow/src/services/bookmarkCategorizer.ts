import type { NewBookmark, Bookmark } from '../models/Bookmark';

/**
 * BookmarkCategorizer provides advanced categorization for bookmarks
 * based on content analysis, URL patterns, and machine learning techniques
 */
export class BookmarkCategorizer {
  // Define main categories with their subcategories and keywords
  public static readonly CATEGORIES = {
    // AI & ML
    AI: {
      subcategories: ['Machine Learning', 'Neural Networks', 'NLP', 'Computer Vision', 'AI Ethics'],
      keywords: [
        'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 
        'transformer', 'gpt', 'bert', 'nlp', 'natural language processing', 'computer vision', 
        'reinforcement learning', 'supervised learning', 'unsupervised learning', 'chatgpt', 
        'openai', 'anthropic', 'claude', 'llm', 'large language model', 'ai research', 'ai ethics',
        'prompt engineering', 'ai agent', 'llama', 'mistral', 'generative ai', 'stable diffusion',
        'diffusion model', 'embedding', 'vector database', 'rag'
      ]
    },
    
    // Business & Finance
    Business: {
      subcategories: ['Startups', 'Marketing', 'Finance', 'Entrepreneurship', 'Management'],
      keywords: [
        'business', 'entrepreneur', 'startup', 'marketing', 'finance', 'investment', 
        'stocks', 'leadership', 'management', 'economics', 'sales', 'saas', 'b2b', 'b2c',
        'venture capital', 'vc', 'funding', 'series a', 'ipo', 'market research', 'strategy',
        'business model', 'revenue', 'profit', 'valuation', 'growth hacking', 'customer acquisition',
        'product market fit', 'customer segmentation', 'pricing strategy', 'financial model',
        'forecast', 'cashflow', 'balance sheet', 'income statement', 'roi', 'kpi'
      ]
    },
    
    // Programming & Development
    Development: {
      subcategories: ['Web Dev', 'Mobile Dev', 'DevOps', 'Programming Languages', 'Databases'],
      keywords: [
        'programming', 'code', 'developer', 'javascript', 'python', 'typescript', 'java', 
        'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 
        'github', 'git', 'coding', 'software engineering', 'web development', 'frontend', 
        'backend', 'fullstack', 'api', 'rest', 'graphql', 'database', 'sql', 'nosql', 
        'mongodb', 'postgresql', 'mysql', 'devops', 'ci/cd', 'docker', 'kubernetes',
        'aws', 'azure', 'cloud', 'serverless', 'microservices', 'architecture',
        'mobile', 'android', 'ios', 'swift', 'kotlin', 'flutter', 'react native'
      ]
    },
    
    // Science & Technology
    Science: {
      subcategories: ['Physics', 'Biology', 'Chemistry', 'Mathematics', 'Astronomy'],
      keywords: [
        'science', 'physics', 'chemistry', 'biology', 'astronomy', 'mathematics', 'quantum',
        'relativity', 'genetic', 'molecular', 'organic chemistry', 'algebra', 'calculus',
        'statistics', 'probability', 'hypothesis', 'research', 'scientific', 'experiment',
        'theory', 'astronomy', 'space', 'universe', 'galaxy', 'solar system', 'planet',
        'biochemistry', 'neuroscience', 'ecology', 'evolution', 'climate science',
        'particle physics', 'atom', 'nuclear', 'thermodynamics', 'cognitive science'
      ]
    },
    
    // Entertainment & Media
    Entertainment: {
      subcategories: ['Gaming', 'Movies', 'Music', 'TV Shows', 'Books'],
      keywords: [
        'entertainment', 'fun', 'game', 'gaming', 'video game', 'movie', 'film', 'tv', 
        'television', 'series', 'music', 'song', 'artist', 'album', 'comedy', 'anime', 
        'manga', 'netflix', 'hulu', 'disney+', 'streaming', 'youtube', 'twitch', 
        'spotify', 'playstation', 'xbox', 'nintendo', 'steam', 'book', 'novel', 'fiction',
        'concert', 'festival', 'theater', 'cinema', 'hollywood', 'celebrity', 'actor',
        'actress', 'director', 'blockbuster', 'bestseller', 'genre', 'trailer'
      ]
    },
    
    // Health & Wellness
    Health: {
      subcategories: ['Fitness', 'Nutrition', 'Mental Health', 'Medical', 'Wellness'],
      keywords: [
        'health', 'fitness', 'workout', 'exercise', 'nutrition', 'diet', 'medical',
        'wellness', 'mindfulness', 'yoga', 'meditation', 'mental health', 'psychology',
        'therapy', 'self-care', 'healthy eating', 'weight loss', 'strength training',
        'cardio', 'running', 'cycling', 'protein', 'vitamin', 'supplement', 'immune system',
        'sleep', 'stress management', 'anxiety', 'depression', 'doctor', 'medicine',
        'healthcare', 'hospital', 'diagnosis', 'treatment', 'disease', 'syndrome'
      ]
    },
    
    // News & Current Events
    News: {
      subcategories: ['Politics', 'World News', 'Technology News', 'Economy', 'Social Issues'],
      keywords: [
        'news', 'politics', 'current events', 'world', 'breaking', 'report', 'journalism',
        'investigation', 'press', 'media', 'headline', 'election', 'government', 'economy',
        'crisis', 'conflict', 'policy', 'law', 'regulation', 'bill', 'legislation',
        'senate', 'congress', 'parliament', 'president', 'prime minister', 'minister',
        'stock market', 'inflation', 'recession', 'federal reserve', 'interest rate',
        'unemployment', 'social issues', 'climate change', 'sustainability'
      ]
    },
    
    // Education & Learning
    Education: {
      subcategories: ['Online Courses', 'Tutorials', 'Academic', 'Languages', 'Career Development'],
      keywords: [
        'education', 'learning', 'course', 'tutorial', 'lesson', 'study', 'school',
        'university', 'college', 'degree', 'academic', 'research', 'thesis', 'professor',
        'student', 'classroom', 'lecture', 'e-learning', 'mooc', 'udemy', 'coursera',
        'khan academy', 'tutorial', 'how-to', 'guide', 'learning path', 'certification',
        'exam', 'curriculum', 'teaching', 'scholarship', 'language learning', 'career',
        'resume', 'cv', 'interview', 'skill development', 'professional development'
      ]
    }
  };
  
  // Platform detection patterns
  private static readonly PLATFORMS = {
    Twitter: {
      urlPatterns: ['twitter.com', 'x.com'],
      tags: ['twitter', 'social-media']
    },
    YouTube: {
      urlPatterns: ['youtube.com', 'youtu.be'],
      tags: ['youtube', 'video']
    },
    GitHub: {
      urlPatterns: ['github.com', 'githubusercontent.com'],
      tags: ['github', 'development']
    },
    LinkedIn: {
      urlPatterns: ['linkedin.com'],
      tags: ['linkedin', 'professional', 'career']
    },
    Facebook: {
      urlPatterns: ['facebook.com', 'fb.com'],
      tags: ['facebook', 'social-media']
    },
    Instagram: {
      urlPatterns: ['instagram.com'],
      tags: ['instagram', 'social-media', 'photos']
    },
    Reddit: {
      urlPatterns: ['reddit.com'],
      tags: ['reddit', 'forum', 'discussion']
    },
    Medium: {
      urlPatterns: ['medium.com'],
      tags: ['medium', 'article', 'blog']
    },
    StackOverflow: {
      urlPatterns: ['stackoverflow.com', 'stackexchange.com'],
      tags: ['stackoverflow', 'q&a', 'development']
    },
    Wikipedia: {
      urlPatterns: ['wikipedia.org', 'wikimedia.org'],
      tags: ['wikipedia', 'reference', 'encyclopedia']
    }
  };
  
  /**
   * Categorize a bookmark based on its content and URL
   * @param bookmark The bookmark to categorize
   * @returns The categorized bookmark with updated tags and folders
   */
  public static categorize(bookmark: NewBookmark | Bookmark): NewBookmark | Bookmark {
    const categorizedBookmark = { ...bookmark };
    const tagsSet = new Set(categorizedBookmark.tags || []);
    
    // Combine all text for analysis
    const contentToAnalyze = [
      categorizedBookmark.title,
      categorizedBookmark.description,
      categorizedBookmark.url
    ].filter(Boolean).join(' ').toLowerCase();
    
    // 1. Detect platform from URL and add appropriate tags and folder
    this.applyPlatformTags(categorizedBookmark, tagsSet);
    
    // 2. Classify content into categories
    this.applyCategoryTags(contentToAnalyze, tagsSet);
    
    // 3. Apply fuzzy classification (confidence-based approach)
    this.applyFuzzyClassification(contentToAnalyze, tagsSet);
    
    // Update tags
    categorizedBookmark.tags = Array.from(tagsSet);
    
    return categorizedBookmark;
  }
  
  /**
   * Detect platform from URL and add appropriate tags and folder
   */
  private static applyPlatformTags(bookmark: NewBookmark | Bookmark, tagsSet: Set<string>): void {
    const url = bookmark.url.toLowerCase();
    
    for (const [platform, data] of Object.entries(this.PLATFORMS)) {
      if (data.urlPatterns.some(pattern => url.includes(pattern))) {
        // Add platform tags
        data.tags.forEach(tag => tagsSet.add(tag));
        
        // Set folder if not already set
        if (!bookmark.folder) {
          bookmark.folder = platform;
        }
        
        // For specific platforms, do more detailed parsing
        if (platform === 'YouTube') {
          this.enhanceYouTubeBookmark(bookmark, url);
        } else if (platform === 'Twitter') {
          this.enhanceTwitterBookmark(bookmark, url);
        } else if (platform === 'GitHub') {
          this.enhanceGitHubBookmark(bookmark, url, tagsSet);
        }
      }
    }
  }
  
  /**
   * Classify content into main categories
   */
  private static applyCategoryTags(content: string, tagsSet: Set<string>): void {
    for (const [category, data] of Object.entries(this.CATEGORIES)) {
      // Check if any keywords match
      const matches = data.keywords.filter(keyword => content.includes(keyword));
      
      if (matches.length > 0) {
        // Add main category tag
        tagsSet.add(category.toLowerCase());
        
        // Try to find subcategories based on matched keywords
        // This requires a more sophisticated mapping in a real implementation
        // For now we'll use a simple approach
        if (matches.length >= 3) {
          // Strong match, add most likely subcategory
          // In a real implementation, this would use a more sophisticated algorithm
          const subcategoryIndex = Math.min(
            Math.floor(matches.length / 2), 
            data.subcategories.length - 1
          );
          tagsSet.add(data.subcategories[subcategoryIndex].toLowerCase());
        }
      }
    }
  }
  
  /**
   * Apply fuzzy classification for cases where exact keywords don't match
   * This simulates a more advanced ML-based approach
   */
  private static applyFuzzyClassification(content: string, tagsSet: Set<string>): void {
    // In a real implementation, this would use ML or more sophisticated NLP
    // Here we'll use a simplified approach with partial matches
    
    // Check for partial matches with category keywords
    for (const [category, data] of Object.entries(this.CATEGORIES)) {
      let score = 0;
      
      // Calculate a score based on partial matches
      for (const keyword of data.keywords) {
        const parts = keyword.split(' ');
        for (const part of parts) {
          if (part.length > 3 && content.includes(part)) {
            score += 1;
          }
        }
      }
      
      // If score is above threshold, add as a potential category
      if (score >= 5) {
        tagsSet.add(category.toLowerCase());
      }
    }
  }
  
  /**
   * Enhance YouTube bookmarks with video-specific info
   */
  private static enhanceYouTubeBookmark(bookmark: NewBookmark | Bookmark, url: string): void {
    try {
      const urlObj = new URL(url);
      
      // Extract video ID
      const videoId = urlObj.searchParams.get('v') || 
                     urlObj.pathname.split('/').pop();
      
      // Update bookmark with video-specific title if it looks generic
      if (bookmark.title === 'YouTube video' || bookmark.title.includes('youtube.com')) {
        bookmark.title = `YouTube Video: ${videoId}`;
      }
      
      // Add video ID to description if not present
      if (videoId && !bookmark.description.includes(videoId)) {
        bookmark.description = 
          bookmark.description ? 
          `${bookmark.description}\nVideo ID: ${videoId}` : 
          `Video ID: ${videoId}`;
      }
      
      // If URL contains a playlist, add that as a tag
      if (urlObj.searchParams.has('list')) {
        const playlistId = urlObj.searchParams.get('list');
        if (playlistId) {
          bookmark.description = `${bookmark.description || ''}\nPlaylist: ${playlistId}`.trim();
        }
      }
    } catch (error) {
      console.error('Error enhancing YouTube bookmark:', error);
    }
  }
  
  /**
   * Enhance Twitter bookmarks with tweet-specific info
   */
  private static enhanceTwitterBookmark(bookmark: NewBookmark | Bookmark, url: string): void {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Check if this is a specific tweet
      if (pathParts.length >= 4 && (pathParts[2] === 'status' || pathParts[2] === 'statuses')) {
        const username = pathParts[1];
        const tweetId = pathParts[3];
        
        // Update title if it's generic
        if (!bookmark.title || bookmark.title === 'Twitter post') {
          bookmark.title = `Tweet by @${username}`;
        }
        
        // Add tweet info to description
        if (tweetId) {
          bookmark.description = 
            bookmark.description ? 
            `${bookmark.description}\nTweet ID: ${tweetId}` : 
            `Tweet ID: ${tweetId}`;
        }
        
        // Add username as a tag
        if (username) {
          bookmark.tags = [...(bookmark.tags || []), `@${username}`];
        }
      } else if (pathParts.length >= 2) {
        // This is a profile page
        const username = pathParts[1];
        
        // Update title if generic
        if (!bookmark.title || bookmark.title === 'Twitter post') {
          bookmark.title = `Twitter Profile: @${username}`;
        }
        
        // Add username as a tag
        if (username) {
          bookmark.tags = [...(bookmark.tags || []), `@${username}`];
        }
      }
    } catch (error) {
      console.error('Error enhancing Twitter bookmark:', error);
    }
  }
  
  /**
   * Enhance GitHub bookmarks with repo-specific info
   */
  private static enhanceGitHubBookmark(
    bookmark: NewBookmark | Bookmark, 
    url: string,
    tagsSet: Set<string>
  ): void {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      // Check if this is a repository
      if (pathParts.length >= 2) {
        const owner = pathParts[0];
        const repo = pathParts[1];
        
        // Update title if generic
        if (!bookmark.title || bookmark.title.includes('github.com')) {
          bookmark.title = `GitHub: ${owner}/${repo}`;
        }
        
        // Add repository info to tags
        tagsSet.add(repo.toLowerCase());
        
        // Detect common programming languages and frameworks from URL and repo name
        const langPattern = /\b(javascript|typescript|python|java|go|rust|ruby|php|swift|kotlin|c\+\+|c#|html|css)\b/i;
        const frameworkPattern = /\b(react|angular|vue|svelte|next\.?js|express|django|flask|spring|laravel|rails)\b/i;
        
        const langMatches = repo.match(langPattern);
        if (langMatches) {
          tagsSet.add(langMatches[0].toLowerCase());
        }
        
        const frameworkMatches = repo.match(frameworkPattern);
        if (frameworkMatches) {
          tagsSet.add(frameworkMatches[0].toLowerCase());
        }
        
        // Add additional context based on URL structure
        if (pathParts.length >= 3) {
          // Issues, PRs, etc.
          if (pathParts[2] === 'issues') {
            tagsSet.add('issues');
            if (pathParts.length >= 4) {
              bookmark.description = `${bookmark.description || ''}\nIssue #${pathParts[3]}`.trim();
            }
          } else if (pathParts[2] === 'pull') {
            tagsSet.add('pull-request');
            if (pathParts.length >= 4) {
              bookmark.description = `${bookmark.description || ''}\nPR #${pathParts[3]}`.trim();
            }
          } else if (pathParts[2] === 'discussions') {
            tagsSet.add('discussions');
          } else if (pathParts[2] === 'blob' || pathParts[2] === 'tree') {
            tagsSet.add('code');
            // Add file extension as a tag if present
            if (pathParts.length > 4) {
              const fileName = pathParts[pathParts.length - 1];
              const fileExt = fileName.split('.').pop();
              if (fileExt && fileExt !== fileName) {
                tagsSet.add(fileExt.toLowerCase());
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error enhancing GitHub bookmark:', error);
    }
  }
  
  /**
   * Get suggestions for tags based on content analysis
   * @param content The content to analyze
   * @returns An array of suggested tags
   */
  public static getSuggestedTags(content: string): string[] {
    const suggestions = new Set<string>();
    const lowerContent = content.toLowerCase();
    
    // Add tags based on categories
    for (const [category, data] of Object.entries(this.CATEGORIES)) {
      // Check exact matches
      const exactMatches = data.keywords.filter(keyword => lowerContent.includes(keyword));
      if (exactMatches.length > 0) {
        suggestions.add(category.toLowerCase());
        
        // Add matched keywords as tags if they're short enough
        exactMatches.forEach(keyword => {
          if (keyword.length <= 15 && !keyword.includes(' ')) {
            suggestions.add(keyword);
          }
        });
      }
    }
    
    // Add additional tags based on platform detection
    for (const [platform, data] of Object.entries(this.PLATFORMS)) {
      if (data.urlPatterns.some(pattern => lowerContent.includes(pattern))) {
        data.tags.forEach(tag => suggestions.add(tag));
      }
    }
    
    return Array.from(suggestions);
  }
  
  /**
   * Suggest a folder based on content analysis
   * @param content The content to analyze
   * @returns A suggested folder name or null
   */
  public static getSuggestedFolder(content: string): string | null {
    const lowerContent = content.toLowerCase();
    
    // Check for platform-specific folders first
    for (const [platform, data] of Object.entries(this.PLATFORMS)) {
      if (data.urlPatterns.some(pattern => lowerContent.includes(pattern))) {
        return platform;
      }
    }
    
    // Try to determine a category-based folder
    let bestCategory = null;
    let highestScore = 0;
    
    for (const [category, data] of Object.entries(this.CATEGORIES)) {
      let score = 0;
      
      // Score based on keyword matches
      for (const keyword of data.keywords) {
        if (lowerContent.includes(keyword)) {
          score += 2;
        } else {
          // Partial match scoring
          const parts = keyword.split(' ');
          for (const part of parts) {
            if (part.length > 3 && lowerContent.includes(part)) {
              score += 0.5;
            }
          }
        }
      }
      
      if (score > highestScore) {
        highestScore = score;
        bestCategory = category;
      }
    }
    
    // Only return a category if we have a reasonably strong match
    return highestScore >= 3 ? bestCategory : null;
  }
}

export default BookmarkCategorizer; 