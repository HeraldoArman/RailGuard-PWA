// src/app/api/user/krl-selection/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userKrl } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
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
    const { krlId } = body;

    if (!krlId) {
      return NextResponse.json(
        { error: 'KRL ID is required' },
        { status: 400 }
      );
    }

    // First, deactivate all current KRL assignments for this user
    await db
      .update(userKrl)
      .set({ isActive: false })
      .where(eq(userKrl.userId, session.user.id));

    // Then activate the selected KRL
    const [updatedAssignment] = await db
      .update(userKrl)
      .set({ 
        isActive: true,
        assignedFrom: new Date(),
      })
      .where(and(
        eq(userKrl.userId, session.user.id),
        eq(userKrl.krlId, krlId)
      ))
      .returning();

    if (!updatedAssignment) {
      // Create new assignment if it doesn't exist
      const [newAssignment] = await db
        .insert(userKrl)
        .values({
          userId: session.user.id,
          krlId: krlId,
          role: 'satpam',
          isActive: true,
          assignedFrom: new Date(),
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: 'KRL selected successfully',
        assignment: newAssignment,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'KRL selected successfully',
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error('Error selecting KRL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Get current active KRL for the user
    const [activeKrl] = await db
      .select({
        krlId: userKrl.krlId,
        assignedFrom: userKrl.assignedFrom,
      })
      .from(userKrl)
      .where(and(
        eq(userKrl.userId, session.user.id),
        eq(userKrl.isActive, true)
      ))
      .limit(1);

    return NextResponse.json({
      activeKrlId: activeKrl?.krlId || null,
      assignedFrom: activeKrl?.assignedFrom || null,
    });
  } catch (error) {
    console.error('Error fetching active KRL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}