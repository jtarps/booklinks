export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverUrl: string;
  description?: string;
  references: Reference[];
  referencedBy: Reference[];
  databaseId?: string;
  referencesDiscovered?: boolean;
}

export interface Reference {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description?: string;
  referenceId?: string;
  context?: string;
  upvoteCount?: number;
  userHasUpvoted?: boolean;
}

export interface ReadingList {
  id: string;
  name: string;
  description?: string;
  slug: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  items?: ReadingListItem[];
}

export interface ReadingListItem {
  id: string;
  bookId: string;
  position: number;
  notes?: string;
  book?: Book;
}

export interface ReferenceComment {
  id: string;
  userId: string;
  referenceId: string;
  content: string;
  createdAt: string;
  displayName?: string;
}
