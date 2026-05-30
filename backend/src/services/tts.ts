// import { openai } from "../config/openai.js";

// /**
//  * Converts a text string to an MP3 audio buffer using OpenAI TTS.
//  * Returns a Node.js Buffer that can be sent directly over Socket.io.
//  */
// export async function textToSpeech(text: string): Promise<Buffer> {
//   const response = await openai.audio.speech.create({
//     model: "tts-1", // tts-1 for speed
//     voice: "alloy",
//     input: text,
//     response_format: "mp3",
//   });

//   const arrayBuffer = await response.arrayBuffer();
//   return Buffer.from(arrayBuffer);
// }

import { SarvamAIClient } from "sarvamai";

// Initialize the Sarvam AI client using your subscription key from the dashboard
const sarvam = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY,
});

/**
 * Converts a text string to an MP3 audio buffer using Sarvam AI Bulbul v3.
 * Returns a Node.js Buffer that can be sent directly over Socket.io.
 */
export async function textToSpeech(text: string): Promise<Buffer> {
  // Use convertStream to retrieve binary data from the textToSpeech endpoint
  const response = await sarvam.textToSpeech.convertStream({
    model: "bulbul:v3",
    text: text,
    target_language_code: "en-IN", // Indian-accented English. Change to "hi-IN" for Hindi/Hinglish
    speaker: "shreya", // 'shreya' provides a professional, clear interviewer tone
    output_audio_codec: "mp3", // Match your previous socket expectation
  });

  // Consume the binary stream as an ArrayBuffer
  const arrayBuffer = await response.arrayBuffer();

  // Convert to Node.js Buffer to pass back to your Socket.io architecture
  return Buffer.from(arrayBuffer);
}
