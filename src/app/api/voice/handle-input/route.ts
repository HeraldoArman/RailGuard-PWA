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

    const { kasusId, transcript } = await request.json();

    if (!kasusId || !transcript) {
      return NextResponse.json(
        { error: 'Kasus ID and transcript are required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    let newStatus: "proses" | "selesai" | null = null;

    // Analyze transcript for commands
    if (/selesai|resolved|done|finish/i.test(transcript)) {
      newStatus = "selesai";
    } else if (/tangani|handle|proses|take|ambil/i.test(transcript)) {
      newStatus = "proses";
    }

    if (newStatus) {
      const [updated] = await db
        .update(kasus)
        .set({ 
          status: newStatus, 
          handlerId: userId,
          acknowledgedAt: newStatus === "proses" ? new Date() : undefined,
          resolvedAt: newStatus === "selesai" ? new Date() : undefined,
        })
        .where(eq(kasus.id, kasusId))
        .returning();

      return NextResponse.json({
        success: true,
        data: { 
          action: "update_status", 
          updated,
          message: `Status updated to ${newStatus}`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: { 
        action: "none", 
        message: "Tidak ada perintah valid di suara" 
      }
    });
  } catch (error) {
    console.error('Error handling voice input:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}