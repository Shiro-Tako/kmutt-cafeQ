import { authService } from '../services/auth.js';

export const SESSION_COOKIE = 'cafeq_session';

export function readSessionToken(request) {
  const cookieHeader = request.headers.cookie ?? '';
  const entry = cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return entry?.slice(SESSION_COOKIE.length + 1) ?? null;
}

function sendUnauthorized(response) {
  response.status(401).json({
    error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
  });
}

function sendDatabaseUnavailable(error, response, next) {
  if (error.code?.startsWith('ER_') ||
      ['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST'].includes(error.code)) {
    console.error('Authentication database operation failed:', error);
    response.status(503).json({
      error: { code: 'AUTH_UNAVAILABLE', message: 'Authentication is temporarily unavailable.' },
    });
    return;
  }
  next(error);
}

export function createRequireSession(service = authService) {
  return async function requireSession(request, response, next) {
    const token = readSessionToken(request);
    if (!token) return sendUnauthorized(response);
    try {
      const user = await service.authenticateToken(token);
      if (!user) return sendUnauthorized(response);
      request.authToken = token;
      request.user = user;
      next();
    } catch (error) {
      sendDatabaseUnavailable(error, response, next);
    }
  };
}

export function createRequireStaffCafe(service = authService) {
  return async function requireStaffCafe(request, response, next) {
    const token = readSessionToken(request);
    if (!token) return sendUnauthorized(response);
    try {
      const user = await service.authenticateToken(token);
      if (!user) return sendUnauthorized(response);
      request.user = user;
      if (!user.staffCafeIds.includes(response.locals.catalogCafeId)) {
        return response.status(403).json({
          error: { code: 'FORBIDDEN', message: 'You do not have staff access to this café.' },
        });
      }
      next();
    } catch (error) {
      sendDatabaseUnavailable(error, response, next);
    }
  };
}

export const requireSession = createRequireSession();
export const requireStaffCafe = createRequireStaffCafe();
