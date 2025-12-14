export interface PlaceReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number; // Unix timestamp
}

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
  reviews?: PlaceReview[];
}

// MongoDB document structure (includes location for geospatial queries)
export interface PlaceDocument {
  id: string;
  name_zh: string;
  name_en: string;
  address_zh: string;
  address_en: string;
  phone?: string;
  price_level: number;
  rating: number;
  rating_count: number;
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

export interface RouletteRequest {
  lat: number;
  lng: number;
  filters?: FilterParams;
}

