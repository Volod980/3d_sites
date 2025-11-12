import { Request, Response } from 'express';
import googleMapsService from '../services/googleMapsService';
import osmService from '../services/osmService';
import routeService from '../services/routeService';
import { Place, SearchParams, RouteRequest } from '../types';
import { getMockPlacesForCity } from '../data/mockPlaces';

/**
 * Контролер для роботи з туристичними місцями
 */
export class PlacesController {
  /**
   * Пошук місць за параметрами
   * GET /api/places/search
   */
  async searchPlaces(req: Request, res: Response): Promise<void> {
    try {
      const params: SearchParams = {
        city: req.query.city as string,
        region: req.query.region as string,
        latitude: req.query.latitude ? parseFloat(req.query.latitude as string) : undefined,
        longitude: req.query.longitude ? parseFloat(req.query.longitude as string) : undefined,
        radius: req.query.radius ? parseInt(req.query.radius as string) : undefined,
        types: req.query.types ? (req.query.types as string).split(',') as any[] : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const places = await osmService.searchPlaces(params);

      res.json({
        success: true,
        count: places.length,
        data: places
      });
    } catch (error) {
      console.error('Error searching places:', error);
      res.status(500).json({
        success: false,
        error: 'Помилка при пошуку місць'
      });
    }
  }

  /**
   * Отримання деталей про конкретне місце
   * GET /api/places/:id
   */
  async getPlaceDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const place = await osmService.getPlaceDetails(id);

      if (!place) {
        res.status(404).json({
          success: false,
          error: 'Місце не знайдено'
        });
        return;
      }

      res.json({
        success: true,
        data: place
      });
    } catch (error) {
      console.error('Error fetching place details:', error);
      res.status(500).json({
        success: false,
        error: 'Помилка при отриманні деталей місця'
      });
    }
  }

  /**
   * Побудова оптимального маршруту
   * POST /api/places/route
   * Body: { placeIds: string[], startPoint?: { latitude, longitude } }
   */
  async buildRoute(req: Request, res: Response): Promise<void> {
    try {
      const { placeIds, startPoint } = req.body as RouteRequest;

      if (!placeIds || !Array.isArray(placeIds) || placeIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Необхідно вказати масив ідентифікаторів місць'
        });
        return;
      }

      // Отримуємо деталі всіх місць
      const placesResults: (Place | null)[] = await Promise.all(
        placeIds.map(async (id) => {
          // Якщо це mock дані - шукаємо в mock
          if (id.startsWith('mock-')) {
            const mockPlaces = getMockPlacesForCity('Київ');
            return mockPlaces.find(p => p.id === id) || null;
          }

          // Спробуємо Google Maps якщо доступний
          if (googleMapsService.isAvailable()) {
            try {
              return await googleMapsService.getPlaceDetails(id);
            } catch (error) {
              console.log('Google Maps не повернув деталі, пробуємо OSM');
            }
          }

          // Fallback на OSM
          return await osmService.getPlaceDetails(id);
        })
      );

      // Фільтруємо null значення
      const places = placesResults.filter(place => place !== null) as Place[];

      if (places.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Жодного з вказаних місць не знайдено'
        });
        return;
      }

      // Будуємо оптимальний маршрут
      const route = routeService.buildOptimalRoute(places, startPoint);

      res.json({
        success: true,
        data: route
      });
    } catch (error) {
      console.error('Error building route:', error);
      res.status(500).json({
        success: false,
        error: 'Помилка при побудові маршруту'
      });
    }
  }

  /**
   * Пошук популярних місць у конкретному місті
   * GET /api/places/city/:cityName?limit=50&minRating=4.0&minReviews=10
   */
  async getPlacesByCity(req: Request, res: Response): Promise<void> {
    try {
      const { cityName } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
      const minReviews = req.query.minReviews ? parseInt(req.query.minReviews as string) : undefined;

      let places: Place[] = [];
      let dataSource = 'unknown';

      // Пріоритет 1: Google Maps (найкращий варіант з рейтингами)
      if (googleMapsService.isAvailable()) {
        try {
          console.log(`🔍 Шукаємо місця через Google Maps: ${cityName}`);
          places = await googleMapsService.searchPlaces({
            city: cityName,
            limit,
            minRating,
            minReviews
          });
          dataSource = 'Google Maps';
          console.log(`✅ Google Maps: знайдено ${places.length} місць`);
        } catch (googleError: any) {
          console.error('Google Maps помилка:', googleError.message);
          // Продовжуємо до fallback
        }
      }

      // Пріоритет 2: Mock дані (тільки для Києва, для демонстрації)
      if (places.length === 0) {
        places = getMockPlacesForCity(cityName);
        if (places.length > 0) {
          dataSource = 'Mock дані (демо)';
          console.log(`⚠️  Використано mock дані для ${cityName}`);
        }
      }

      // Пріоритет 3: OpenStreetMap (може не працювати через proxy)
      if (places.length === 0) {
        try {
          console.log(`🔍 Шукаємо через OpenStreetMap: ${cityName}`);
          places = await osmService.searchPlaces({
            city: cityName,
            limit
          });
          dataSource = 'OpenStreetMap';
        } catch (osmError) {
          console.log('OSM не доступний');
        }
      }

      // Якщо нічого не знайшли - показуємо Київ як приклад
      if (places.length === 0) {
        console.log('Нічого не знайдено, показуємо Київ як приклад');
        places = getMockPlacesForCity('Київ');
        dataSource = 'Mock дані (Київ як приклад)';
      }

      if (places.length === 0) {
        res.status(404).json({
          success: false,
          error: `Не знайдено туристичних місць у місті "${cityName}". Додайте Google Maps API ключ для повного функціоналу.`
        });
        return;
      }

      res.json({
        success: true,
        city: cityName,
        count: places.length,
        data: places,
        dataSource,
        filters: {
          minRating: minRating || 'none',
          minReviews: minReviews || 'none'
        }
      });
    } catch (error) {
      console.error('Error fetching places by city:', error);
      res.status(500).json({
        success: false,
        error: 'Помилка при пошуку місць у місті'
      });
    }
  }
}

export default new PlacesController();
