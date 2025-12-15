/**
 * Authentication Utilities
 * Simple API key auth for admin endpoints
 */

import type { Env } from '../types';

/**
 * Verify authorization header
 * Supports:
 * - Bearer token (JWT or API key)
 * - Basic auth (for admin panel)
 */
export async function verifyAuth(env: Env, authHeader: string): Promise<boolean> {
  if (!authHeader) return false;

  // Bearer token auth
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return verifyApiKey(env, token);
  }

  // Basic auth
  if (authHeader.startsWith('Basic ')) {
    const base64 = authHeader.slice(6);
    try {
      const decoded = atob(base64);
      const [username, password] = decoded.split(':');
      return verifyBasicAuth(env, username, password);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Verify API key against configured admin key
 */
function verifyApiKey(env: Env, key: string): boolean {
  const adminKey = env.ADMIN_API_KEY;
  if (!adminKey) {
    console.warn('[Auth] No ADMIN_API_KEY configured');
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(key, adminKey);
}

/**
 * Verify basic auth credentials
 */
function verifyBasicAuth(env: Env, username: string, password: string): boolean {
  // For simplicity, use the API key as password with fixed username
  if (username !== 'admin') return false;
  return verifyApiKey(env, password);
}

/**
 * Generate a session token (for future JWT implementation)
 */
export async function generateSessionToken(
  env: Env,
  userId: string,
  expiresIn: number = 86400
): Promise<string> {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  // Simple JWT-like token (for production, use a proper JWT library)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    })
  );

  const signature = await hmacSign(`${header}.${payload}`, jwtSecret);

  return `${header}.${payload}.${signature}`;
}

/**
 * Verify a session token
 */
export async function verifySessionToken(
  env: Env,
  token: string
): Promise<{ valid: boolean; userId?: string }> {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    return { valid: false };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false };
  }

  const [header, payload, signature] = parts;

  // Verify signature
  const expectedSignature = await hmacSign(`${header}.${payload}`, jwtSecret);
  if (!timingSafeEqual(signature, expectedSignature)) {
    return { valid: false };
  }

  // Decode and check expiration
  try {
    const decoded = JSON.parse(atob(payload));
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }
    return { valid: true, userId: decoded.sub };
  } catch {
    return { valid: false };
  }
}

/**
 * HMAC-SHA256 signing
 */
async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Constant-time string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate a random API key
 */
export function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
