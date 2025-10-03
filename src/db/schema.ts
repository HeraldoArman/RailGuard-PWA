import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
  primaryKey,
  uniqueIndex,
  index,
  smallint,
  real,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const caseTypeEnum = pgEnum("case_type", [
  "pelecehan",
  "prioritas",
  "pencopetan",
  "keamanan",
  "keributan",
  "darurat",
  "lainnya",
  "kepadatan",
]);

export const kepadatanEnum = pgEnum("kepadatan_label", [
  "longgar",
  "sedang",
  "padat",
]);

export const caseSourceEnum = pgEnum("case_source", [
  "ml",
  "manual",
  "pelapor",
  "sensor",
]);

export const satpamStatusEnum = pgEnum("satpam_status", [
  "belum_ditangani", // belum ada penanganan
  "proses", // dalam progress
  "selesai", // diselesaikan
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  isVoiceActive: boolean("is_voice_active").default(false).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
export const krl = pgTable(
  "krl",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => ({
    ixKrlName: uniqueIndex("ux_krl_name").on(t.name),
  })
);

export const gerbong = pgTable(
  "gerbong",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text("name").notNull(), // contoh: "Gerbong 1"
    krlId: text("krl_id")
      .notNull()
      .references(() => krl.id, { onDelete: "cascade" }),
    adaKasus: boolean("ada_kasus").default(false).notNull(),
    totalPenumpang: integer("total_penumpang").default(0),
    statusKepadatan: kepadatanEnum("status_kepadatan"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deskripsi: text("deskripsi"),
  },
  (t) => ({
    uxGerbongPerKrl: uniqueIndex("ux_gerbong_per_krl").on(t.krlId, t.name),
    ixKrlId: index("ix_gerbong_krl_id").on(t.krlId),
  })
);

export const kasus = pgTable(
  "kasus",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text("name").notNull(),
    images: text("images").array(), // boleh, tapi pertimbangkan tabel media terpisah
    description: text("description").notNull(),
    status: satpamStatusEnum("status").default("belum_ditangani").notNull(),

    caseType: caseTypeEnum("case_type").default("lainnya"),

    source: caseSourceEnum("source").default("ml").notNull(),

    occupancyLabel: kepadatanEnum("occupancy_label"),
    occupancyValue: integer("occupancy_value"),

    reportedAt: timestamp("reported_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    arrivedAt: timestamp("arrived_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolutionNotes: text("resolution_notes"),
    deskripsiKasus: text("deskripsi_kasus"), // deskripsi tambahan khusus kasus kepadatan dari AI
    gerbongId: text("gerbong_id")
      .notNull()
      .references(() => gerbong.id, { onDelete: "cascade" }),

    handlerId: text("handler_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reportedById: text("reported_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => ({
    ixKasusGerbongStatus: index("ix_kasus_gerbong_status").on(
      t.gerbongId,
      t.status
    ),
    ixKasusReportedAt: index("ix_kasus_reported_at").on(t.reportedAt),
  })
);
export const userKrl = pgTable(
  "user_krl",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    krlId: text("krl_id")
      .notNull()
      .references(() => krl.id, { onDelete: "cascade" }),
    role: text("role").default("satpam").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    assignedFrom: timestamp("assigned_from", { withTimezone: true }),
    assignedUntil: timestamp("assigned_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.krlId] }),
    ixKrlUsers: index("ix_user_krl_krl").on(t.krlId),
  })
);
