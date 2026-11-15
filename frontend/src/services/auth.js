import { requestJson } from './api.js';

export const sessionEnabled = import.meta.env.VITE_ACCOUNT_API === 'true';
export const getSession = (signal) => requestJson('/auth/me', { signal });
export const signIn = (credentials) => requestJson('/auth/login', { method: 'POST', body: credentials });
export const register = (details) => requestJson('/auth/register', { method: 'POST', body: details });
export const signOut = () => requestJson('/auth/logout', { method: 'POST' });
