// import { z } from "zod";
import { createTRPCRouter } from "../init";
import { gerbongRouter, kasusRouter, krlRouter } from "@/modules/dashboard/server/procedures";
import { voiceRouter } from "@/modules/voice/server/procedures";
export const appRouter = createTRPCRouter({
//   agents: agentsRouter,
//   meetings: meetingsRouter,
    gerbong: gerbongRouter,
    kasus: kasusRouter,
    krl: krlRouter,
    voice: voiceRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
