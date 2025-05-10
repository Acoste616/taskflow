import type { NewBookmark } from '../models/Bookmark';
import { BookmarkCategorizer } from './bookmarkCategorizer';

/**
 * Browser Integration Service 
 * Provides utilities for integrating with browser features and extensions
 */
export class BrowserIntegration {
  /**
   * Check if the application is running in a browser that supports extensions
   */
  static isBrowserExtensionSupported(): boolean {
    // Check for Chrome extension API
    if (typeof window !== 'undefined' && (window as any).chrome && (window as any).chrome.runtime) {
      return true;
    }
    
    // Check for Firefox extension API
    if (typeof window !== 'undefined' && (window as any).browser && (window as any).browser.runtime) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if the current browser supports the Web Share API
   */
  static isWebShareSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.share;
  }
  
  /**
   * Create a bootmarklet script URL that users can drag to their bookmarks bar
   * @param appUrl The URL of the TaskFlow application
   */
  static createBookmarkletUrl(appUrl: string): string {
    // Bookmarklet code to extract page info and open the TaskFlow app with parameters
    const bookmarkletCode = `
      (function() {
        // Get page information
        const title = document.title;
        const url = window.location.href;
        let description = '';
        
        // Try to get description from meta tags
        const metaDesc = document.querySelector('meta[name="description"]') || 
                        document.querySelector('meta[property="og:description"]');
        if (metaDesc && metaDesc.getAttribute('content')) {
          description = metaDesc.getAttribute('content');
        }
        
        // Encode data as URL parameters
        const params = new URLSearchParams();
        params.append('url', url);
        params.append('title', title);
        params.append('description', description);
        params.append('action', 'save');
        
        // Open TaskFlow in a new tab with the data
        window.open('${appUrl}/bookmarks?' + params.toString(), '_blank');
      })();
    `;
    
    // Convert the code to a URL-safe string
    const encodedCode = encodeURIComponent(bookmarkletCode.trim().replace(/\s+/g, ' '));
    return `javascript:${encodedCode}`;
  }
  
  /**
   * Process URL parameters to extract bookmark data when the app is opened from a bookmarklet
   */
  static processBookmarkletParams(): NewBookmark | null {
    if (typeof window === 'undefined') return null;
    
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    
    // Check if this is a bookmarklet action
    if (action !== 'save') return null;
    
    const url = params.get('url');
    const title = params.get('title');
    const description = params.get('description');
    
    if (!url) return null;
    
    // Create a basic bookmark
    const bookmark: NewBookmark = {
      title: title || url,
      url,
      description: description || '',
      tags: [],
      folder: '', // Use empty string for no folder
      favicon: '', // Use empty string for no favicon
      isFavorite: false,
      isArchived: false
    };

    // Optionally auto-categorize
    return BookmarkCategorizer.categorize(bookmark);
  }
} 