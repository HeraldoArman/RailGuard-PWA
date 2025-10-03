/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { kasus, gerbong, krl, user } from '@/db/schema';
import { desc, eq, and, gte } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status'); // filter by status
    const caseType = searchParams.get('caseType'); // filter by case type
    const gerbongId = searchParams.get('gerbongId'); // filter by gerbong
    const since = searchParams.get('since'); // get cases since timestamp
    const includeResolved = searchParams.get('includeResolved') === 'true';

    // Build where conditions
    const conditions = [];
    
    if (status) {
      conditions.push(eq(kasus.status, status as any));
    }
    
    if (caseType) {
      conditions.push(eq(kasus.caseType, caseType as any));
    }
    
    if (gerbongId) {
      conditions.push(eq(kasus.gerbongId, gerbongId));
    }
    
    if (since) {
      conditions.push(gte(kasus.reportedAt, new Date(since)));
    }

    // If not including resolved cases, exclude them
    if (!includeResolved) {
      conditions.push(eq(kasus.status, 'belum_ditangani'));
    }

    // Fetch latest cases with related data
    const latestCases = await db
      .select({
        // Kasus fields
        id: kasus.id,
        name: kasus.name,
        description: kasus.description,
        status: kasus.status,
        caseType: kasus.caseType,
        source: kasus.source,
        occupancyLabel: kasus.occupancyLabel,
        occupancyValue: kasus.occupancyValue,
        reportedAt: kasus.reportedAt,
        acknowledgedAt: kasus.acknowledgedAt,
        arrivedAt: kasus.arrivedAt,
        resolvedAt: kasus.resolvedAt,
        resolutionNotes: kasus.resolutionNotes,
        deskripsiKasus: kasus.deskripsiKasus,
        images: kasus.images,
        // Gerbong fields
        gerbongId: gerbong.id,
        gerbongName: gerbong.name,
        gerbongTotalPenumpang: gerbong.totalPenumpang,
        gerbongStatusKepadatan: gerbong.statusKepadatan,
        gerbongDeskripsi: gerbong.deskripsi,
        // KRL fields
        krlId: krl.id,
        krlName: krl.name,
        // Handler fields
        handlerId: user.id,
        handlerName: user.name,
        handlerEmail: user.email,
      })
      .from(kasus)
      .innerJoin(gerbong, eq(kasus.gerbongId, gerbong.id))
      .innerJoin(krl, eq(gerbong.krlId, krl.id))
      .leftJoin(user, eq(kasus.handlerId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(kasus.reportedAt))
      .limit(Math.min(limit, 100)); // Cap at 100 for performance

    // Transform the data for better structure
    const transformedCases = latestCases.map(caseData => ({
      id: caseData.id,
      name: caseData.name,
      description: caseData.description,
      status: caseData.status,
      caseType: caseData.caseType,
      source: caseData.source,
      occupancyLabel: caseData.occupancyLabel,
      occupancyValue: caseData.occupancyValue,
      reportedAt: caseData.reportedAt,
      acknowledgedAt: caseData.acknowledgedAt,
      arrivedAt: caseData.arrivedAt,
      resolvedAt: caseData.resolvedAt,
      resolutionNotes: caseData.resolutionNotes,
      deskripsiKasus: caseData.deskripsiKasus,
      images: caseData.images,
      gerbong: {
        id: caseData.gerbongId,
        name: caseData.gerbongName,
        totalPenumpang: caseData.gerbongTotalPenumpang,
        statusKepadatan: caseData.gerbongStatusKepadatan,
        deskripsi: caseData.gerbongDeskripsi,
      },
      krl: {
        id: caseData.krlId,
        name: caseData.krlName,
      },
      handler: caseData.handlerId ? {
        id: caseData.handlerId,
        name: caseData.handlerName,
        email: caseData.handlerEmail,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: transformedCases,
      count: transformedCases.length,
      filters: {
        limit,
        status,
        caseType,
        gerbongId,
        since,
        includeResolved,
      }
    });

  } catch (error) {
    console.error('Error fetching latest cases:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}