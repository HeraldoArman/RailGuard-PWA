import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { krl, gerbong } from "@/db/schema";
import { eq } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export async function GET(request: NextRequest) {
  try {
    // Get all KRL with their gerbong data
    const krlData = await db
      .select({
        id: krl.id,
        name: krl.name,
        createdAt: krl.createdAt,
        updatedAt: krl.updatedAt,
      })
      .from(krl)
      .orderBy(krl.name);

    // Get all gerbong data for each KRL
    const krlWithGerbong = await Promise.all(
      krlData.map(async (krlItem) => {
        const gerbongData = await db
          .select({
            id: gerbong.id,
            name: gerbong.name,
            adaKasus: gerbong.adaKasus,
            totalPenumpang: gerbong.totalPenumpang,
            statusKepadatan: gerbong.statusKepadatan,
            deskripsi: gerbong.deskripsi,
            createdAt: gerbong.createdAt,
            updatedAt: gerbong.updatedAt,
          })
          .from(gerbong)
          .where(eq(gerbong.krlId, krlItem.id))
          .orderBy(gerbong.name);

        return {
          ...krlItem,
          gerbong: gerbongData,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: krlWithGerbong,
      message: "Successfully retrieved all KRL data",
    });
  } catch (error) {
    console.error("Error fetching KRL data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch KRL data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}