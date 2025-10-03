// src/app/api/krl/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { krl, gerbong, userKrl, kasus } from '@/db/schema';
import { eq, count, and } from 'drizzle-orm';
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

    // Get KRLs assigned to the user
    const userKrls = await db
      .select({
        krlId: krl.id,
        krlName: krl.name,
      })
      .from(krl)
      .innerJoin(userKrl, eq(krl.id, userKrl.krlId))
      .where(and(
        eq(userKrl.userId, session.user.id),
        eq(userKrl.isActive, true)
      ));

    // Get gerbong counts and problem status for each KRL
    const krlSummary = await Promise.all(
      userKrls.map(async (k) => {
        // Total gerbong count
        const [totalGerbongResult] = await db
          .select({ count: count() })
          .from(gerbong)
          .where(eq(gerbong.krlId, k.krlId));

        // Gerbong with problems (ada kasus = true)
        const [problematicGerbongResult] = await db
          .select({ count: count() })
          .from(gerbong)
          .where(and(
            eq(gerbong.krlId, k.krlId),
            eq(gerbong.adaKasus, true)
          ));

        const totalGerbong = totalGerbongResult?.count || 0;
        const problematicGerbong = problematicGerbongResult?.count || 0;
        const normalGerbong = totalGerbong - problematicGerbong;

        return {
          krlId: k.krlId,
          krlName: k.krlName,
          totalGerbong,
          normalGerbong,
          problematicGerbong,
        };
      })
    );

    return NextResponse.json(krlSummary);
  } catch (error) {
    console.error('Error fetching KRL summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}