import { Router } from 'express';
import aiController from '../controllers/aiController';

const router = Router();

/**
 * @route   GET /api/ai/status
 * @desc    Перевірка статусу AI сервісу
 */
router.get('/status', (req, res) => aiController.getStatus(req, res));

/**
 * @route   POST /api/ai/recommendations
 * @desc    Отримати рекомендації місць від AI
 * @body    { request: string, city: string }
 */
router.post('/recommendations', (req, res) => aiController.getRecommendations(req, res));

/**
 * @route   POST /api/ai/chat
 * @desc    Чат з AI помічником
 * @body    { message: string, context?: string }
 */
router.post('/chat', (req, res) => aiController.chat(req, res));

/**
 * @route   POST /api/ai/route-description
 * @desc    Генерація опису маршруту
 * @body    { placeIds: string[], totalDistance?: number }
 */
router.post('/route-description', (req, res) => aiController.generateRouteDescription(req, res));

export default router;
