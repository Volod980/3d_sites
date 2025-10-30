// Типи для місць (пам'яток)
export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  category: string;
  latitude: number;
  longitude: number;
  description?: string;
  rating?: number;
  tags?: Record<string, string>;
  address?: string;
  website?: string;
  imageUrl?: string;
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

// Параметри пошуку
export interface SearchParams {
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // в метрах
  types?: PlaceType[];
  limit?: number;
}

// Маршрут
export interface Route {
  places: Place[];
  totalDistance: number; // в метрах
  optimizedOrder: number[]; // індекси місць в оптимальному порядку
  segments: RouteSegment[];
}

// Сегмент маршруту між двома точками
export interface RouteSegment {
  from: Place;
  to: Place;
  distance: number;
}

// Запит на побудову маршруту
export interface RouteRequest {
  placeIds: string[];
  startPoint?: {
    latitude: number;
    longitude: number;
  };
}
