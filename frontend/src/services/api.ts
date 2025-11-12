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
  async getPlacesByCity(
    cityName: string,
    options?: {
      limit?: number;
      minRating?: number;
      minReviews?: number;
    }
  ): Promise<Place[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.minRating) params.append('minRating', options.minRating.toString());
    if (options?.minReviews) params.append('minReviews', options.minReviews.toString());

    const queryString = params.toString();
    const url = `/places/city/${cityName}${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<ApiResponse<Place[]>>(url);
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

  /**
   * Перевірка доступності AI сервісу
   */
  async checkAIStatus(): Promise<{ available: boolean; message?: string }> {
    try {
      const response = await api.get('/ai/status');
      return response.data.data || { available: false };
    } catch (error) {
      console.error('Error checking AI status:', error);
      return { available: false, message: 'Помилка перевірки AI сервісу' };
    }
  },

  /**
   * Отримання рекомендацій від AI
   */
  async getAIRecommendations(request: string, city: string): Promise<{
    recommendations: string[];
    explanation: string;
  } | null> {
    try {
      const response = await api.post('/ai/recommendations', {
        request,
        city,
      });
      return response.data.data || null;
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      return null;
    }
  },

  /**
   * Чат з AI асистентом
   */
  async chatWithAI(message: string, context?: string): Promise<string | null> {
    try {
      const response = await api.post('/ai/chat', {
        message,
        context,
      });
      return response.data.data?.response || null;
    } catch (error) {
      console.error('Error chatting with AI:', error);
      return null;
    }
  },

  /**
   * Отримання опису маршруту від AI
   */
  async getRouteDescription(places: Place[], totalDistance: number): Promise<string | null> {
    try {
      const response = await api.post('/ai/route-description', {
        places,
        totalDistance,
      });
      return response.data.data?.description || null;
    } catch (error) {
      console.error('Error getting route description:', error);
      return null;
    }
  },
};

export default tourApi;
