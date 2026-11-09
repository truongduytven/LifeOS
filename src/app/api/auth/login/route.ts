import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByUsername } from '@/db';
import { signToken, getSessionCookieName } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const userWithHash = await getUserByUsername(username.trim());
    if (!userWithHash) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, userWithHash.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: userWithHash.id,
      username: userWithHash.username,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userWithHash.id,
        username: userWithHash.username,
        displayName: userWithHash.displayName,
        hasVaultPin: userWithHash.hasVaultPin,
        createdAt: userWithHash.createdAt,
      },
    });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    );
  }
}
