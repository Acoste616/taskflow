import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Bookmark, NewBookmark, UpdateBookmark } from '../models/Bookmark';
import * as bookmarkService from '../services/bookmarkService';
import { apiBookmarkService } from '../services/bookmarkService';

// Storage key for bookmarks
const STORAGE_KEY = 'bookmarks';

interface BookmarkContextType {
  bookmarks: Bookmark[];
  favoriteBookmarks: Bookmark[];
  archivedBookmarks: Bookmark[];
  isLoading: boolean;
  error: string | null;
  addBookmark: (bookmark: NewBookmark) => Promise<Bookmark>;
  updateBookmark: (id: string, bookmark: Partial<Omit<Bookmark, 'id'>>) => Promise<Bookmark>;
  deleteBookmark: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<Bookmark>;
  archiveBookmark: (id: string, archive?: boolean) => Promise<Bookmark>;
  getBookmarksByTag: (tag: string) => Bookmark[];
  getBookmarksByFolder: (folder: string | null) => Bookmark[];
  clearError: () => void;
  refreshBookmarks: () => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const useBookmarkContext = () => {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarkContext must be used within a BookmarkProvider');
  }
  return context;
};

interface BookmarkProviderProps {
  children: ReactNode;
}

export const BookmarkProvider = ({ children }: BookmarkProviderProps) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Funkcja do pobierania zakładek z API
  const fetchBookmarksFromAPI = async () => {
    try {
      const apiBookmarks = await apiBookmarkService.getAll();
      
      // Przekształć API bookmarks do formatu lokalnych bookmarks
      const transformedBookmarks = apiBookmarks.map((apiBookmark: any) => ({
        id: apiBookmark.id.toString(),
        title: apiBookmark.title,
        url: apiBookmark.link,
        description: apiBookmark.summary || '',
        category: apiBookmark.category,
        group: apiBookmark.group,
        status: apiBookmark.status,
        folder: apiBookmark.folder?.name || null,
        tags: apiBookmark.tags?.map((tag: any) => tag.name) || [],
        isFavorite: false,
        isArchived: false,
        favicon: null,
        createdAt: apiBookmark.dateAdded || new Date().toISOString(),
        updatedAt: apiBookmark.updatedAt || new Date().toISOString()
      }));

      // Zaktualizuj stan bookmarks
      setBookmarks(transformedBookmarks);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookmarks from API:', err);
      setError('Failed to load bookmarks from API');
      
      // W przypadku błędu, spróbuj załadować z localStorage jako fallback
      try {
        const loadedBookmarks = bookmarkService.getBookmarks();
        setBookmarks(loadedBookmarks);
      } catch (localError) {
        console.error('Error loading bookmarks from localStorage:', localError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcja publiczna do ręcznego odświeżania zakładek
  const refreshBookmarks = async () => {
    setIsLoading(true);
    await fetchBookmarksFromAPI();
  };

  // Load bookmarks from API on component mount
  useEffect(() => {
    fetchBookmarksFromAPI();
    
    // Ustaw interwał odświeżania co 30 sekund
    const refreshInterval = setInterval(() => {
      fetchBookmarksFromAPI();
    }, 30000);
    
    // Wyczyść interwał przy odmontowaniu komponentu
    return () => clearInterval(refreshInterval);
  }, []);

  // Get favorite bookmarks
  const favoriteBookmarks = bookmarks.filter(bookmark => bookmark.isFavorite);
  
  // Get archived bookmarks
  const archivedBookmarks = bookmarks.filter(bookmark => bookmark.isArchived);

  // Clear error state
  const clearError = () => setError(null);

  // Add a new bookmark
  const addBookmark = async (bookmarkData: NewBookmark): Promise<Bookmark> => {
    try {
      const savedBookmark = bookmarkService.saveBookmark(bookmarkData);
      setBookmarks(prevBookmarks => [...prevBookmarks, savedBookmark]);
      
      // Odśwież dane z API po dodaniu zakładki
      setTimeout(fetchBookmarksFromAPI, 500);
      
      setError(null);
      return savedBookmark;
    } catch (err) {
      console.error('Error adding bookmark:', err);
      setError('Failed to add bookmark');
      throw err;
    }
  };

  // Update an existing bookmark
  const updateBookmark = async (id: string, bookmarkData: Partial<Omit<Bookmark, 'id'>>): Promise<Bookmark> => {
    try {
      const bookmarkToUpdate = bookmarks.find(bookmark => bookmark.id === id);
      
      if (!bookmarkToUpdate) {
        throw new Error(`Bookmark with id ${id} not found`);
      }
      
      const updatedBookmark = bookmarkService.saveBookmark({
        ...bookmarkToUpdate,
        ...bookmarkData,
        id
      });
      
      setBookmarks(prevBookmarks => 
        prevBookmarks.map(bookmark => (bookmark.id === id ? updatedBookmark : bookmark))
      );
      
      // Odśwież dane z API po aktualizacji zakładki
      setTimeout(fetchBookmarksFromAPI, 500);
      
      setError(null);
      return updatedBookmark;
    } catch (err) {
      console.error('Error updating bookmark:', err);
      setError('Failed to update bookmark');
      throw err;
    }
  };

  // Delete a bookmark
  const deleteBookmark = async (id: string): Promise<void> => {
    try {
      // Update local state immediately
      setBookmarks(prevBookmarks => {
        const updatedBookmarks = prevBookmarks.filter(bookmark => bookmark.id !== id);
        // Save to localStorage to prevent reappearing after refresh
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBookmarks));
        } catch (error) {
          console.error('Error saving bookmarks to localStorage:', error);
        }
        return updatedBookmarks;
      });

      // Then try to delete from API (don't block UI update)
      try {
        await apiBookmarkService.deleteBookmark(id);
      } catch (apiError) {
        console.warn('Failed to delete bookmark from API:', apiError);
        // Already updated local storage, so just log the error
      }

      setError(null);
    } catch (err) {
      console.error('Error deleting bookmark:', err);
      setError('Failed to delete bookmark');
      throw err;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (id: string): Promise<Bookmark> => {
    try {
      const updatedBookmark = bookmarkService.toggleFavorite(id);
      setBookmarks(prevBookmarks => 
        prevBookmarks.map(bookmark => (bookmark.id === id ? updatedBookmark : bookmark))
      );
      setError(null);
      return updatedBookmark;
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update bookmark');
      throw err;
    }
  };

  // Archive/unarchive a bookmark
  const archiveBookmark = async (id: string, archive: boolean = true): Promise<Bookmark> => {
    try {
      const updatedBookmark = bookmarkService.archiveBookmark(id, archive);
      setBookmarks(prevBookmarks => 
        prevBookmarks.map(bookmark => (bookmark.id === id ? updatedBookmark : bookmark))
      );
      setError(null);
      return updatedBookmark;
    } catch (err) {
      console.error('Error archiving bookmark:', err);
      setError('Failed to update bookmark');
      throw err;
    }
  };

  // Get bookmarks by tag
  const getBookmarksByTag = (tag: string): Bookmark[] => {
    return bookmarks.filter(bookmark => bookmark.tags.includes(tag) && !bookmark.isArchived);
  };

  // Get bookmarks by folder
  const getBookmarksByFolder = (folder: string | null): Bookmark[] => {
    return bookmarks.filter(bookmark => bookmark.folder === folder && !bookmark.isArchived);
  };

  const value = {
    bookmarks: bookmarks.filter(bookmark => !bookmark.isArchived),
    favoriteBookmarks,
    archivedBookmarks,
    isLoading,
    error,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    toggleFavorite,
    archiveBookmark,
    getBookmarksByTag,
    getBookmarksByFolder,
    clearError,
    refreshBookmarks
  };

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}; 