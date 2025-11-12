import { Request, Response } from 'express';
import aiService from '../services/aiService';
import osmService from '../services/osmService';
import { getMockPlacesForCity } from '../data/mockPlaces';

/**
 * Контролер для AI функцій
 */
export class AIController {
  /**
   * Отримати рекомендації від AI
   * POST /api/ai/recommendations
   * Body: { request: string, city: string }
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { request, city } = req.body;

      if (!request || !city) {
        res.status(400).json({
          success: false,
          error: 'Необхідно вказати request та city'
        });
        return;
      }

      // Отримуємо місця для міста (спочатку mock дані)
      let places = getMockPlacesForCity(city);

      // Якщо mock даних немає - пробуємо OSM
      if (places.length === 0) {
        try {
          places = await osmService.searchPlaces({ city, limit: 50 });
        } catch (error) {
          // Якщо OSM не працює - використовуємо mock для Києва
          places = getMockPlacesForCity('Київ');
        }
      }

      if (places.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Місця не знайдено для цього міста'
        });
        return;
      }

      // Отримуємо рекомендації від AI
      const recommendations = await aiService.getPlaceRecommendations(request, places);

      // Фільтруємо місця за рекомендаціями AI
      const recommendedPlaces = places.filter(p =>
        recommendations.recommendations.some(rec =>
          rec.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(rec.toLowerCase())
        )
      );

      res.json({
        success: true,
        data: {
          recommendations: recommendedPlaces,
          explanation: recommendations.explanation,
          totalPlaces: places.length
        }
      });
    } catch (error) {
      console.error('AI recommendations error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Помилка при отриманні рекомендацій'
      });
    }
  }

  /**
   * Чат з AI помічником
   * POST /api/ai/chat
   * Body: { message: string, context?: string }
   */
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const { message, context } = req.body;

      if (!message) {
        res.status(400).json({
          success: false,
          error: 'Необхідно вказати message'
        });
        return;
      }

      const response = await aiService.chat(message, context);

      res.json({
        success: true,
        data: {
          message: response
        }
      });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Помилка при спілкуванні з AI'
      });
    }
  }

  /**
   * Генерація опису маршруту
   * POST /api/ai/route-description
   * Body: { placeIds: string[] }
   */
  async generateRouteDescription(req: Request, res: Response): Promise<void> {
    try {
      const { placeIds, totalDistance } = req.body;

      if (!placeIds || !Array.isArray(placeIds)) {
        res.status(400).json({
          success: false,
          error: 'Необхідно вказати placeIds'
        });
        return;
      }

      // Отримуємо деталі місць (з mock даних для демо)
      const allPlaces = getMockPlacesForCity('Київ');
      const places = allPlaces.filter(p => placeIds.includes(p.id));

      if (places.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Місця не знайдено'
        });
        return;
      }

      const description = await aiService.generateRouteDescription(
        places,
        totalDistance || 10000
      );

      res.json({
        success: true,
        data: {
          description
        }
      });
    } catch (error) {
      console.error('AI description error:', error);
      res.status(500).json({
        success: false,
        error: 'Помилка при генерації опису'
      });
    }
  }

  /**
   * Перевірка статусу AI сервісу
   * GET /api/ai/status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        available: aiService.isAvailable(),
        message: aiService.isAvailable()
          ? 'AI сервіс доступний'
          : 'AI сервіс недоступний. Додайте GEMINI_API_KEY в .env'
      }
    });
  }
}

export default new AIController();
