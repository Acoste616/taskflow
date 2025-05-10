import type { NewBookmark } from '../models/Bookmark';

/**
 * Service for capturing bookmark data from the current page or a provided URL
 */
export class BookmarkCaptureService {
  /**
   * Capture data from the current page
   */
  static captureCurrentPage(): Promise<NewBookmark> {
    return new Promise((resolve) => {
      const url = window.location.href;
      const title = document.title;
      const description = this.getPageDescription();
      const tags = this.generateTagsFromPage();
      const favicon = this.getFaviconUrl();
      
      resolve({
        title,
        url,
        description,
        tags,
        favicon,
        folder: this.detectFolder(),
        isFavorite: false,
        isArchived: false,
      });
    });
  }
  
  /**
   * Extract the page description from meta tags
   */
  private static getPageDescription(): string {
    const metaDescription = document.querySelector('meta[name="description"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    
    if (ogDescription && ogDescription.getAttribute('content')) {
      return ogDescription.getAttribute('content') || '';
    }
    
    if (metaDescription && metaDescription.getAttribute('content')) {
      return metaDescription.getAttribute('content') || '';
    }
    
    // If no meta description, try to get the first paragraph
    const firstParagraph = document.querySelector('p');
    if (firstParagraph) {
      const text = firstParagraph.textContent || '';
      return text.length > 150 ? text.substring(0, 147) + '...' : text;
    }
    
    return '';
  }
  
  /**
   * Generate tags based on page content and URL
   */
  private static generateTagsFromPage(): string[] {
    const url = window.location.href;
    const hostname = window.location.hostname;
    const tags: string[] = ['captured'];
    
    // Add domain-based tag
    const domain = hostname.replace('www.', '').split('.')[0];
    if (domain) {
      tags.push(domain);
    }
    
    // Add tags based on common platforms
    if (url.includes('github.com')) {
      tags.push('github', 'development');
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      tags.push('youtube', 'video');
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      tags.push('twitter', 'social-media');
    } else if (url.includes('facebook.com')) {
      tags.push('facebook', 'social-media');
    } else if (url.includes('linkedin.com')) {
      tags.push('linkedin', 'professional');
    } else if (url.includes('medium.com')) {
      tags.push('medium', 'article');
    } else if (url.includes('wikipedia.org')) {
      tags.push('wikipedia', 'reference');
    } else if (url.includes('stackoverflow.com')) {
      tags.push('stackoverflow', 'development');
    } else if (url.includes('reddit.com')) {
      tags.push('reddit', 'discussion');
    }
    
    // Add keyword-based tags
    const keywords = document.querySelector('meta[name="keywords"]');
    if (keywords && keywords.getAttribute('content')) {
      const keywordList = keywords.getAttribute('content')?.split(',') || [];
      keywordList.forEach(keyword => {
        const trimmed = keyword.trim();
        if (trimmed && trimmed.length < 20) { // Avoid extremely long keywords
          tags.push(trimmed.toLowerCase());
        }
      });
    }
    
    // Return unique tags (no duplicates)
    return [...new Set(tags)];
  }
  
  /**
   * Get the favicon URL for the current page
   */
  private static getFaviconUrl(): string {
    // Try to find favicon link
    const faviconLink = document.querySelector('link[rel="icon"]') || 
                        document.querySelector('link[rel="shortcut icon"]');
    
    if (faviconLink && faviconLink.getAttribute('href')) {
      const faviconHref = faviconLink.getAttribute('href');
      
      // Handle relative URLs
      if (faviconHref?.startsWith('/')) {
        return `${window.location.origin}${faviconHref}`;
      }
      
      return faviconHref || '';
    }
    
    // Fallback to default favicon location
    return `${window.location.origin}/favicon.ico`;
  }
  
  /**
   * Detect the appropriate folder based on the domain
   */
  private static detectFolder(): string {
    const hostname = window.location.hostname;
    
    if (hostname.includes('github.com')) {
      return 'Development';
    } else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'YouTube';
    } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'Twitter';
    } else if (hostname.includes('facebook.com')) {
      return 'Facebook';
    } else if (hostname.includes('linkedin.com')) {
      return 'Professional';
    } else if (hostname.includes('medium.com')) {
      return 'Articles';
    } else if (hostname.includes('wikipedia.org')) {
      return 'Reference';
    } else if (hostname.includes('stackoverflow.com') || hostname.includes('github.com')) {
      return 'Development';
    } else if (hostname.includes('reddit.com')) {
      return 'Social Media';
    }
    
    return '';
  }
  
  /**
   * Create a bookmark from a manually provided URL
   * This would typically be used in a browser extension context,
   * but here we simulate it with a fetch to get basic metadata
   */
  static async captureFromUrl(url: string): Promise<NewBookmark> {
    try {
      // In a real extension, we'd have access to the page.
      // Here we just make a best effort with the URL.
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      // Generate tags based on domain
      const tags: string[] = ['captured'];
      
      if (url.includes('github.com')) {
        tags.push('github', 'development');
      } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        tags.push('youtube', 'video');
      } else if (url.includes('twitter.com') || url.includes('x.com')) {
        tags.push('twitter', 'social-media');
      } else if (url.includes('facebook.com')) {
        tags.push('facebook', 'social-media');
      } else if (url.includes('linkedin.com')) {
        tags.push('linkedin', 'professional');
      }
      
      // Try to get a domain-specific title
      let title = domain;
      if (url.includes('youtube.com') && urlObj.searchParams.has('v')) {
        title = `YouTube Video: ${urlObj.searchParams.get('v')}`;
      } else if (url.includes('twitter.com')) {
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length > 1) {
          title = `Tweet by @${pathParts[1]}`;
        }
      }
      
      // Detect folder
      let folder = '';
      if (url.includes('github.com')) {
        folder = 'Development';
      } else if (url.includes('youtube.com')) {
        folder = 'YouTube';  
      } else if (url.includes('twitter.com')) {
        folder = 'Twitter';
      } else if (url.includes('facebook.com')) {
        folder = 'Facebook';
      }
      
      // Get favicon
      const favicon = `https://www.google.com/s2/favicons?domain=${domain}`;
      
      return {
        title,
        url,
        description: '',
        tags,
        favicon,
        folder,
        isFavorite: false,
        isArchived: false
      };
    } catch (error) {
      console.error('Error capturing bookmark from URL:', error);
      // Return a minimal bookmark if there's an error
      return {
        title: url,
        url,
        description: '',
        tags: ['captured'],
        favicon: '',
        folder: '',
        isFavorite: false,
        isArchived: false
      };
    }
  }
}

export default BookmarkCaptureService; 