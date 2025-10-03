// src/server/routers/voice.ts
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { kasus, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const voiceRouter = createTRPCRouter({
  // === STT Input: Satpam ngomong → update status kasus ===
  handleInput: protectedProcedure
    .input(
      z.object({
        kasusId: z.string(),
        transcript: z.string(), // hasil STT
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { kasusId, transcript } = input;
      const userId = ctx.userId.user.id;

      let newStatus: "proses" | "selesai" | null = null;

      if (/selesai/i.test(transcript)) newStatus = "selesai";
      else if (/tangani|handle|proses/i.test(transcript)) newStatus = "proses";

      if (newStatus) {
        const [updated] = await db
          .update(kasus)
          .set({ status: newStatus, handlerId: userId })
          .where(eq(kasus.id, kasusId))
          .returning();
        return { action: "update_status", updated };
      }

      return { action: "none", message: "Tidak ada perintah valid di suara" };
    }),

  // === TTS Output: Kasus baru → trigger ke client ===
  onKasusEvent: protectedProcedure
    .subscription(async function* ({ ctx }) {
      // di sini contoh sederhana: polling tiap 2 detik
      // real world bisa ganti pakai WebSocket/Redis pubsub
      while (true) {
        const newCases = await db
          .select()
          .from(kasus)
          .where(eq(kasus.status, "belum_ditangani"));

        yield { type: "kasus_event", data: newCases };

        await new Promise((r) => setTimeout(r, 2000));
      }
    }),

  // === Optional: Toggle Voice ===
  toggleVoice: protectedProcedure
    .input(z.object({ active: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId.user.id;
      const [updated] = await db
        .update(user)
        .set({ isVoiceActive: input.active })
        .where(eq(user.id, userId))
        .returning();
      return updated;
    }),
});
