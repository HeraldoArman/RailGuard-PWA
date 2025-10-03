import {
  createTRPCRouter,
  baseProcedure,
  protectedProcedure,
} from "@/trpc/init";
import { db } from "@/db";
import { gerbong, kasus, krl, user, userKrl } from "@/db/schema";
import { z } from "zod";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  sql,
  isNull,
} from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createTRPCReact } from "@trpc/react-query";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = 100;

const satpamStatusValues = ["belum_ditangani", "proses", "selesai"] as const;
type SatpamStatus = (typeof satpamStatusValues)[number];

const caseTypeValues = [
  "pelecehan",
  "prioritas",
  "pencopetan",
  "keamanan",
  "keributan",
  "darurat",
  "lainnya",
  "kepadatan",
] as const;
// type CaseType = (typeof caseTypeValues)[number];

// ================= GERBONG ROUTER =================
export const gerbongRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().optional(),
        krlId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, search, krlId } = input;

      const whereClauses = [
        krlId ? eq(gerbong.krlId, krlId) : undefined,
        search ? ilike(gerbong.name, `%${search}%`) : undefined,
      ].filter(Boolean);

      const data = await db
        .select({
          ...getTableColumns(gerbong),
          krlName: krl.name,
          totalKasus: sql<number>`count(${kasus.id})`,
          belum: sql<number>`sum(case when ${kasus.status} = 'belum_ditangani' then 1 else 0 end)`,
          proses: sql<number>`sum(case when ${kasus.status} = 'proses' then 1 else 0 end)`,
          selesai: sql<number>`sum(case when ${kasus.status} = 'selesai' then 1 else 0 end)`,
        })
        .from(gerbong)
        .leftJoin(krl, eq(gerbong.krlId, krl.id))
        .leftJoin(kasus, eq(kasus.gerbongId, gerbong.id))
        .where(and(...(whereClauses as import("drizzle-orm").SQLWrapper[])))
        .groupBy(gerbong.id, krl.id)
        .orderBy(desc(gerbong.createdAt ?? gerbong.id), gerbong.name)
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      // Total distinct gerbong matching filter
      const totalQuery = await db
        .select({ count: count() })
        .from(gerbong)
        .where(and(...(whereClauses as import("drizzle-orm").SQLWrapper[])));
      const total = totalQuery[0]?.count ?? 0;
      const totalPages = Math.ceil(total / pageSize);

      return { items: data, total, totalPages };
    }),

  getManyByUser: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().optional(),
        krlId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, pageSize, search, krlId } = input;

      const whereClauses = [
        krlId ? eq(gerbong.krlId, krlId) : undefined,
        search ? ilike(gerbong.name, `%${search}%`) : undefined,
        eq(userKrl.userId, ctx.userId.user.id),
      ].filter(Boolean);

      const data = await db
        .select({
          ...getTableColumns(gerbong),
          krlName: krl.name,
          totalKasus: sql<number>`count(${kasus.id})`,
          belum: sql<number>`sum(case when ${kasus.status} = 'belum_ditangani' then 1 else 0 end)`,
          proses: sql<number>`sum(case when ${kasus.status} = 'proses' then 1 else 0 end)`,
          selesai: sql<number>`sum(case when ${kasus.status} = 'selesai' then 1 else 0 end)`,
        })
        .from(gerbong)
        .innerJoin(userKrl, eq(userKrl.krlId, gerbong.krlId))
        .leftJoin(krl, eq(gerbong.krlId, krl.id))
        .leftJoin(kasus, eq(kasus.gerbongId, gerbong.id))
        .where(and(...(whereClauses as import("drizzle-orm").SQLWrapper[])))
        .groupBy(gerbong.id, krl.id)
        .orderBy(desc(gerbong.createdAt ?? gerbong.id), gerbong.name)
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      // Total distinct gerbong matching filter
      const totalQuery = await db
        .select({ count: count() })
        .from(gerbong)
        .innerJoin(userKrl, eq(userKrl.krlId, gerbong.krlId))
        .where(and(...(whereClauses as import("drizzle-orm").SQLWrapper[])));
      const total = totalQuery[0]?.count ?? 0;
      const totalPages = Math.ceil(total / pageSize);

      return { items: data, total, totalPages };
    }),
  getOne: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [row] = await db
        .select({
          ...getTableColumns(gerbong),
          krlName: krl.name,
          totalKasus: sql<number>`count(${kasus.id})`,
          belum: sql<number>`sum(case when ${kasus.status} = 'belum_ditangani' then 1 else 0 end)`,
          proses: sql<number>`sum(case when ${kasus.status} = 'proses' then 1 else 0 end)`,
          selesai: sql<number>`sum(case when ${kasus.status} = 'selesai' then 1 else 0 end)`,
        })
        .from(gerbong)
        .leftJoin(krl, eq(gerbong.krlId, krl.id))
        .leftJoin(kasus, eq(kasus.gerbongId, gerbong.id))
        .where(eq(gerbong.id, input.id))
        .groupBy(gerbong.id, krl.id)
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gerbong not found",
        });
      }
      return row;
    }),

  getBySatpamStatus: baseProcedure
    .input(
      z.object({
        status: z.enum(satpamStatusValues),
      })
    )
    .query(async ({ input }) => {
      const rows = await db
        .selectDistinctOn([gerbong.id], {
          ...getTableColumns(gerbong),
          krlName: krl.name,
        })
        .from(gerbong)
        .innerJoin(kasus, eq(kasus.gerbongId, gerbong.id))
        .leftJoin(krl, eq(gerbong.krlId, krl.id))
        .where(eq(kasus.status, input.status))
        .orderBy(gerbong.id);
      return rows;
    }),

  getByUser: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(), // jika tidak diisi gunakan ctx
      })
    )
    .query(async ({ input, ctx }) => {
      const targetUserId = input.userId ?? ctx.userId.user.id;
      const rows = await db
        .selectDistinctOn([gerbong.id], {
          ...getTableColumns(gerbong),
        })
        .from(kasus)
        .innerJoin(gerbong, eq(kasus.gerbongId, gerbong.id))
        .where(eq(kasus.handlerId, targetUserId));
      return rows;
    }),

  // Opsional: statistik ringkas (total gerbong & breakdown global)
  summary: baseProcedure.query(async () => {
    const [agg] = await db
      .select({
        totalGerbong: count(gerbong.id),
        totalKasus: sql<number>`count(${kasus.id})`,
        belum: sql<number>`sum(case when ${kasus.status} = 'belum_ditangani' then 1 else 0 end)`,
        proses: sql<number>`sum(case when ${kasus.status} = 'proses' then 1 else 0 end)`,
        selesai: sql<number>`sum(case when ${kasus.status} = 'selesai' then 1 else 0 end)`,
      })
      .from(gerbong)
      .leftJoin(kasus, eq(kasus.gerbongId, gerbong.id));
    return agg;
  }),
});

// ================= KASUS ROUTER =================
export const kasusRouter = createTRPCRouter({
  getManyByGerbong: baseProcedure
    .input(
      z.object({
        gerbongId: z.string(),
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        status: z.enum(satpamStatusValues).optional(),
        caseTypes: z.array(z.enum(caseTypeValues)).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { gerbongId, page, pageSize, status, caseTypes, search } = input;

      const whereParts = [
        eq(kasus.gerbongId, gerbongId),
        status ? eq(kasus.status, status) : undefined,
        caseTypes?.length
          ? inArray(
              kasus.caseType,
              caseTypes.filter((v): v is (typeof caseTypeValues)[number] =>
                (caseTypeValues as readonly string[]).includes(v)
              )
            )
          : undefined,
        search ? ilike(kasus.description, `%${search}%`) : undefined,
      ].filter(Boolean);

      const items = await db
        .select({
          ...getTableColumns(kasus),
        })
        .from(kasus)
        .where(
          and(
            ...(whereParts as
              | [
                  import("drizzle-orm").SQLWrapper,
                  ...import("drizzle-orm").SQLWrapper[],
                ]
              | [])
          )
        )
        .orderBy(desc(kasus.reportedAt), desc(kasus.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [totalRow] = await db
        .select({ count: count() })
        .from(kasus)
        .where(
          and(
            ...(whereParts as
              | [
                  import("drizzle-orm").SQLWrapper,
                  ...import("drizzle-orm").SQLWrapper[],
                ]
              | [])
          )
        );

      const total = totalRow?.count ?? 0;
      const totalPages = Math.ceil(total / pageSize);

      return { items, total, totalPages };
    }),

  getOne: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [row] = await db
        .select({
          ...getTableColumns(kasus),
          // Handler information
          handlerName: user.name,
          handlerEmail: user.email,
          // Gerbong and KRL information
          gerbongName: gerbong.name,
          krlId: krl.id,
          krlName: krl.name,
        })
        .from(kasus)
        .leftJoin(user, eq(kasus.handlerId, user.id))
        .leftJoin(gerbong, eq(kasus.gerbongId, gerbong.id))
        .leftJoin(krl, eq(gerbong.krlId, krl.id))
        .where(eq(kasus.id, input.id))
        .limit(1);

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kasus not found" });
      }

      return row;
    }),
  create: protectedProcedure
    .input(
      z.object({
        gerbongId: z.string(),
        name: z.string(),
        description: z.string(),
        caseType: z.enum(caseTypeValues).default("lainnya"),
        occupancyLabel: z.enum(["longgar", "sedang", "padat"]).optional(),
        occupancyValue: z.number().int().optional(),
        images: z.array(z.string().url()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [created] = await db
        .insert(kasus)
        .values({
          gerbongId: input.gerbongId,
          name: input.name, // Add this missing field
          description: input.description,
          caseType: input.caseType,
          occupancyLabel: input.occupancyLabel,
          occupancyValue: input.occupancyValue,
          images: input.images,
        })
        .returning();
      return created;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(satpamStatusValues),
        handlerId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const handlerId = input.handlerId ?? ctx.userId.user.id;
      const [updated] = await db
        .update(kasus)
        .set({
          status: input.status,
          handlerId,
        })
        .where(eq(kasus.id, input.id))
        .returning();
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kasus not found" });
      }
      return updated;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const [removed] = await db
        .delete(kasus)
        .where(eq(kasus.id, input.id))
        .returning();
      if (!removed) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kasus not found" });
      }
      return removed;
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().optional(),
        status: z.enum(satpamStatusValues).optional(),
        caseTypes: z.array(z.enum(caseTypeValues)).optional(),
        krlId: z.string().optional(),
        gerbongId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, pageSize, search, status, caseTypes, krlId, gerbongId } =
        input;

      const whereParts = [
        status ? eq(kasus.status, status) : undefined,
        caseTypes?.length
          ? inArray(
              kasus.caseType,
              caseTypes.filter((v): v is (typeof caseTypeValues)[number] =>
                [
                  "pelecehan",
                  "prioritas",
                  "pencopetan",
                  "keamanan",
                  "keributan",
                  "darurat",
                  "lainnya",
                  "kepadatan",
                ].includes(v as (typeof caseTypeValues)[number])
              )
            )
          : undefined,
        krlId ? eq(gerbong.krlId, krlId) : undefined,
        gerbongId ? eq(kasus.gerbongId, gerbongId) : undefined,
        search ? ilike(kasus.description, `%${search}%`) : undefined,
        // Batasi hanya KRL yang terhubung ke user
        eq(userKrl.userId, ctx.userId.user.id),
      ].filter(Boolean);

      const items = await db
        .select({
          ...getTableColumns(kasus),
          gerbongName: gerbong.name,
          krlId: krl.id,
          krlName: krl.name,
        })
        .from(kasus)
        .innerJoin(gerbong, eq(kasus.gerbongId, gerbong.id))
        .innerJoin(krl, eq(gerbong.krlId, krl.id))
        .innerJoin(userKrl, and(eq(userKrl.krlId, krl.id)))
        .where(
          and(
            ...(whereParts as
              | [
                  import("drizzle-orm").SQLWrapper,
                  ...import("drizzle-orm").SQLWrapper[],
                ]
              | [])
          )
        )
        .orderBy(desc(kasus.reportedAt), desc(kasus.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [totalRow] = await db
        .select({ count: count() })
        .from(kasus)
        .innerJoin(gerbong, eq(kasus.gerbongId, gerbong.id))
        .innerJoin(krl, eq(gerbong.krlId, krl.id))
        .innerJoin(userKrl, and(eq(userKrl.krlId, krl.id)))
        .where(
          and(
            ...(whereParts as
              | [
                  import("drizzle-orm").SQLWrapper,
                  ...import("drizzle-orm").SQLWrapper[],
                ]
              | [])
          )
        );

      const total = totalRow?.count ?? 0;
      const totalPages = Math.ceil(total / pageSize);
      return { items, total, totalPages };
    }),
});

export const krlRouter = createTRPCRouter({
  getGerbongSummaryByUser: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        krlId: krl.id,
        krlName: krl.name,
        gerbongId: gerbong.id,
        gerbongName: gerbong.name,
        totalKasus: sql<number>`count(${kasus.id})`,
        belum: sql<number>`sum(case when ${kasus.status} = 'belum_ditangani' then 1 else 0 end)`,
        proses: sql<number>`sum(case when ${kasus.status} = 'proses' then 1 else 0 end)`,
        selesai: sql<number>`sum(case when ${kasus.status} = 'selesai' then 1 else 0 end)`,
        statusKepadatan: gerbong.statusKepadatan,
      })
      .from(userKrl)
      .innerJoin(krl, eq(userKrl.krlId, krl.id))
      .innerJoin(gerbong, eq(gerbong.krlId, krl.id))
      .leftJoin(kasus, eq(kasus.gerbongId, gerbong.id))
      .where(eq(userKrl.userId, ctx.userId.user.id))
      .groupBy(krl.id, gerbong.id);

    const map = new Map<
      string,
      {
        krlId: string;
        krlName: string;
        totalGerbong: number;
        normalGerbong: number;
        problematicGerbong: number;
        resolvedGerbong: number;
        gerbong: Array<{
          id: string;
          name: string;
          totalKasus: number;
          belum: number;
          proses: number;
          selesai: number;
          statusKepadatan: string | null;
        }>;
      }
    >();

    for (const r of rows) {
      if (!map.has(r.krlId)) {
        map.set(r.krlId, {
          krlId: r.krlId,
          krlName: r.krlName,
          totalGerbong: 0,
          normalGerbong: 0,
          problematicGerbong: 0,
          resolvedGerbong: 0,
          gerbong: [],
        });
      }
      const bucket = map.get(r.krlId)!;
      bucket.totalGerbong += 1;

      const gerbongNormal = r.totalKasus === 0;
      const gerbongProblematic = (r.belum ?? 0) > 0 || (r.proses ?? 0) > 0;
      const gerbongResolved =
        r.totalKasus > 0 && r.totalKasus === (r.selesai ?? 0);

      if (gerbongNormal) bucket.normalGerbong += 1;
      else if (gerbongProblematic) bucket.problematicGerbong += 1;
      else if (gerbongResolved) bucket.resolvedGerbong += 1;

      bucket.gerbong.push({
        id: r.gerbongId,
        name: r.gerbongName,
        totalKasus: r.totalKasus,
        belum: r.belum ?? 0,
        proses: r.proses ?? 0,
        selesai: r.selesai ?? 0,
        statusKepadatan: r.statusKepadatan ?? null,
      });
    }

    return Array.from(map.values());
  }),
});
