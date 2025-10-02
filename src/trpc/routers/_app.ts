// import { z } from "zod";
import { createTRPCRouter } from "../init";
import { gerbongRouter, kasusRouter } from "@/modules/dashboard/server/procedures";

export const appRouter = createTRPCRouter({
//   agents: agentsRouter,
//   meetings: meetingsRouter,
    gerbong: gerbongRouter,
    kasus: kasusRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
