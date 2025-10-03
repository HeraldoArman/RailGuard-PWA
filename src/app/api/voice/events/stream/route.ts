import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { kasus, gerbong } from "@/db/schema";
import { eq, gte, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const data = `data: ${JSON.stringify({ type: 'connected', message: 'Voice events stream connected' })}\n\n`;
        controller.enqueue(encoder.encode(data));

        let lastCheck = new Date();

        const checkInterval = setInterval(async () => {
          try {
            const newCases = await db
              .select({
                id: kasus.id,
                name: kasus.name,
                description: kasus.description,
                caseType: kasus.caseType,
                status: kasus.status,
                reportedAt: kasus.reportedAt,
                gerbongId: kasus.gerbongId,
                gerbongName: gerbong.name,
              })
              .from(kasus)
              .innerJoin(gerbong, eq(kasus.gerbongId, gerbong.id))
              .where(
                gte(kasus.reportedAt, lastCheck)
              )
              .orderBy(desc(kasus.reportedAt));

            if (newCases.length > 0) {
              const eventData = `data: ${JSON.stringify({ 
                type: 'kasus_event', 
                data: newCases 
              })}\n\n`;
              
              controller.enqueue(encoder.encode(eventData));
              lastCheck = new Date();
            }
          } catch (error) {
            console.error('SSE polling error:', error);
          }
        }, 3000); // Check every 3 seconds

        // Cleanup function
        request.signal.addEventListener('abort', () => {
          clearInterval(checkInterval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error setting up SSE stream:', error);
    return new Response('Internal server error', { status: 500 });
  }
}