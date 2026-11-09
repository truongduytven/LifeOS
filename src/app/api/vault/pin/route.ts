import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/auth';
import { query } from '@/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, pin, newPin } = body;

    if (!action || (action !== 'verify' && action !== 'change')) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'verify' or 'change'" },
        { status: 400 }
      );
    }

    const userRes = await query(
      'SELECT id, vault_pin_hash FROM users WHERE id = $1',
      [session.userId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRes.rows[0];

    if (action === 'verify') {
      if (!pin) {
        return NextResponse.json(
          { error: 'PIN is required' },
          { status: 400 }
        );
      }

      if (!user.vault_pin_hash) {
        return NextResponse.json(
          { error: 'Vault PIN is not configured yet', needsSetup: true },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(String(pin), user.vault_pin_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid PIN', verified: false },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, verified: true });
    }

    if (action === 'change') {
      if (user.vault_pin_hash) {
        if (!pin) {
          return NextResponse.json(
            { error: 'Current PIN is required to change PIN' },
            { status: 400 }
          );
        }

        const isCurrentValid = await bcrypt.compare(String(pin), user.vault_pin_hash);
        if (!isCurrentValid) {
          return NextResponse.json(
            { error: 'Current PIN is incorrect' },
            { status: 400 }
          );
        }

        if (!newPin || typeof newPin !== 'string' || newPin.trim().length < 4) {
          return NextResponse.json(
            { error: 'New PIN must be at least 4 digits' },
            { status: 400 }
          );
        }

        const newHash = await bcrypt.hash(newPin.trim(), 10);
        await query(
          'UPDATE users SET vault_pin_hash = $1, updated_at = NOW() WHERE id = $2',
          [newHash, session.userId]
        );

        return NextResponse.json({
          success: true,
          message: 'Vault PIN updated successfully',
        });
      } else {
        const targetPin = newPin || pin;
        if (!targetPin || typeof targetPin !== 'string' || targetPin.trim().length < 4) {
          return NextResponse.json(
            { error: 'PIN must be at least 4 digits' },
            { status: 400 }
          );
        }

        const newHash = await bcrypt.hash(targetPin.trim(), 10);
        await query(
          'UPDATE users SET vault_pin_hash = $1, updated_at = NOW() WHERE id = $2',
          [newHash, session.userId]
        );

        return NextResponse.json({
          success: true,
          message: 'Vault PIN set successfully',
        });
      }
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    console.error('Vault PIN error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing vault PIN' },
      { status: 500 }
    );
  }
}
