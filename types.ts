
export enum Category {
  TOPS = 'Tops',
  BOTTOMS = 'Bottoms',
  DRESSES = 'DRESSES',
  SHOES = 'Shoes',
  ACCESSORIES = 'Accessories'
}

export interface CustomAttribute {
  label: string;
  value: string;
}

export interface ClosetItem {
  id: string;
  name: string;
  category: Category;
  tags: string[];
  color: string;
  season: string;
  suggestion?: string;
  imageUrl: string;
  originalImageUrl: string;
  customAttributes?: CustomAttribute[];
  isProcessing?: boolean;
  processingProgress?: number;
}

export interface UserAccount {
  id: string;
  username: string;
  avatar?: string;
}

export interface UserProfile {
  name: string;
  photoUrl?: string;
  bodyPhotoUrl?: string;
}

// Added missing BodyParams interface
export interface BodyParams {
  shoulderWidth: number;
  waistWidth: number;
  heightRatio: number;
}

export interface Outfit {
  id: string;
  name: string;
  scenario: string;
  items: ClosetItem[];
  score: number;
  review: string;
  createdAt: number;
  previewUrl?: string;
  localPreviewUrl?: string;
  previewStatus?: 'generating' | 'done' | 'failed';
}

export interface AIRecommendation {
  id: string;
  name: string;
  review: string;
  score: number;
  scenario: string;
  itemIds: string[];
  previewUrl?: string;
  isGenerating?: boolean;
}

export type View = 'Closet' | 'Discover' | 'Outfits' | 'Calendar' | 'Profile';

export type CalendarMap = Record<string, string>; // date string "YYYY-MM-DD" -> outfitId
