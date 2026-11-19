import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mysqlAuthRepository } from '../repositories/mysqlAuth.js';

const scrypt = promisify(scryptCallback);
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_KEY_LENGTH = 64;

export class AuthError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, PASSWORD_KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, saltHex, keyHex] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !/^[a-f\d]{32}$/i.test(saltHex) ||
      !/^[a-f\d]{128}$/i.test(keyHex)) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), PASSWORD_KEY_LENGTH);
  return timingSafeEqual(expected, actual);
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function newSession() {
  const token = randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  };
}

function publicUser(user, staffCafeIds = []) {
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    staffCafeIds,
  };
}

export function createAuthService(repository = mysqlAuthRepository) {
  return {
    async register({ name, email, password }) {
      const session = newSession();
      let user;
      try {
        user = await repository.registerUser({
          name,
          email,
          passwordHash: await hashPassword(password),
          tokenHash: session.tokenHash,
          expiresAt: session.expiresAt,
        });
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          throw new AuthError(409, 'EMAIL_IN_USE', 'An account with this email already exists.');
        }
        throw error;
      }
      return { user: publicUser(user), token: session.token };
    },

    async login({ email, password }) {
      const user = await repository.findUserByEmail(email);
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        throw new AuthError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
      }

      const session = newSession();
      await repository.createSession({
        userId: user.userId,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
      });
      const authenticatedUser = await repository.findUserBySessionHash(session.tokenHash);
      if (!authenticatedUser) {
        throw new Error('Created session could not be loaded.');
      }
      return { user: publicUser(authenticatedUser, authenticatedUser.staffCafeIds), token: session.token };
    },

    async authenticateToken(token) {
      if (!/^[a-f\d]{64}$/i.test(token ?? '')) return null;
      const user = await repository.findUserBySessionHash(hashToken(token));
      return user ? publicUser(user, user.staffCafeIds) : null;
    },

    async logout(token) {
      await repository.deleteSession(hashToken(token));
    },
  };
}

export const authService = createAuthService();
