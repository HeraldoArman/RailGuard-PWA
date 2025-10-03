import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { kasus, gerbong, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { kasusId, status } = await request.json();
    if (!kasusId || !status) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Update kasus
    const [updated] = await db
      .update(kasus)
      .set({
        status,
        handlerId: session.user.id,
        acknowledgedAt: status === "proses" ? new Date() : undefined,
        resolvedAt: status === "selesai" ? new Date() : undefined,
      })
      .where(eq(kasus.id, kasusId))
      .returning();

    if (!updated) return NextResponse.json({ error: "Kasus not found" }, { status: 404 });

    // Ambil info user & gerbong
    const [handler] = await db.select().from(user).where(eq(user.id, session.user.id));
    const [g] = await db.select().from(gerbong).where(eq(gerbong.id, updated.gerbongId));

    const message =
      status === "proses"
        ? `${handler?.name ?? "Petugas"} sedang menangani kasus di ${g?.name ?? "gerbong"}`
        : `${handler?.name ?? "Petugas"} telah menyelesaikan kasus di ${g?.name ?? "gerbong"}`;

    return NextResponse.json({
      success: true,
      data: { updated, message },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
