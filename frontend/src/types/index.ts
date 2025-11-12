// Типи для місць (пам'яток)
export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  category: string;
  latitude: number;
  longitude: number;
  description?: string;
  rating?: number; // Середній рейтинг (1.0 - 5.0)
  userRatingsTotal?: number; // Кількість відгуків
  tags?: Record<string, string>;
  address?: string;
  website?: string;
  imageUrl?: string;
  priceLevel?: number; // Ціновий рівень (0-4)
  openingHours?: string[]; // Години роботи
  phoneNumber?: string; // Телефон
}

// Категорії місць
export enum PlaceType {
  HISTORICAL = 'historical',
  MUSEUM = 'museum',
  PARK = 'park',
  NATURE = 'nature',
  RELIGIOUS = 'religious',
  ARCHITECTURE = 'architecture',
  MONUMENT = 'monument',
  CASTLE = 'castle',
  VIEWPOINT = 'viewpoint',
  CULTURAL = 'cultural',
  OTHER = 'other'
}

// Маршрут
export interface Route {
  places: Place[];
  totalDistance: number;
  optimizedOrder: number[];
  segments: RouteSegment[];
}

// Сегмент маршруту
export interface RouteSegment {
  from: Place;
  to: Place;
  distance: number;
}

// Відповідь від API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
}
