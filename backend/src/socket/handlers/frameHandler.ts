import { Socket, Server } from "socket.io";

interface FrameCapturePayload {
  sessionId: string;
  expressionData: Record<string, unknown>;
}

// In-memory store — no Redis needed for expressions
const expressionStore = new Map<string, Record<string, unknown>[]>();

export function getExpressions(sessionId: string): Record<string, unknown>[] {
  return expressionStore.get(sessionId) ?? [];
}

export function clearExpressions(sessionId: string): void {
  expressionStore.delete(sessionId);
}

export function frameHandler(io: Server, socket: Socket): void {
  socket.on("frame:capture", async (payload: FrameCapturePayload) => {
    const { sessionId, expressionData } = payload;

    if (!sessionId || !expressionData) {
      console.warn("[frameHandler] missing sessionId or expressionData");
      return;
    }

    const existing = expressionStore.get(sessionId) ?? [];
    existing.push({ ...expressionData, capturedAt: Date.now() });
    expressionStore.set(sessionId, existing);

    console.log(
      `[frameHandler] session=${sessionId} expressions=${existing.length}`
    );
  });
}
