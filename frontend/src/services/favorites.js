import { requestJson } from './api.js';

export const getFavorites = (signal) => requestJson('/favorites', { signal });
export const saveFavorite = (id, active) => requestJson(`/favorites/${id}`, { method: active ? 'PUT' : 'DELETE' });
