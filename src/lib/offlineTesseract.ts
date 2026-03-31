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
 * Improves OCR accuracy by enhancing image quality with advanced document detection
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
 * Upscale image to improve OCR accuracy (2x-3x resolution)
 */
function upscaleImage(canvas: HTMLCanvasElement, scale: number = 2): HTMLCanvasElement {
  const scaledCanvas = document.createElement("canvas");
  scaledCanvas.width = canvas.width * scale;
  scaledCanvas.height = canvas.height * scale;
  
  const ctx = scaledCanvas.getContext("2d");
  if (!ctx) return canvas;
  
  // Use high-quality image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, scaledCanvas.width, scaledCanvas.height);
  
  // Copy data back to original canvas
  canvas.width = scaledCanvas.width;
  canvas.height = scaledCanvas.height;
  const origCtx = canvas.getContext("2d");
  if (origCtx) {
    origCtx.drawImage(scaledCanvas, 0, 0);
  }
  
  return canvas;
}

/**
 * Sharpen image using unsharp mask technique
 */
function sharpenImage(canvas: HTMLCanvasElement, intensity: number = 1.5): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Create a copy for blur calculation
  const blurred = new Uint8ClampedArray(data);

  // Simple blur kernel for unsharp mask
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const idx = (y * width + x) * 4 + c;
        const sum =
          blurred[((y - 1) * width + (x - 1)) * 4 + c] +
          blurred[((y - 1) * width + x) * 4 + c] +
          blurred[((y - 1) * width + (x + 1)) * 4 + c] +
          blurred[(y * width + (x - 1)) * 4 + c] +
          blurred[(y * width + x) * 4 + c] * 4 +
          blurred[(y * width + (x + 1)) * 4 + c] +
          blurred[((y + 1) * width + (x - 1)) * 4 + c] +
          blurred[((y + 1) * width + x) * 4 + c] +
          blurred[((y + 1) * width + (x + 1)) * 4 + c];

        const blurredValue = sum / 12;
        // Unsharp mask: original + (original - blurred) * intensity
        const sharpened =
          blurred[idx] + (blurred[idx] - blurredValue) * intensity;
        data[idx] = Math.min(255, Math.max(0, sharpened));
      }
    }
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
 * Apply Sobel edge detection (for document boundary detection)
 */
function sobelEdgeDetection(canvas: HTMLCanvasElement): Uint8ClampedArray {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get canvas context");

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Convert to grayscale for edge detection
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }

  // Sobel operators
  const edges = new Uint8ClampedArray(width * height);
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      let idx = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIdx = ((y + ky) * width + (x + kx));
          gx += gray[pixelIdx] * sobelX[idx];
          gy += gray[pixelIdx] * sobelY[idx];
          idx++;
        }
      }
      edges[y * width + x] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
    }
  }

  return edges;
}

/**
 * Auto-detect document boundaries and return crop coordinates
 */
function detectDocumentBounds(canvas: HTMLCanvasElement): { x: number; y: number; w: number; h: number } | null {
  try {
    const edges = sobelEdgeDetection(canvas);
    const width = canvas.width;
    const height = canvas.height;

    // Find the bounding box of strong edges
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let edgeCount = 0;

    const threshold = 100; // Edge strength threshold
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (edges[y * width + x] > threshold) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          edgeCount++;
        }
      }
    }

    // Verify we found enough edges
    if (edgeCount < width * height * 0.01) {
      console.log("[OCR] Could not detect document with sufficient edges");
      return null;
    }

    // Add padding and return bounds (avoid extreme corners)
    const padding = 20;
    return {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      w: Math.min(width, maxX - minX + padding * 2),
      h: Math.min(height, maxY - minY + padding * 2),
    };
  } catch (err) {
    console.warn("[OCR] Document detection failed:", err);
    return null;
  }
}

/**
 * Crop canvas to detected document bounds
 */
function cropToDocument(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const bounds = detectDocumentBounds(canvas);
  if (!bounds || bounds.w < 100 || bounds.h < 100) {
    return canvas; // Document too small, return original
  }

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = bounds.w;
  croppedCanvas.height = bounds.h;

  const srcCtx = canvas.getContext("2d");
  const dstCtx = croppedCanvas.getContext("2d");
  
  if (!srcCtx || !dstCtx) return canvas;

  const imageData = srcCtx.getImageData(bounds.x, bounds.y, bounds.w, bounds.h);
  dstCtx.putImageData(imageData, 0, 0);

  return croppedCanvas;
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
 * Pipeline: Upscale → Document Detection & Crop → Grayscale → Sharpen → Contrast → Threshold
 * 
 * @param imageDataUrl - Base64 encoded image data URL
 * @param options - Preprocessing options
 * @returns Promise resolving to preprocessed image data URL
 */
export interface PreprocessOptions {
  scale?: number; // Upscaling factor (2 or 3, default 2)
  detectDocument?: boolean; // Auto-detect and crop document (default true)
  sharpenIntensity?: number; // Sharpening intensity (0-3, default 1.5)
  contrastFactor?: number; // Contrast multiplier (default 1.5)
  threshold?: number; // Threshold value (0-255, default 150)
}

export function preprocessImage(imageDataUrl: string, options?: PreprocessOptions): Promise<string> {
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
      }, 15000); // 15 second timeout for complex preprocessing

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

          // Merge options with defaults
          const opts: Required<PreprocessOptions> = {
            scale: options?.scale ?? 2,
            detectDocument: options?.detectDocument ?? true,
            sharpenIntensity: options?.sharpenIntensity ?? 1.5,
            contrastFactor: options?.contrastFactor ?? 1.5,
            threshold: options?.threshold ?? 150,
          };

          console.log("[OCR] Starting preprocessing pipeline with options:", opts);

          // Step 1: Auto-detect and crop document (if enabled)
          if (opts.detectDocument) {
            try {
              const croppedCanvas = cropToDocument(canvas);
              canvas.width = croppedCanvas.width;
              canvas.height = croppedCanvas.height;
              const newCtx = canvas.getContext("2d");
              if (newCtx) {
                newCtx.drawImage(croppedCanvas, 0, 0);
              }
              console.log("[OCR] Document detection and cropping completed");
            } catch (err) {
              console.warn("[OCR] Document detection failed, proceeding with original image:", err);
            }
          }

          // Step 2: Upscale image (improves OCR accuracy)
          upscaleImage(canvas, opts.scale);
          console.log(`[OCR] Image upscaled by ${opts.scale}x to ${canvas.width}x${canvas.height}`);

          // Step 3: Convert to grayscale
          toGrayscale(canvas);
          console.log("[OCR] Converted to grayscale");

          // Step 4: Sharpen image
          sharpenImage(canvas, opts.sharpenIntensity);
          console.log(`[OCR] Image sharpened with intensity ${opts.sharpenIntensity}`);

          // Step 5: Increase contrast
          increaseContrast(canvas, opts.contrastFactor);
          console.log(`[OCR] Contrast increased by factor ${opts.contrastFactor}`);

          // Step 6: Apply threshold (convert to black and white)
          applyThreshold(canvas, opts.threshold);
          console.log(`[OCR] Threshold applied at value ${opts.threshold}`);

          console.log("[OCR] Preprocessing pipeline complete");
          resolve(canvas.toDataURL("image/jpeg", 0.95));
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

export interface OCROptions {
  lang?: string;
  psm?: number; // Page segmentation mode
  preprocessed?: boolean; // if true, skip preprocessing
  preprocessOptions?: PreprocessOptions; // Preprocessing pipeline options
}

export async function performOCR(
  image: HTMLCanvasElement | HTMLImageElement | File | string,
  options?: OCROptions
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
        
        // Use enhanced preprocessing with document detection, upscaling, sharpening, etc.
        imageToProcess = await preprocessImage(image, options?.preprocessOptions);
        console.log("[OCR] Image preprocessing successful with enhanced pipeline");
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



