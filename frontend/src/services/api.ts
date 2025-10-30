import axios from 'axios';
import { Place, Route, ApiResponse, PlaceType } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API сервіс для роботи з backend
 */
export const tourApi = {
  /**
   * Пошук туристичних місць
   */
  async searchPlaces(params: {
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    types?: PlaceType[];
    limit?: number;
  }): Promise<Place[]> {
    const queryParams = new URLSearchParams();

    if (params.city) queryParams.append('city', params.city);
    if (params.region) queryParams.append('region', params.region);
    if (params.latitude) queryParams.append('latitude', params.latitude.toString());
    if (params.longitude) queryParams.append('longitude', params.longitude.toString());
    if (params.radius) queryParams.append('radius', params.radius.toString());
    if (params.types) queryParams.append('types', params.types.join(','));
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<ApiResponse<Place[]>>(`/places/search?${queryParams.toString()}`);
    return response.data.data || [];
  },

  /**
   * Отримання місць у конкретному місті
   */
  async getPlacesByCity(cityName: string, limit: number = 50): Promise<Place[]> {
    const response = await api.get<ApiResponse<Place[]>>(`/places/city/${cityName}?limit=${limit}`);
    return response.data.data || [];
  },

  /**
   * Отримання деталей про місце
   */
  async getPlaceDetails(placeId: string): Promise<Place | null> {
    try {
      const response = await api.get<ApiResponse<Place>>(`/places/${placeId}`);
      return response.data.data || null;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  },

  /**
   * Побудова оптимального маршруту
   */
  async buildRoute(
    placeIds: string[],
    startPoint?: { latitude: number; longitude: number }
  ): Promise<Route | null> {
    try {
      const response = await api.post<ApiResponse<Route>>('/places/route', {
        placeIds,
        startPoint,
      });
      return response.data.data || null;
    } catch (error) {
      console.error('Error building route:', error);
      return null;
    }
  },
};

export default tourApi;
