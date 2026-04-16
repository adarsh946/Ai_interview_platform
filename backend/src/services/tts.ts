import { openai } from "../config/openai.js";

/**
 * Converts a text string to an MP3 audio buffer using OpenAI TTS.
 * Returns a Node.js Buffer that can be sent directly over Socket.io.
 */
export async function textToSpeech(text: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: "tts-1", // tts-1 for speed
    voice: "alloy",
    input: text,
    response_format: "mp3",
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
