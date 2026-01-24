export enum Tab {
  SHOWCASE = 'showcase',
  SUBSCRIPTION = 'subscription',
  CREATE = 'create',
  LIBRARY = 'library',
  SETTINGS = 'settings'
}

export type Language = 'ru' | 'en' | 'uk';
export type Theme = 'dark' | 'light';

export interface VideoItem {
  id: string;
  url: string;
  thumbnail?: string;
  title?: string;
  prompt: string;
  category?: string;
  isLocal?: boolean;
  hasMusic?: boolean;
}

export interface GenerationConfig {
  prompt: string;
  aspectRatio: '16:9' | '9:16';
}

// Global augmentation no longer strictly needed for logic, but kept for type safety if needed elsewhere
declare global {
  interface Window {
    // legacy
  }
}
