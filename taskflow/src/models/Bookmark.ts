export interface Bookmark {
  id: string;              // Unique identifier
  title: string;           // Bookmark title
  url: string;             // URL of the bookmarked resource
  description: string;     // Description or notes about the bookmark
  tags: string[];          // Array of tag strings for categorization
  folder: string;          // Folder for organization
  favicon: string;         // URL to favicon
  isFavorite: boolean;     // Whether the bookmark is marked as favorite
  isArchived: boolean;     // Whether the bookmark is archived
  createdAt: string;       // ISO date string
  updatedAt: string;       // ISO date string
}

// Helper type for creating new bookmarks (omitting auto-generated fields)
export type NewBookmark = Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>;

// Helper type for updating bookmarks (all fields optional except id)
export type UpdateBookmark = Partial<Omit<Bookmark, 'id'>> & { id: string };

// Bookmark sorting options
export type BookmarkSortField = 'title' | 'createdAt' | 'updatedAt' | 'url';
export type BookmarkSortOrder = 'asc' | 'desc';

// Bookmark filter options
export interface BookmarkFilters {
  search?: string;         // Search in title, description, and URL
  tags?: string[];         // Filter by tags
  folder?: string | null;  // Filter by folder
  isArchived?: boolean;    // Filter by archive status
  isFavorite?: boolean;    // Filter by favorite status
} 