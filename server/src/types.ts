export interface Place {
  id: string;
  name_zh: string;
  name_en: string;
  address_zh: string;
  address_en: string;
  phone?: string;
  price_level: number;
  rating: number;
  rating_count: number;
  lat: number;
  lng: number;
  categories: string[];
  features: string[];
  open_hours?: {
    [key: string]: string[];
  };
  photos?: string[];
  website?: string;
  distance_m?: number;
  score?: number;
  score_breakdown?: ScoreBreakdown;
  is_open?: boolean;
}

export interface ScoreBreakdown {
  rating: number;
  distance: number;
  popularity: number;
  open: number;
  context: number;
  total: number;
}

export interface FilterParams {
  lat?: number;
  lng?: number;
  radius?: number;
  price_max?: number;
  rating_min?: number;
  categories?: string[];
  features?: string[];
  open_now?: boolean;
}

export interface PlaceDocument {
  _id?: string;
  id: string;
  name_zh: string;
  name_en: string;
  address_zh: string;
  address_en: string;
  phone?: string;
  price_level: number;
  rating: number;
  rating_count: number;
  lat: number;
  lng: number;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  categories: string[];
  features: string[];
  open_hours?: {
    [key: string]: string[];
  };
  photos?: string[];
  website?: string;
  created_at?: Date;
  updated_at?: Date;
}

