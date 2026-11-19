import { Router } from 'express';
import { AuthError, authService } from '../services/auth.js';
import { createRequireSession, readSessionToken, SESSION_COOKIE } from '../middleware/auth.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function parseCredentials(body, registration = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { email, password, name } = body;
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim()) ||
      typeof password !== 'string' || password.length < 8 || password.length > 128) return null;
  if (registration && (typeof name !== 'string' || !name.trim() || name.trim().length > 80)) return null;
  return {
    email: email.trim().toLowerCase(),
    password,
    ...(registration ? { name: name.trim() } : {}),
  };
}

function setSessionCookie(response, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`,
  );
}

function clearSessionCookie(response) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

export function createAuthRouter(service = authService) {
  const router = Router();
  const requireSession = createRequireSession(service);

  router.post('/auth/register', async (request, response, next) => {
    const details = parseCredentials(request.body, true);
    if (!details) {
      return response.status(400).json({
        error: { code: 'INVALID_REGISTRATION', message: 'Provide a valid name, email, and password (8-128 characters).' },
      });
    }
    try {
      const { user, token } = await service.register(details);
      setSessionCookie(response, token);
      response.status(201).json(user);
    } catch (error) {
      next(error);
    }
  });

  router.post('/auth/login', async (request, response, next) => {
    const details = parseCredentials(request.body);
    if (!details) {
      return response.status(400).json({
        error: { code: 'INVALID_LOGIN', message: 'Provide a valid email and password.' },
      });
    }
    try {
      const { user, token } = await service.login(details);
      setSessionCookie(response, token);
      response.json(user);
    } catch (error) {
      next(error);
    }
  });

  router.get('/auth/me', requireSession, (request, response) => {
    response.json(request.user);
  });

  router.post('/auth/logout', requireSession, async (request, response, next) => {
    try {
      await service.logout(request.authToken ?? readSessionToken(request));
      clearSessionCookie(response);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  router.use((error, _request, response, next) => {
    if (error instanceof AuthError) {
      return response.status(error.status).json({
        error: { code: error.code, message: error.message },
      });
    }
    if (error.code?.startsWith('ER_') ||
        ['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST'].includes(error.code)) {
      console.error('Authentication database operation failed:', error);
      return response.status(503).json({
        error: { code: 'AUTH_UNAVAILABLE', message: 'Authentication is temporarily unavailable.' },
      });
    }
    next(error);
  });
  return router;
}

export default createAuthRouter();
