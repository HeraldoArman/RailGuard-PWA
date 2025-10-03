// src/app/api/user/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [userData] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        isVoiceActive: user.isVoiceActive,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: userData,
      settings: {
        status: true, // You can add this to user table if needed
        sound: userData.isVoiceActive,
      }
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings are required' },
        { status: 400 }
      );
    }

    // Update user voice setting
    const [updatedUser] = await db
      .update(user)
      .set({
        isVoiceActive: settings.sound,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}