import type { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs, inferRouterInputs } from "@trpc/server";

// Root inference helpers
type RouterOutputs = inferRouterOutputs<AppRouter>;
type RouterInputs = inferRouterInputs<AppRouter>;

// Enums (sync with schema/procedures)
export type SatpamStatus = "belum_ditangani" | "proses" | "selesai";


// -------- GERBONG --------
export type GerbongGetManyResult = RouterOutputs["gerbong"]["getMany"];
export type GerbongGetManyItem = GerbongGetManyResult["items"][number];
export type GerbongGetManyInput = RouterInputs["gerbong"]["getMany"];

export type GerbongGetOne = RouterOutputs["gerbong"]["getOne"];
export type GerbongGetOneInput = RouterInputs["gerbong"]["getOne"];

export type GerbongGetBySatpamStatus = RouterOutputs["gerbong"]["getBySatpamStatus"];
export type GerbongGetBySatpamStatusItem = GerbongGetBySatpamStatus[number];
export type GerbongGetBySatpamStatusInput =
  RouterInputs["gerbong"]["getBySatpamStatus"];

export type GerbongGetByUser = RouterOutputs["gerbong"]["getByUser"];
export type GerbongGetByUserItem = GerbongGetByUser[number];
export type GerbongGetByUserInput = RouterInputs["gerbong"]["getByUser"];

export type GerbongSummary = RouterOutputs["gerbong"]["summary"];

// -------- KASUS --------
export type KasusGetManyByGerbongResult =
  RouterOutputs["kasus"]["getManyByGerbong"];
export type KasusGetManyByGerbongItem =
  KasusGetManyByGerbongResult["items"][number];
export type KasusGetManyByGerbongInput =
  RouterInputs["kasus"]["getManyByGerbong"];

export type KasusGetOne = RouterOutputs["kasus"]["getOne"];
export type KasusGetOneInput = RouterInputs["kasus"]["getOne"];

export type KasusCreateResult = RouterOutputs["kasus"]["create"];
export type KasusCreateInput = RouterInputs["kasus"]["create"];

export type KasusUpdateStatusResult = RouterOutputs["kasus"]["updateStatus"];
export type KasusUpdateStatusInput = RouterInputs["kasus"]["updateStatus"];

export type KasusRemoveResult = RouterOutputs["kasus"]["remove"];
export type KasusRemoveInput = RouterInputs["kasus"]["remove"];


export type KrlGerbongSummaryList = RouterOutputs["krl"]["getGerbongSummaryByUser"];
export type KrlGerbongSummaryItem = KrlGerbongSummaryList[number];
// Convenience aggregated dashboard metrics (example usage)
export interface DashboardMetrics {
  totalGerbong: number;
  totalKasus: number;
  belum: number;
  proses: number;
  selesai: number;
}