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
    // Clear existing data first (optional, remove if you want to keep existing data)
    await tx.delete(kasus);
    await tx.delete(userKrl);
    await tx.delete(gerbong);
    await tx.delete(krl);
    await tx.delete(user);

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
      ]);

    // ---------- KRL ----------
    const krlRedId = nanoid();
    const krlBlueId = nanoid();

    await tx
      .insert(krl)
      .values([
        { id: krlRedId, name: "KRL Red Line" },
        { id: krlBlueId, name: "KRL Blue Line" },
      ]);

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
          statusKepadatan: "padat",
        },
        {
          id: g2,
          name: "Gerbong 2",
          krlId: krlRedId,
          adaKasus: false,
          totalPenumpang: 70,
          statusKepadatan: "sedang",
        },
        {
          id: g3,
          name: "Gerbong 1",
          krlId: krlBlueId,
          adaKasus: false,
          totalPenumpang: 45,
          statusKepadatan: "longgar",
        },
        {
          id: g4,
          name: "Gerbong 2",
          krlId: krlBlueId,
          adaKasus: true,
          totalPenumpang: 95,
          statusKepadatan: "sedang",
        }
      ]);

    // ---------- KASUS ----------
    const ks1 = nanoid();
    const ks2 = nanoid();

    await tx
      .insert(kasus)
      .values([
        {
          id: ks1,
          name: "Kepadatan Berlebih Gerbong 1",
          images: ["https://example.com/img/kepadatan1.jpg"],
          description:
            "Deteksi kepadatan berlebih di gerbong 1 dengan tingkat okupansi tinggi.",
          status: "proses",
          occupancyLabel: "padat",
          occupancyValue: 85,
          caseType: "kepadatan",
          source: "ml",
          gerbongId: g1,
          handlerId: satpamId,
          deskripsiKasus: "AI mendeteksi kepadatan mencapai 85% dengan distribusi penumpang tidak merata",
        },
        {
          id: ks2,
          name: "Kepadatan Menumpuk Area Tengah",
          images: [],
          description:
            "Penumpang menumpuk di area tengah gerbong, aliran keluar masuk terganggu.",
          status: "belum_ditangani",
          occupancyLabel: "sedang",
          occupancyValue: 65,
          caseType: "kepadatan",
          source: "sensor",
          gerbongId: g4,
          handlerId: null,
          deskripsiKasus: "Sensor mendeteksi penumpukan di area tertentu meski okupansi keseluruhan masih sedang",
        },
      ]);

    // ---------- USER-KRL (Membership & Roles) ----------
    await tx
      .insert(userKrl)
      .values([
        { userId: adminId, krlId: krlRedId},
        { userId: satpamId, krlId: krlRedId},
        { userId: memberId, krlId: krlRedId},
        { userId: adminId, krlId: krlBlueId},
        { userId: memberId, krlId: krlBlueId },
      ]);
  });

  await pool.end();
  console.log("✅ Seeding selesai!");
}

main().catch((err) => {
  console.error("❌ Seeding gagal:", err);
  process.exit(1);
});