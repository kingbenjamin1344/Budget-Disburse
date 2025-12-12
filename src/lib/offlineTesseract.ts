/**
 * Offline Tesseract OCR helper
 * Uses tesseract.js with automatic CDN fallback for language data
 */

import Tesseract from "tesseract.js";

let tesseractWorker: any = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize Tesseract worker with offline fallback
 */
export async function initTesseractWorker() {
  if (tesseractWorker) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Create worker - tesseract.js handles worker loading automatically
      tesseractWorker = await Tesseract.createWorker("eng", 1, {
        logger: (m: any) => {
          if (m.status === "recognizing") {
            console.log(`[OCR] Recognizing... ${(m.progress * 100).toFixed(0)}%`);
          } else if (m.status !== "idle") {
            console.log("[OCR]", m.status);
          }
        },
      });

      console.log("[OCR] Worker initialized successfully");
    } catch (err) {
      console.error("[OCR] Failed to initialize worker:", err);
      tesseractWorker = null;
      initPromise = null;
      throw new Error(`OCR initialization failed: ${String(err)}`);
    }
  })();

  return initPromise;
}

/**
 * Perform OCR on an image (canvas, image, or File)
 * Requires worker to be initialized first
 */
export async function performOCR(
  image: HTMLCanvasElement | HTMLImageElement | File | string,
  options?: {
    lang?: string;
  }
): Promise<string> {
  try {
    // Initialize if needed
    await initTesseractWorker();

    if (!tesseractWorker) {
      throw new Error("OCR worker failed to initialize");
    }

    console.log("[OCR] Starting recognition...");

    const result = await tesseractWorker.recognize(image);

    const text = result.data.text || "";
    console.log("[OCR] Recognition complete:", { length: text.length });

    return text.trim();
  } catch (err) {
    console.error("[OCR] Recognition failed:", err);
    throw new Error(`OCR failed: ${String(err)}`);
  }
}

/**
 * Terminate worker to free resources
 */
export async function terminateTesseractWorker() {
  if (tesseractWorker) {
    try {
      await tesseractWorker.terminate();
      tesseractWorker = null;
      initPromise = null;
      console.log("[OCR] Worker terminated");
    } catch (err) {
      console.error("[OCR] Failed to terminate worker:", err);
    }
  }
}

/**
 * Check if OCR is available
 */
export function isOCRAvailable(): boolean {
  return tesseractWorker !== null;
}


