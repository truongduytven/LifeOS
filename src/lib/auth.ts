import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
  return new TextEncoder().encode(secret);
}

export function getSessionCookieName(): string {
  const name = process.env.SESSION_COOKIE_NAME;
  if (!name) {
    throw new Error('Missing required environment variable: SESSION_COOKIE_NAME');
  }
  return name;
}

// Deprecated alias for backwards compatibility: reads process.env.SESSION_COOKIE_NAME with zero hardcoded default
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME!;

export interface SessionPayload {
  userId: number;
  username: string;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    if (!payload.userId || !payload.username) return null;
    return {
      userId: Number(payload.userId),
      username: String(payload.username),
    };
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const cookieName = getSessionCookieName();
    const token = cookieStore.get(cookieName)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(
  request: NextRequest | Request
): Promise<SessionPayload | null> {
  try {
    const cookieName = getSessionCookieName();
    if ('cookies' in request && typeof (request as any).cookies?.get === 'function') {
      const token = (request as NextRequest).cookies.get(cookieName)?.value;
      if (token) return await verifyToken(token);
    }
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;
    const match = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${cookieName}=`));
    if (!match) return null;
    const token = match.split('=')[1];
    return await verifyToken(token);
  } catch {
    return null;
  }
}
