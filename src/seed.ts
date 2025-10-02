// seed.ts
import "dotenv/config";
import { nanoid } from "nanoid";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  user,
  session,
  account,
  verification,
  krl,
  gerbong,
  kasus,
  userKrl,
  satpamStatusEnum,
} from "@/db/schema";

import { eq } from "drizzle-orm";

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in .env");
  }

  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool);

  // Bungkus semua dalam transaction agar konsisten
  await db.transaction(async (tx) => {
    // ---------- USERS ----------
    const adminId = nanoid();
    const satpamId = nanoid();
    const memberId = nanoid();

    await tx
      .insert(user)
      .values([
        {
          id: adminId,
          name: "Admin RailGuard",
          email: "admin@railguard.local",
          emailVerified: true,
          image: null,
        },
        {
          id: satpamId,
          name: "Satpam A",
          email: "satpam.a@railguard.local",
          emailVerified: true,
          image: null,
        },
        {
          id: memberId,
          name: "Member B",
          email: "member.b@railguard.local",
          emailVerified: false,
          image: null,
        },
      ])
      .onConflictDoNothing();

    // ---------- KRL ----------
    const krlRedId = nanoid();
    const krlBlueId = nanoid();

    await tx
      .insert(krl)
      .values([
        { id: krlRedId, name: "KRL Red Line" },
        { id: krlBlueId, name: "KRL Blue Line" },
      ])
      .onConflictDoNothing();

    // ---------- GERBONG ----------
    const g1 = nanoid();
    const g2 = nanoid();
    const g3 = nanoid();
    const g4 = nanoid();

    await tx
      .insert(gerbong)
      .values([
        {
          id: g1,
          name: "Gerbong 1",
          krlId: krlRedId,
          adaKasus: true,
          totalPenumpang: 120,
          statusKepadatan: "Padat",
        },
        {
          id: g2,
          name: "Gerbong 2",
          krlId: krlRedId,
          adaKasus: false,
          totalPenumpang: 70,
          statusKepadatan: "Sedang",
        },
        {
          id: g3,
          name: "Gerbong 1",
          krlId: krlBlueId,
          adaKasus: false,
          totalPenumpang: 45,
          statusKepadatan: "Longgar",
        },
        {
          id: g4,
          name: "Gerbong 2",
          krlId: krlBlueId,
          adaKasus: true,
          totalPenumpang: 95,
          statusKepadatan: "Sedang",
        },
      ])
      .onConflictDoNothing();

    // ---------- KASUS ----------
    const ks1 = nanoid();
    const ks2 = nanoid();

    await tx
      .insert(kasus)
      .values([
        {
          id: ks1,
          name: "Pelecehan Verbal",
          images: ["https://example.com/img/pelecehan1.jpg"],
          description:
            "Laporan pelecehan verbal antar penumpang di dekat pintu masuk.",
          status: "proses",
          occupancyLabel: "Padat",
          occupancyValue: 85,
          caseType: "keamanan",
          gerbongId: g1,
          handlerId: satpamId,
        },
        {
          id: ks2,
          name: "Kepadatan Berlebih",
          images: [],
          description:
            "Penumpang menumpuk di area tengah gerbong, aliran keluar masuk terganggu.",
          status: "belum_ditangani",
          occupancyLabel: "Sedang",
          occupancyValue: 65,
          caseType: "kepadatan",
          gerbongId: g4,
          handlerId: null,
        },
      ])
      .onConflictDoNothing();

    // ---------- USER-KRL (Membership & Roles) ----------
    await tx
      .insert(userKrl)
      .values([
        { userId: "OwgEJMCo8CR5BsINDK6lLY5Qc75vPYOZ", krlId: krlRedId},
        // { userId: satpamId, krlId: krlRedId},
        // { userId: memberId, krlId: krlRedId},

        // { userId: adminId, krlId: krlBlueId},
        // { userId: memberId, krlId: krlBlueId },
      ])
      .onConflictDoNothing();

    // Contoh update otomatis timestamps untuk beberapa tabel (opsional sanity check)
    // await tx.update(kasus).set({ updatedAt: new Date() }).where(eq(kasus.id, ks1));
  });

  await pool.end();
  console.log("✅ Seeding selesai!");
}

main().catch((err) => {
  console.error("❌ Seeding gagal:", err);
  process.exit(1);
});
