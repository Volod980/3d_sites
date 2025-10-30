import { Router } from 'express';
import placesController from '../controllers/placesController';

const router = Router();

/**
 * @route   GET /api/places/search
 * @desc    Пошук туристичних місць за параметрами
 * @query   city, region, latitude, longitude, radius, types, limit
 */
router.get('/search', (req, res) => placesController.searchPlaces(req, res));

/**
 * @route   GET /api/places/city/:cityName
 * @desc    Отримання місць у конкретному місті
 * @param   cityName - назва міста
 */
router.get('/city/:cityName', (req, res) => placesController.getPlacesByCity(req, res));

/**
 * @route   GET /api/places/:id
 * @desc    Отримання деталей про конкретне місце
 * @param   id - ідентифікатор місця
 */
router.get('/:id', (req, res) => placesController.getPlaceDetails(req, res));

/**
 * @route   POST /api/places/route
 * @desc    Побудова оптимального маршруту
 * @body    { placeIds: string[], startPoint?: { latitude, longitude } }
 */
router.post('/route', (req, res) => placesController.buildRoute(req, res));

export default router;
