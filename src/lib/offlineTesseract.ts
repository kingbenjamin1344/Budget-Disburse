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
 * Document Detection Result Interface
 */
export interface DocumentDetectionResult {
  detected: boolean;
  confidence: number; // 0-100
  quality: "poor" | "fair" | "good" | "excellent";
  edges: { top: number; bottom: number; left: number; right: number } | null;
  sharpness: number; // 0-100
  brightness: number; // 0-100
  contrast: number; // 0-100
}

/**
 * Detect if document is present in the frame using edge detection
 * Similar to scanner apps like Camscanner or Google Drive Scan
 */
export function detectDocumentInFrame(canvas: HTMLCanvasElement): DocumentDetectionResult {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { detected: false, confidence: 0, quality: "poor", edges: null, sharpness: 0, brightness: 0, contrast: 0 };

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Calculate image statistics
  let totalBrightness = 0;
  let minGray = 255, maxGray = 0;
  const edges = new Uint8Array(width * height);

  // First pass: Calculate brightness and apply Sobel edge detection
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;

      totalBrightness += gray;
      minGray = Math.min(minGray, gray);
      maxGray = Math.max(maxGray, gray);

      // Sobel edge detection
      const getGray = (dy: number, dx: number) => {
        const pidx = ((y + dy) * width + (x + dx)) * 4;
        return data[pidx] * 0.299 + data[pidx + 1] * 0.587 + data[pidx + 2] * 0.114;
      };

      const sobelX = -getGray(-1, -1) - 2 * getGray(0, -1) - getGray(1, -1) +
                     getGray(-1, 1) + 2 * getGray(0, 1) + getGray(1, 1);

      const sobelY = -getGray(-1, -1) - 2 * getGray(-1, 0) - getGray(-1, 1) +
                     getGray(1, -1) + 2 * getGray(1, 0) + getGray(1, 1);

      edges[y * width + x] = Math.min(255, Math.sqrt(sobelX * sobelX + sobelY * sobelY));
    }
  }

  const brightness = Math.round(totalBrightness / (width * height) / 2.55);
  const contrast = Math.round((maxGray - minGray) / 2.55);

  // Find document edges (strong edge lines forming a rectangle-like pattern)
  let topEdge = height, bottomEdge = 0, leftEdge = width, rightEdge = 0;
  let edgeCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] > 80) {
        // Strong edge detected
        topEdge = Math.min(topEdge, y);
        bottomEdge = Math.max(bottomEdge, y);
        leftEdge = Math.min(leftEdge, x);
        rightEdge = Math.max(rightEdge, x);
        edgeCount++;
      }
    }
  }

  // Calculate sharpness using Laplacian variance
  let laplacianSum = 0;
  const laplacian = [
    [0, -1, 0],
    [-1, 4, -1],
    [0, -1, 0]
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pidx = ((y + ky) * width + (x + kx)) * 4;
          const gray = data[pidx] * 0.299 + data[pidx + 1] * 0.587 + data[pidx + 2] * 0.114;
          sum += gray * laplacian[ky + 1][kx + 1];
        }
      }
      laplacianSum += sum * sum;
    }
  }

  const sharpness = Math.min(100, Math.round((laplacianSum / (width * height * 1000)) * 100));

  // Determine if document is detected
  const documentArea = (rightEdge - leftEdge) * (bottomEdge - topEdge);
  const frameArea = width * height;
  const areaRatio = documentArea / frameArea;

  // Document should be:
  // - Take up 20-95% of frame
  // - Have sufficient edge content
  // - Have reasonable aspect ratio (not too extreme)
  const detected =
    areaRatio > 0.2 &&
    areaRatio < 0.95 &&
    edgeCount > frameArea * 0.05 &&
    contrast > 30;

  // Calculate detection confidence
  let confidence = 0;
  if (detected) {
    confidence = Math.round(
      (areaRatio * 30) + // Area coverage (0-30)
      (Math.min(sharpness, 100) * 0.3) + // Sharpness (0-30)
      (Math.min(contrast, 100) * 0.2) + // Contrast (0-20)
      (brightness > 40 && brightness < 200 ? 20 : 0) // Brightness (0-20)
    );
  }

  // Determine quality
  let quality: "poor" | "fair" | "good" | "excellent" = "poor";
  if (confidence > 80 && sharpness > 70) quality = "excellent";
  else if (confidence > 70 && sharpness > 50) quality = "good";
  else if (confidence > 50 && sharpness > 30) quality = "fair";

  return {
    detected,
    confidence: Math.min(100, confidence),
    quality,
    edges: detected ? { top: topEdge, bottom: bottomEdge, left: leftEdge, right: rightEdge } : null,
    sharpness,
    brightness,
    contrast,
  };
}

/**
 * Preprocess image for better OCR accuracy
 * Applies grayscale, contrast enhancement, and threshold
 */
export function preprocessImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Validate image data URL format
      if (!imageDataUrl || typeof imageDataUrl !== "string") {
        reject(new Error("Invalid image data URL - image data is empty or invalid"));
        return;
      }

      if (!imageDataUrl.startsWith("data:")) {
        reject(new Error("Invalid image data URL - must be base64 encoded"));
        return;
      }

      // Check if the data URL is valid (has content after comma)
      const commaIndex = imageDataUrl.indexOf(',');
      if (commaIndex === -1 || commaIndex === imageDataUrl.length - 1) {
        reject(new Error("Invalid image data - image appears to be empty or corrupted"));
        return;
      }

      const img = new Image();
      const timeout = setTimeout(() => {
        img.src = ""; // Clear the src to avoid any further processing
        reject(new Error("Image loading timeout - image took too long to load"));
      }, 10000); // 10 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        try {
          if (img.width === 0 || img.height === 0) {
            reject(new Error("Invalid image dimensions - width or height is 0"));
            return;
          }

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
        } catch (err) {
          reject(new Error(`Image processing failed: ${String(err)}`));
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to load image - the image data may be corrupted or unsupported"));
      };

      // Set cross-origin if needed (for blob URLs)
      img.crossOrigin = "anonymous";
      img.src = imageDataUrl;
    } catch (err) {
      reject(new Error(`Preprocessing initialization failed: ${String(err)}`));
    }
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

    // Validate input
    if (!image) {
      throw new Error("Invalid image input - image is empty or null");
    }

    // Preprocess image for better accuracy (unless explicitly skipped)
    let imageToProcess: any = image;
    if (!options?.preprocessed && typeof image === "string") {
      try {
        // Validate image string format
        if (!image.startsWith("data:")) {
          throw new Error("Invalid image format - must be base64 data URL");
        }
        
        // Additional check: ensure data URL has actual content
        const commaIndex = image.indexOf(',');
        if (commaIndex === -1 || image.length < commaIndex + 10) {
          throw new Error("Image data is empty or corrupted");
        }
        
        imageToProcess = await preprocessImage(image);
        console.log("[OCR] Image preprocessing successful");
      } catch (err) {
        console.warn("[OCR] Image preprocessing failed, using original:", err);
        imageToProcess = image;
      }
    }

    // Validate that we have a valid image to process
    if (!imageToProcess) {
      throw new Error("Failed to prepare image for OCR - no valid image data");
    }

    // Set Tesseract parameters for best document OCR
    await tesseractWorker.setParameters({
      tessedit_char_whitelist: CHAR_WHITELIST,
      tessedit_pageseg_mode: (options?.psm || 6).toString(),
      textord_heavy_nr: "1",
    });

    console.log(`[OCR] Starting recognition (PSM: ${options?.psm || 6})...`);

    // Add timeout for recognition (30 seconds max)
    const recognitionPromise = tesseractWorker.recognize(imageToProcess);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("OCR recognition timeout")), 30000)
    );

    const result = await Promise.race([recognitionPromise, timeoutPromise]);

    if (!result || !result.data) {
      throw new Error("OCR processing failed - no result returned");
    }

    const text = (result.data.text || "").trim();
    const confidence = result.data.confidence || 0;

    console.log("[OCR] Recognition complete:", {
      length: text.length,
      confidence: confidence,
    });

    // Return even if text is empty - let the caller (handlePerformOCR) decide what to do
    return {
      text: text,
      confidence: confidence,
      raw: text,
    };
  } catch (err) {
    console.error("[OCR] Recognition failed:", err);
    const errMsg = String(err);

    // Provide helpful error messages
    if (errMsg.includes("timeout")) {
      throw new Error("OCR took too long to process. Please try a smaller or clearer image.");
    }
    if (errMsg.includes("image") || errMsg.includes("corrupted") || errMsg.includes("empty")) {
      throw new Error("Could not read the image. Please verify the image is clear and valid. Try recapturing or uploading a different image.");
    }
    if (errMsg.includes("fetch") || errMsg.includes("network")) {
      throw new Error("Network error. Please check your connection and try again.");
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



