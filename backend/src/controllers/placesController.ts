import { Request, Response } from 'express';
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
      const placePromises = placeIds.map(id => osmService.getPlaceDetails(id));
      const placesResults = await Promise.all(placePromises);

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
   * GET /api/places/city/:cityName
   */
  async getPlacesByCity(req: Request, res: Response): Promise<void> {
    try {
      const { cityName } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      let places: Place[] = [];

      // Спочатку пробуємо отримати mock дані
      places = getMockPlacesForCity(cityName);

      // Якщо mock даних немає - пробуємо OSM (але це може не працювати)
      if (places.length === 0) {
        try {
          places = await osmService.searchPlaces({
            city: cityName,
            limit
          });
        } catch (osmError) {
          console.log('OSM не доступний, використовуємо mock дані для Києва');
          // Якщо OSM не працює - показуємо Київ як приклад
          places = getMockPlacesForCity('Київ');
        }
      }

      if (places.length === 0) {
        res.status(404).json({
          success: false,
          error: `Не знайдено туристичних місць у місті "${cityName}". Спробуйте "Київ".`
        });
        return;
      }

      res.json({
        success: true,
        city: cityName,
        count: places.length,
        data: places,
        note: places[0]?.id?.startsWith('mock') ? 'Демонстраційні дані' : undefined
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
