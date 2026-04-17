import pdfParse from "pdf-parse";

export function extractResumeText(fileBuffer: Buffer): Promise<string> {
  try {
    const result = pdfParse(fileBuffer);
    if (!result.text || result.text.trim().length < 50) {
      throw new Error("Resume content is too short or unreadable");
    }
    return result.text;
  } catch (err) {
    console.error("Error parsing resume PDF:", err);
    throw new Error("Failed to extract resume text");
  }
}
