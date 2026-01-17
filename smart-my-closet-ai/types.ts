
export enum Category {
  TOPS = 'Tops',
  BOTTOMS = 'Bottoms',
  DRESSES = 'Dresses',
  SHOES = 'Shoes',
  ACCESSORIES = 'Accessories'
}

export interface ClosetItem {
  id: string;
  category: Category;
  tags: string[];
  color: string;
  imageUrl: string;
  originalImageUrl?: string;
}

export interface BodyMetrics {
  shoulderWidth: number; // 0.5 - 2.0 multiplier
  waistWidth: number;    // 0.5 - 2.0 multiplier
  heightRatio: number;   // 0.5 - 1.5 multiplier
}

export interface Outfit {
  id: string;
  name: string;
  items: ClosetItem[];
  videoUrl?: string;
  createdAt: number;
}

export type AppTab = 'closet' | 'outfits' | 'try-on' | 'profile';
