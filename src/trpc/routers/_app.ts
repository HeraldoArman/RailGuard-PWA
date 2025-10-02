// import { z } from "zod";
import { createTRPCRouter } from "../init";


export const appRouter = createTRPCRouter({
//   agents: agentsRouter,
//   meetings: meetingsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
