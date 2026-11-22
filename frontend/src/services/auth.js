import { requestJson } from './api.js';

export const sessionEnabled = true;
export const getSession = (signal) => requestJson('/auth/me', { signal });
export const signIn = (credentials) => requestJson('/auth/login', { method: 'POST', body: credentials });
export const register = (details) => requestJson('/auth/register', { method: 'POST', body: details });
export const getTeam = (cafeId, signal) => requestJson(`/staff/cafes/${cafeId}/team`, { signal });
export const addStaff = (cafeId, details) => requestJson(`/staff/cafes/${cafeId}/team`, { method: 'POST', body: details });
export const signOut = () => requestJson('/auth/logout', { method: 'POST' });
