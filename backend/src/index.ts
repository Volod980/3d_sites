import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import placesRoutes from './routes/placesRoutes';

// Завантажуємо змінні оточення
dotenv.config();

const app: Application = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логування запитів
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/places', placesRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Tour Builder API'
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Tour Builder API',
    version: '1.0.0',
    description: 'API для побудови туристичних маршрутів по Україні',
    endpoints: {
      health: 'GET /health',
      searchPlaces: 'GET /api/places/search',
      getPlacesByCity: 'GET /api/places/city/:cityName',
      getPlaceDetails: 'GET /api/places/:id',
      buildRoute: 'POST /api/places/route'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не знайдено'
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Внутрішня помилка сервера'
  });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log('=================================');
  console.log(`🚀 Tour Builder API`);
  console.log(`🌍 Server running on port ${PORT}`);
  console.log(`📍 http://0.0.0.0:${PORT}`);
  console.log('=================================');
});

export default app;
