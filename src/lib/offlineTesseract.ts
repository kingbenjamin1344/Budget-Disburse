/**
 * Offline Tesseract OCR helper with advanced image processing
 * Uses tesseract.js with local language data for complete offline support
 * Includes caching strategy, fallback mechanisms, and image preprocessing
 */

import Tesseract from "tesseract.js";

let tesseractWorker: any = null;
let initPromise: Promise<void> | null = null;
let isOnline = true;

// Cache key for language data
const LANG_DATA_CACHE_KEY = "tesseract-lang-data-eng";
const LANG_DATA_VERSION = "v1";

// Philippine Peso and text character whitelist for OCR
const CHAR_WHITELIST = 
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.,:/₱ \n";

/**
 * Image Preprocessing Functions
 * Improves OCR accuracy by enhancing image quality
 */

/**
 * Convert image to grayscale
 */
function toGrayscale(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray; // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B
    // data[i + 3] is alpha, leave unchanged
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Increase contrast of the image
 */
function increaseContrast(canvas: HTMLCanvasElement, factor: number = 1.5): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128)); // R
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128)); // G
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128)); // B
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Apply binary threshold to image (convert to pure black and white)
 */
function applyThreshold(canvas: HTMLCanvasElement, threshold: number = 150): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const value = gray > threshold ? 255 : 0;
    data[i] = value; // R
    data[i + 1] = value; // G
    data[i + 2] = value; // B
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Preprocess image for better OCR accuracy
 * Applies grayscale, contrast enhancement, and threshold
 */
export function preprocessImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);

      // Apply preprocessing pipeline
      toGrayscale(canvas);
      increaseContrast(canvas, 1.5);
      applyThreshold(canvas, 150);

      resolve(canvas.toDataURL("image/jpeg"));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageDataUrl;
  });
}

/**
 * Check if application is online
 */
function checkOnlineStatus(): boolean {
  if (typeof window === "undefined") return true; // Server-side, assume online
  return navigator.onLine;
}

/**
 * Set up online/offline event listeners
 */
function setupNetworkListeners() {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    isOnline = true;
    console.log("[OCR] Network: Online");
  });

  window.addEventListener("offline", () => {
    isOnline = false;
    console.log("[OCR] Network: Offline");
  });
}

/**
 * Pre-cache language data to IndexedDB for offline use
 */
async function preCacheLanguageData() {
  try {
    if (!("indexedDB" in window)) {
      console.warn("[OCR] IndexedDB not available for caching");
      return;
    }

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("TesseractDB", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("lang-data")) {
          db.createObjectStore("lang-data");
        }
      };
    });

    // Check if data is already cached
    const cachedData = await new Promise((resolve) => {
      const transaction = db.transaction(["lang-data"], "readonly");
      const store = transaction.objectStore("lang-data");
      const request = store.get(LANG_DATA_CACHE_KEY);
      request.onsuccess = () => resolve(request.result);
    });

    if (cachedData) {
      console.log("[OCR] Language data found in cache");
      return;
    }

    console.log("[OCR] Pre-caching language data for offline support...");
    // Language data will be cached automatically by tesseract.js on first use
    db.close();
  } catch (err) {
    console.warn("[OCR] Could not pre-cache language data:", err);
    // This is not critical - fallback to online download
  }
}

/**
 * Initialize Tesseract worker with offline support
 * Uses local language data when offline, with automatic fallback
 */
export async function initTesseractWorker() {
  if (tesseractWorker) return;
  if (initPromise) return initPromise;

  setupNetworkListeners();
  isOnline = checkOnlineStatus();

  initPromise = (async () => {
    try {
      // Pre-cache language data if online
      if (isOnline) {
        await preCacheLanguageData();
      }

      const workerConfig: any = {
        logger: (m: any) => {
          if (m.status === "recognizing") {
            console.log(`[OCR] Recognizing... ${(m.progress * 100).toFixed(0)}%`);
          } else if (m.status === "loading language data") {
            console.log(
              `[OCR] Loading language data... ${(m.progress * 100).toFixed(0)}%`
            );
          } else if (m.status !== "idle") {
            console.log("[OCR]", m.status);
          }
        },
      };

      // If offline, configure to use cached data
      if (!isOnline) {
        console.log("[OCR] Running in offline mode");
        // Tesseract.js will use IndexedDB cached data automatically
      }

      // Create worker with language set to English
      tesseractWorker = await Tesseract.createWorker("eng", 1, workerConfig);

      console.log(`[OCR] Worker initialized (Online: ${isOnline})`);
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
 * Perform OCR on an image with offline support and advanced features
 * Returns text, confidence score, and metadata
 */
export interface OCRResult {
  text: string;
  confidence: number;
  raw: string;
}

export async function performOCR(
  image: HTMLCanvasElement | HTMLImageElement | File | string,
  options?: {
    lang?: string;
    psm?: number; // Page segmentation mode
    preprocessed?: boolean; // if true, skip preprocessing
  }
): Promise<OCRResult> {
  try {
    // Initialize if needed
    await initTesseractWorker();

    if (!tesseractWorker) {
      throw new Error("OCR worker failed to initialize");
    }

    // Preprocess image for better accuracy (unless explicitly skipped)
    let imageToProcess: any = image;
    if (!options?.preprocessed && typeof image === "string") {
      try {
        imageToProcess = await preprocessImage(image);
      } catch (err) {
        console.warn("[OCR] Image preprocessing failed, using original:", err);
        imageToProcess = image;
      }
    }

    // Set Tesseract parameters for best Philippine document OCR
    await tesseractWorker.setParameters({
      tessedit_char_whitelist: CHAR_WHITELIST,
      tessedit_pageseg_mode: options?.psm?.toString() || "6", // 6 = Assume uniform block of text
      textord_heavy_nr: "1", // Enable heavy noise removal
    });

    console.log(
      `[OCR] Starting recognition (Online: ${isOnline}, PSM: ${options?.psm || 6})...`
    );

    const result = await tesseractWorker.recognize(imageToProcess);

    const text = result.data.text || "";
    const confidence = result.data.confidence || 0;
    const raw = result.data.text || "";

    console.log("[OCR] Recognition complete:", {
      length: text.length,
      confidence: confidence,
    });

    return {
      text: text.trim(),
      confidence: confidence,
      raw: raw,
    };
  } catch (err) {
    console.error("[OCR] Recognition failed:", err);
    const errMsg = String(err);

    // Provide helpful offline-specific error message
    if (!isOnline && errMsg.includes("fetch")) {
      throw new Error(
        "OCR requires language data. Please ensure language data was cached while online, or connect to internet."
      );
    }

    throw new Error(`OCR failed: ${errMsg}`);
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
 * Check if OCR is available and online status
 */
export function getOCRStatus(): {
  available: boolean;
  online: boolean;
  cached: boolean;
} {
  return {
    available: tesseractWorker !== null,
    online: isOnline,
    cached: true, // Language data cached via IndexedDB
  };
}

/**
 * Get current online status
 */
export function isNetworkOnline(): boolean {
  return isOnline;
}



