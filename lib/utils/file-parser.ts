import canvas from 'canvas';
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = canvas.DOMMatrix as any;
}

import {PDFParse} from "pdf-parse";
import mammoth from 'mammoth';


export async function parseResume(
  file: Buffer,
  mimeType: string
): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      const parser = new PDFParse({ data: file });
      const result = await parser.getText();
      await parser.destroy?.(); 
      return result.text;
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer: file });
      return result.value;
    } else {
      throw new Error("Unsupported file type: " + mimeType);
    }
  } catch (err: any) {
    console.error("Error parsing resume:", err);
    throw new Error("Failed to parse resume: " + (err.message || err));
  }
}



export function validateFileType(mimeType: string): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  return allowedTypes.includes(mimeType);
}

export function validateFileSize(size: number, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}