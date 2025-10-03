import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { kasus } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { kasusId } = await request.json();

    if (!kasusId) {
      return NextResponse.json(
        { error: 'Kasus ID is required' },
        { status: 400 }
      );
    }

    // Update kasus status to "proses" and assign handler
    const [updatedKasus] = await db
      .update(kasus)
      .set({
        status: 'proses',
        handlerId: session.user.id,
        acknowledgedAt: new Date(),
      })
      .where(eq(kasus.id, kasusId))
      .returning();

    if (!updatedKasus) {
      return NextResponse.json(
        { error: 'Kasus not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      kasus: updatedKasus,
    });
  } catch (error) {
    console.error('Error taking kasus:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}