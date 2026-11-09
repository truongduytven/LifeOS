export interface User {
  id: number;
  username: string;
  displayName: string;
  hasVaultPin: boolean;
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  tags: string[];
  subtasks: SubTask[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  category: 'milestone' | 'work' | 'personal' | 'idea' | 'achievement';
  color: string;
  completed: boolean;
  createdAt: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  coverImage: string;
  readingTime: number;
  isPublic: boolean;
  isFavorite: boolean;
  readStatus: 'unread' | 'reading' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: number;
  title: string;
  description: string;
  category: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string;
  externalUrl: string;
  tags: string[];
  isStarred: boolean;
  createdAt: string;
}

export interface VaultItem {
  id: number;
  title: string;
  category: 'credential' | 'api_key' | 'secure_note' | 'card' | 'document';
  username: string;
  secretValue: string;
  url: string;
  notes: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  tasksTotal: number;
  tasksDone: number;
  tasksPending: number;
  notesCount: number;
  articlesCount: number;
  unreadArticlesCount: number;
  documentsCount: number;
  vaultCount: number;
  timelineCount: number;
  recentTasks: Task[];
  recentNotes: Note[];
  upcomingTimeline: TimelineEvent[];
}
