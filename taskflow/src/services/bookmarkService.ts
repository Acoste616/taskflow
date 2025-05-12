import { v4 as uuidv4 } from 'uuid';
import type { Bookmark as LocalBookmark, NewBookmark, UpdateBookmark } from '../models/Bookmark';
import axios from 'axios';

// Storage key for bookmarks
const STORAGE_KEY = 'bookmarks';

// Custom error class for bookmark operations
class BookmarkError extends Error {
  constructor(message: string, public readonly bookmarkId?: string) {
    super(message);
    this.name = 'BookmarkError';
  }
}

// Get all bookmarks from localStorage
export const getBookmarks = (): LocalBookmark[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error: unknown) {
    console.error('Error retrieving bookmarks:', error);
    throw new BookmarkError(
      `Failed to retrieve bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Save a bookmark (create or update)
export const saveBookmark = (bookmark: NewBookmark & { id?: string }): LocalBookmark => {
  try {
    const bookmarks = getBookmarks();
    const now = new Date().toISOString();
    
    let newBookmark: LocalBookmark;
    
    if (bookmark.id) {
      // Update existing bookmark
      const existingIndex = bookmarks.findIndex(b => b.id === bookmark.id);
      
      if (existingIndex >= 0) {
        newBookmark = {
          ...bookmarks[existingIndex],
          ...bookmark,
          updatedAt: now
        };
        
        bookmarks[existingIndex] = newBookmark;
      } else {
        throw new BookmarkError(`Bookmark with id ${bookmark.id} not found`, bookmark.id);
      }
    } else {
      // Create new bookmark
      newBookmark = {
        ...bookmark,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        isArchived: bookmark.isArchived ?? false,
        isFavorite: bookmark.isFavorite ?? false,
        tags: bookmark.tags ?? [],
        description: bookmark.description ?? '',
        favicon: bookmark.favicon ?? null,
        folder: bookmark.folder ?? null
      } as LocalBookmark;
      
      bookmarks.push(newBookmark);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    return newBookmark;
  } catch (error: unknown) {
    console.error('Error saving bookmark:', error);
    if (error instanceof BookmarkError) {
      throw error;
    }
    throw new BookmarkError(
      `Failed to save bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Delete a bookmark by ID
export const deleteBookmark = async (id: string): Promise<void> => {
  try {
    // First try to delete from API
    try {
      await apiBookmarkService.deleteBookmark(id);
    } catch (apiError) {
      console.warn('Failed to delete bookmark from API:', apiError);
      // Continue with local deletion if API fails
    }

    // Then delete from local storage
    const bookmarks = getBookmarks();
    const bookmarkExists = bookmarks.some(bookmark => bookmark.id === id);
    
    if (!bookmarkExists) {
      throw new BookmarkError(`Bookmark with id ${id} not found`, id);
    }

    const updatedBookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBookmarks));
  } catch (error: unknown) {
    console.error('Error deleting bookmark:', error);
    if (error instanceof BookmarkError) {
      throw error;
    }
    throw new BookmarkError(
      `Failed to delete bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`,
      id
    );
  }
};

// Archive a bookmark
export const archiveBookmark = (id: string, archive: boolean = true): LocalBookmark => {
  try {
    const bookmarks = getBookmarks();
    const bookmarkIndex = bookmarks.findIndex(bookmark => bookmark.id === id);
    
    if (bookmarkIndex === -1) {
      throw new BookmarkError(`Bookmark with id ${id} not found`, id);
    }
    
    const updatedBookmark = {
      ...bookmarks[bookmarkIndex],
      isArchived: archive,
      updatedAt: new Date().toISOString()
    };
    
    bookmarks[bookmarkIndex] = updatedBookmark;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    
    return updatedBookmark;
  } catch (error: unknown) {
    console.error('Error archiving bookmark:', error);
    if (error instanceof BookmarkError) {
      throw error;
    }
    throw new BookmarkError(
      `Failed to archive bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`,
      id
    );
  }
};

// Toggle favorite status
export const toggleFavorite = (id: string): LocalBookmark => {
  try {
    const bookmarks = getBookmarks();
    const bookmarkIndex = bookmarks.findIndex(bookmark => bookmark.id === id);
    
    if (bookmarkIndex === -1) {
      throw new BookmarkError(`Bookmark with id ${id} not found`, id);
    }
    
    const updatedBookmark = {
      ...bookmarks[bookmarkIndex],
      isFavorite: !bookmarks[bookmarkIndex].isFavorite,
      updatedAt: new Date().toISOString()
    };
    
    bookmarks[bookmarkIndex] = updatedBookmark;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    
    return updatedBookmark;
  } catch (error: unknown) {
    console.error('Error toggling favorite status:', error);
    if (error instanceof BookmarkError) {
      throw error;
    }
    throw new BookmarkError(
      `Failed to toggle favorite status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      id
    );
  }
};

// Get bookmarks by tag
export const getBookmarksByTag = (tag: string): LocalBookmark[] => {
  try {
    return getBookmarks().filter(bookmark => bookmark.tags.includes(tag));
  } catch (error: unknown) {
    console.error('Error getting bookmarks by tag:', error);
    throw new BookmarkError(
      `Failed to get bookmarks by tag: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Get bookmarks by folder
export const getBookmarksByFolder = (folder: string | null): LocalBookmark[] => {
  try {
    return getBookmarks().filter(bookmark => bookmark.folder === folder);
  } catch (error: unknown) {
    console.error('Error getting bookmarks by folder:', error);
    throw new BookmarkError(
      `Failed to get bookmarks by folder: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Get favorite bookmarks
export const getFavoriteBookmarks = (): LocalBookmark[] => {
  try {
    return getBookmarks().filter(bookmark => bookmark.isFavorite);
  } catch (error: unknown) {
    console.error('Error getting favorite bookmarks:', error);
    throw new BookmarkError(
      `Failed to get favorite bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Get non-archived bookmarks
export const getActiveBookmarks = (): LocalBookmark[] => {
  try {
    return getBookmarks().filter(bookmark => !bookmark.isArchived);
  } catch (error: unknown) {
    console.error('Error getting active bookmarks:', error);
    throw new BookmarkError(
      `Failed to get active bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Get archived bookmarks
export const getArchivedBookmarks = (): LocalBookmark[] => {
  try {
    return getBookmarks().filter(bookmark => bookmark.isArchived);
  } catch (error: unknown) {
    console.error('Error getting archived bookmarks:', error);
    throw new BookmarkError(
      `Failed to get archived bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Interfejsy dla danych API
export interface ApiTag {
  id?: number;
  name: string;
}

export interface ApiFolder {
  id?: number;
  name: string;
}

export interface ApiBookmark {
  id?: number;
  title: string;
  category?: string;
  group?: string;
  status?: string;
  dateAdded?: string;
  link: string;
  summary?: string;
  tags?: ApiTag[];
  folder?: ApiFolder | null;
}

// Funkcje API dla zakładek
export const apiBookmarkService = {
  // Pobieranie wszystkich zakładek
  getAll: async (filters?: { tag?: string; folder?: string; search?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.folder) params.append('folder', filters.folder);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    
    const response = await axios.get(`${API_URL}/bookmarks?${params.toString()}`);
    return response.data;
  },

  // Pobieranie pojedynczej zakładki
  getById: async (id: number) => {
    const response = await axios.get(`${API_URL}/bookmarks/${id}`);
    return response.data;
  },

  // Dodawanie nowej zakładki
  create: async (bookmark: ApiBookmark) => {
    const response = await axios.post(`${API_URL}/bookmarks`, bookmark);
    return response.data;
  },

  // Aktualizacja zakładki
  update: async (id: number, bookmark: ApiBookmark) => {
    const response = await axios.put(`${API_URL}/bookmarks/${id}`, bookmark);
    return response.data;
  },

  // Usuwanie zakładki
  delete: async (id: number) => {
    await axios.delete(`${API_URL}/bookmarks/${id}`);
  },

  // Analiza zakładki przez LLM
  analyze: async (bookmark: Partial<ApiBookmark>) => {
    const response = await axios.post(`${API_URL}/bookmarks/analyze`, bookmark);
    return response.data;
  },

  // Eksport zakładek
  export: async (format: 'json' | 'csv' = 'json') => {
    window.location.href = `${API_URL}/bookmarks/export?format=${format}`;
  },

  // Delete a bookmark
  deleteBookmark: async (id: string): Promise<void> => {
    try {
      const response = await axios.delete(`${API_URL}/bookmarks/${id}`);
      if (response.status !== 204) {
        throw new Error('Failed to delete bookmark');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to delete bookmark');
      }
      throw error;
    }
  },
};

// Funkcje API dla tagów
export const apiTagService = {
  // Pobieranie wszystkich tagów
  getAll: async () => {
    const response = await axios.get(`${API_URL}/tags`);
    return response.data;
  },

  // Dodawanie nowego tagu
  create: async (name: string) => {
    const response = await axios.post(`${API_URL}/tags`, { name });
    return response.data;
  },

  // Usuwanie tagu
  delete: async (id: number) => {
    await axios.delete(`${API_URL}/tags/${id}`);
  }
};

// Funkcje API dla folderów
export const apiFolderService = {
  // Pobieranie wszystkich folderów
  getAll: async () => {
    const response = await axios.get(`${API_URL}/folders`);
    return response.data;
  },

  // Pobieranie zakładek z folderu
  getBookmarks: async (id: number) => {
    const response = await axios.get(`${API_URL}/folders/${id}/bookmarks`);
    return response.data;
  },

  // Dodawanie nowego folderu
  create: async (name: string) => {
    const response = await axios.post(`${API_URL}/folders`, { name });
    return response.data;
  },

  // Usuwanie folderu
  delete: async (id: number) => {
    await axios.delete(`${API_URL}/folders/${id}`);
  }
}; 