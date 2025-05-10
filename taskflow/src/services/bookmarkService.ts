import { v4 as uuidv4 } from 'uuid';
import type { Bookmark, NewBookmark, UpdateBookmark } from '../models/Bookmark';

// Storage key for bookmarks
const BOOKMARKS_STORAGE_KEY = 'taskflow_bookmarks';

// Custom error class for bookmark operations
class BookmarkError extends Error {
  constructor(message: string, public readonly bookmarkId?: string) {
    super(message);
    this.name = 'BookmarkError';
  }
}

// Get all bookmarks from localStorage
export const getBookmarks = (): Bookmark[] => {
  try {
    const data = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error: unknown) {
    console.error('Error retrieving bookmarks:', error);
    throw new BookmarkError(
      `Failed to retrieve bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Save a bookmark (create or update)
export const saveBookmark = (bookmark: NewBookmark & { id?: string }): Bookmark => {
  try {
    const bookmarks = getBookmarks();
    const now = new Date().toISOString();
    
    let newBookmark: Bookmark;
    
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
      } as Bookmark;
      
      bookmarks.push(newBookmark);
    }
    
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
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
export const deleteBookmark = (id: string): void => {
  try {
    const bookmarks = getBookmarks().filter(bookmark => bookmark.id !== id);
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (error: unknown) {
    console.error('Error deleting bookmark:', error);
    throw new BookmarkError(
      `Failed to delete bookmark: ${error instanceof Error ? error.message : 'Unknown error'}`,
      id
    );
  }
};

// Archive a bookmark
export const archiveBookmark = (id: string, archive: boolean = true): Bookmark => {
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
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    
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
export const toggleFavorite = (id: string): Bookmark => {
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
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    
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
export const getBookmarksByTag = (tag: string): Bookmark[] => {
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
export const getBookmarksByFolder = (folder: string | null): Bookmark[] => {
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
export const getFavoriteBookmarks = (): Bookmark[] => {
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
export const getActiveBookmarks = (): Bookmark[] => {
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
export const getArchivedBookmarks = (): Bookmark[] => {
  try {
    return getBookmarks().filter(bookmark => bookmark.isArchived);
  } catch (error: unknown) {
    console.error('Error getting archived bookmarks:', error);
    throw new BookmarkError(
      `Failed to get archived bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}; 