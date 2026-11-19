import { Router } from 'express';
import { createFavoritesController } from '../controllers/favorites.js';
import { createRequireSession } from '../middleware/auth.js';
import { authService } from '../services/auth.js';
import { mysqlFavoritesRepository } from '../repositories/mysqlFavorites.js';

function isDatabaseError(error) {
  return error.code?.startsWith('ER_') ||
    ['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST'].includes(error.code);
}

export function createFavoritesRouter({
  repository = mysqlFavoritesRepository,
  service = authService,
} = {}) {
  const router = Router();
  const controller = createFavoritesController(repository);

  router.use('/favorites', createRequireSession(service));
  router.get('/favorites', controller.getFavorites);
  router.put('/favorites/:menuItemId', controller.addFavorite);
  router.delete('/favorites/:menuItemId', controller.removeFavorite);
  router.use((error, _request, response, next) => {
    if (!isDatabaseError(error)) return next(error);
    console.error('Favorites database operation failed:', error);
    response.status(503).json({
      error: { code: 'FAVORITES_UNAVAILABLE', message: 'Favorites are temporarily unavailable.' },
    });
  });
  return router;
}

export default createFavoritesRouter();
