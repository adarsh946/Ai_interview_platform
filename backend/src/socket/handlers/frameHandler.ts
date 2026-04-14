import { Socket, Server } from "socket.io";
import { redis } from "../../config/redis.js";

interface FrameCapturePayload {
  sessionId: string;
  expressionData: Record<string, unknown>;
}

export function frameHandler(io: Server, socket: Socket): void {
  socket.on("frame:capture", async (payload: FrameCapturePayload) => {
    const { sessionId, expressionData } = payload;

    if (!sessionId || !expressionData) {
      console.warn("[frameHandler] missing sessionId or expressionData");
      return;
    }

    const key = `interview:expressions:${sessionId}`;

    try {
      // Get existing expressions array from Redis
      const existing = await redis.get(key);
      const expressions: Record<string, unknown>[] = existing
        ? JSON.parse(existing)
        : [];

      //  pushing new entry.
      expressions.push({
        ...expressionData,
        capturedAt: Date.now(),
      });

      // Save back to Redis
      await redis.set(key, JSON.stringify(expressions), { EX: 86400 });

      console.log(
        `[frameHandler] session=${sessionId} expressions=${expressions.length}`
      );
    } catch (err) {
      console.error("[frameHandler] failed to store expression data:", err);
    }
  });
}
