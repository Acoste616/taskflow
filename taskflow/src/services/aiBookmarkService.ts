import type { Bookmark } from '../models/Bookmark';

/**
 * AI Bookmark Service - Pseudo AI implementation for analyzing and sorting bookmarks
 * 
 * Note: This is a simplified implementation that simulates AI behavior.
 * In a real-world application, you might want to use actual ML libraries like TensorFlow.js
 * or send data to a backend service for more sophisticated analysis.
 */
export class AIBookmarkService {
  // Store interaction history with bookmarks
  private interactionHistory: Record<string, {
    clicks: number,
    hovers: number,
    lastUsed: Date,
    favourite: boolean
  }> = {};
  
  // Keep track of user preferences
  private userPreferences: {
    preferredCategories: Record<string, number>,
    timeOfDayUsage: Record<string, number[]>
  } = {
    preferredCategories: {},
    timeOfDayUsage: {}
  };
  
  constructor() {
    this.loadData();
  }
  
  /**
   * Record a user interaction with a bookmark
   */
  public recordInteraction(bookmarkId: string, interactionType: 'click' | 'hover'): void {
    if (!this.interactionHistory[bookmarkId]) {
      this.interactionHistory[bookmarkId] = {
        clicks: 0,
        hovers: 0,
        lastUsed: new Date(),
        favourite: false
      };
    }
    
    if (interactionType === 'click') {
      this.interactionHistory[bookmarkId].clicks += 1;
    } else if (interactionType === 'hover') {
      this.interactionHistory[bookmarkId].hovers += 1;
    }
    
    this.interactionHistory[bookmarkId].lastUsed = new Date();
    this.saveData();
  }
  
  /**
   * Record favorite status
   */
  public recordFavorite(bookmarkId: string, isFavorite: boolean): void {
    if (!this.interactionHistory[bookmarkId]) {
      this.interactionHistory[bookmarkId] = {
        clicks: 0,
        hovers: 0,
        lastUsed: new Date(),
        favourite: isFavorite
      };
    } else {
      this.interactionHistory[bookmarkId].favourite = isFavorite;
    }
    
    this.saveData();
  }
  
  /**
   * Track category preferences
   */
  public recordCategoryInteraction(categories: string[]): void {
    const hour = new Date().getHours();
    const timeBlock = Math.floor(hour / 6); // 0-3 representing 6-hour blocks
    
    categories.forEach(category => {
      if (!this.userPreferences.preferredCategories[category]) {
        this.userPreferences.preferredCategories[category] = 0;
      }
      
      this.userPreferences.preferredCategories[category] += 1;
      
      if (!this.userPreferences.timeOfDayUsage[category]) {
        this.userPreferences.timeOfDayUsage[category] = [0, 0, 0, 0];
      }
      
      this.userPreferences.timeOfDayUsage[category][timeBlock] += 1;
    });
    
    this.saveData();
  }
  
  /**
   * Get bookmark importance score based on interaction history
   * This provides a relative score (0-100) for each bookmark
   */
  public getBookmarkImportance(bookmarkId: string): number {
    const history = this.interactionHistory[bookmarkId];
    if (!history) return 0;
    
    // Calculate a score based on:
    // - Number of clicks (most important)
    // - Recency of use (more recent = higher score)
    // - Number of hovers (less important)
    // - Favorite status
    
    const clickWeight = 5;
    const hoverWeight = 1;
    const favoriteBonus = 20;
    const recencyWeight = 10;
    
    // Calculate recency score (higher for more recent)
    const daysSinceLastUse = Math.max(0, (new Date().getTime() - history.lastUsed.getTime()) / (1000 * 60 * 60 * 24));
    const recencyScore = Math.max(0, recencyWeight - Math.min(recencyWeight, daysSinceLastUse));
    
    // Calculate total score
    let score = (history.clicks * clickWeight) + 
               (history.hovers * hoverWeight) + 
               recencyScore;
    
    // Add bonus for favorites
    if (history.favourite) {
      score += favoriteBonus;
    }
    
    // Normalize to 0-100 range (with soft cap at 100)
    return Math.min(100, score);
  }
  
  /**
   * Get suggested categories based on time of day
   */
  public getSuggestedCategories(): string[] {
    const hour = new Date().getHours();
    const timeBlock = Math.floor(hour / 6); // 0-3
    
    // Get categories most used in this time block
    const categoriesWithScores = Object.entries(this.userPreferences.timeOfDayUsage)
      .map(([category, timeUsage]) => ({
        category,
        score: timeUsage[timeBlock] || 0
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(entry => entry.category);
      
    return categoriesWithScores;
  }
  
  /**
   * Get recommended bookmarks based on current browsing context
   */
  public getRecommendedBookmarks(allBookmarks: Bookmark[], limit: number = 5): Bookmark[] {
    // Get hour of the day to consider time-based patterns
    const hour = new Date().getHours();
    const timeBlock = Math.floor(hour / 6); // 0-3
    
    // Get suggested categories for this time of day
    const suggestedCategories = this.getSuggestedCategories();
    
    // Score each bookmark based on multiple factors
    const scoredBookmarks = allBookmarks.map(bookmark => {
      let score = this.getBookmarkImportance(bookmark.id);
      
      // Boost score for bookmarks in suggested categories
      if (bookmark.tags.some(tag => suggestedCategories.includes(tag))) {
        score += 20;
      }
      
      // Boost for favorites
      if (bookmark.isFavorite) {
        score += 15;
      }
      
      return { bookmark, score };
    });
    
    // Sort by score and return top N bookmarks
    return scoredBookmarks
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.bookmark);
  }
  
  /**
   * Sort bookmarks using AI insights
   */
  public sortBookmarks(bookmarks: Bookmark[]): Bookmark[] {
    return [...bookmarks].sort((a, b) => {
      const scoreA = this.getBookmarkImportance(a.id);
      const scoreB = this.getBookmarkImportance(b.id);
      return scoreB - scoreA;
    });
  }
  
  /**
   * Calculate optimal positions for nodes in the neural network
   * based on importance and relationships
   */
  public calculateOptimalPositions(bookmarks: Bookmark[]): Record<string, { x: number, y: number, importance: number }> {
    const positions: Record<string, { x: number, y: number, importance: number }> = {};
    
    // Calculate importance for all bookmarks
    bookmarks.forEach(bookmark => {
      const importance = this.getBookmarkImportance(bookmark.id);
      positions[bookmark.id] = {
        x: 0, // These will be calculated
        y: 0, // These will be calculated
        importance
      };
    });
    
    // Determine node positions based on importance
    // More important nodes should be closer to the center
    const totalBookmarks = bookmarks.length;
    if (totalBookmarks <= 1) return positions;
    
    // Calculate positions in a spiral pattern
    // More important nodes are closer to the center
    const sortedIds = Object.keys(positions).sort(
      (a, b) => positions[b].importance - positions[a].importance
    );
    
    const angleStep = (2 * Math.PI) / Math.min(20, totalBookmarks);
    let radius = 100;
    let angle = 0;
    
    sortedIds.forEach((id, index) => {
      // Increase radius slightly as we move outward
      if (index > 0 && index % 10 === 0) {
        radius += 70;
      }
      
      // Calculate position based on radius and angle
      positions[id].x = Math.cos(angle) * radius;
      positions[id].y = Math.sin(angle) * radius;
      
      // Move angle for next node
      angle += angleStep;
    });
    
    return positions;
  }
  
  /**
   * Save interaction data to localStorage
   */
  private saveData(): void {
    try {
      localStorage.setItem('ai-bookmark-data', JSON.stringify({
        interactionHistory: this.interactionHistory,
        userPreferences: this.userPreferences
      }));
    } catch (error) {
      console.error('Error saving AI bookmark data:', error);
    }
  }
  
  /**
   * Load interaction data from localStorage
   */
  private loadData(): void {
    try {
      const data = localStorage.getItem('ai-bookmark-data');
      if (data) {
        const parsedData = JSON.parse(data);
        
        // Convert date strings back to Date objects
        if (parsedData.interactionHistory) {
          Object.keys(parsedData.interactionHistory).forEach(id => {
            parsedData.interactionHistory[id].lastUsed = new Date(parsedData.interactionHistory[id].lastUsed);
          });
          
          this.interactionHistory = parsedData.interactionHistory;
        }
        
        if (parsedData.userPreferences) {
          this.userPreferences = parsedData.userPreferences;
        }
      }
    } catch (error) {
      console.error('Error loading AI bookmark data:', error);
    }
  }
}

// Export singleton instance
export const aiBookmarkService = new AIBookmarkService(); 