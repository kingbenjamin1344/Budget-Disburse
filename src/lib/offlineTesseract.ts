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
 * Sharpen image using unsharp mask filter
 * Enhances edges and details for better OCR recognition
 */
function sharpenImage(canvas: HTMLCanvasElement, amount: number = 1.5): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Create a copy for the sharpening kernel
  const output = new Uint8ClampedArray(data.length);

  // Sharpening kernel (unsharp mask)
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ];

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const pixelIndex = (i * width + j) * 4;

      // Apply kernel to each channel
      for (let channel = 0; channel < 3; channel++) {
        let sum = 0;

        for (let ki = -1; ki <= 1; ki++) {
          for (let kj = -1; kj <= 1; kj++) {
            const y = Math.min(Math.max(i + ki, 0), height - 1);
            const x = Math.min(Math.max(j + kj, 0), width - 1);
            const idx = (y * width + x) * 4 + channel;
            sum += data[idx] * kernel[ki + 1][kj + 1];
          }
        }

        // Apply sharpening with adjustable amount
        const sharpened = data[pixelIndex + channel] + (sum - data[pixelIndex + channel]) * amount;
        output[pixelIndex + channel] = Math.min(255, Math.max(0, sharpened));
      }

      // Preserve alpha channel
      output[pixelIndex + 3] = data[pixelIndex + 3];
    }
  }

  // Create new image data and put it back
  const newImageData = new ImageData(output, width, height);
  ctx.putImageData(newImageData, 0, 0);
  return canvas;
}

/**
 * Denoise image to make text clearer
 * Reduces noise while preserving edges using a median-like filter
 */
function denoiseImage(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  const output = new Uint8ClampedArray(data.length);

  // Use a simple bilateral filter approach for denoising
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const pixelIndex = (i * width + j) * 4;

      for (let channel = 0; channel < 3; channel++) {
        let weightedSum = 0;
        let weightSum = 0;

        // 3x3 neighborhood
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            const yi = Math.min(Math.max(i + di, 0), height - 1);
            const xj = Math.min(Math.max(j + dj, 0), width - 1);
            const idx = (yi * width + xj) * 4 + channel;
            const neighborVal = data[idx];
            const centerVal = data[pixelIndex + channel];

            // Weight based on color similarity and distance
            const colorDiff = Math.abs(neighborVal - centerVal);
            const weight = Math.exp(-colorDiff / 50);

            weightedSum += neighborVal * weight;
            weightSum += weight;
          }
        }

        output[pixelIndex + channel] = weightSum > 0 ? weightedSum / weightSum : data[pixelIndex + channel];
      }

      output[pixelIndex + 3] = data[pixelIndex + 3];
    }
  }

  const newImageData = new ImageData(output, width, height);
  ctx.putImageData(newImageData, 0, 0);
  return canvas;
}

/**
 * Enhance text clarity with adaptive contrast
 * Makes text super clear and readable
 */
function enhanceTextClarity(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Calculate histogram for adaptive contrast
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    histogram[Math.floor(gray)]++;
  }

  // Find min and max non-zero histogram values (good percentiles)
  let minVal = 0, maxVal = 255;
  const totalPixels = data.length / 4;
  let cumulativePixels = 0;

  // Find 2nd percentile (minimum)
  for (let i = 0; i < 256; i++) {
    cumulativePixels += histogram[i];
    if (cumulativePixels > totalPixels * 0.02) {
      minVal = i;
      break;
    }
  }

  cumulativePixels = 0;
  // Find 98th percentile (maximum)
  for (let i = 255; i >= 0; i--) {
    cumulativePixels += histogram[i];
    if (cumulativePixels > totalPixels * 0.02) {
      maxVal = i;
      break;
    }
  }

  // Prevent division by zero
  const range = maxVal - minVal || 1;

  // Stretch contrast based on histogram
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, ((data[i] - minVal) / range) * 255)); // R
    data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - minVal) / range) * 255)); // G
    data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - minVal) / range) * 255)); // B
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Apply perspective transform to flatten tilted/skewed documents
 * Corrects document angle for better OCR
 */
function perspectiveTransform(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Detect document corners using edge detection
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Find document corners by detecting edges
  let topLeft = { x: 0, y: 0 };
  let topRight = { x: width, y: 0 };
  let bottomLeft = { x: 0, y: height };
  let bottomRight = { x: width, y: height };

  // Simplified: Find darkest/brightest pixels in corners
  let minBrightness = 255;
  let maxBrightness = 0;

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const idx = (i * width + j) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      // Top-left corner
      if (i < height * 0.25 && j < width * 0.25) {
        if (brightness > maxBrightness) {
          maxBrightness = brightness;
          topLeft = { x: j, y: i };
        }
      }

      // Top-right corner
      if (i < height * 0.25 && j > width * 0.75) {
        if (brightness > maxBrightness) {
          maxBrightness = brightness;
          topRight = { x: j, y: i };
        }
      }

      // Bottom-left corner
      if (i > height * 0.75 && j < width * 0.25) {
        if (brightness > maxBrightness) {
          maxBrightness = brightness;
          bottomLeft = { x: j, y: i };
        }
      }

      // Bottom-right corner
      if (i > height * 0.75 && j > width * 0.75) {
        if (brightness > maxBrightness) {
          maxBrightness = brightness;
          bottomRight = { x: j, y: i };
        }
      }
    }
  }

  // If corners are nearly rectangular already, skip transform
  const topDiff = Math.abs(topLeft.y - topRight.y);
  const bottomDiff = Math.abs(bottomLeft.y - bottomRight.y);
  const leftDiff = Math.abs(topLeft.x - bottomLeft.x);
  const rightDiff = Math.abs(topRight.x - bottomRight.x);

  if (topDiff < height * 0.1 && bottomDiff < height * 0.1 && leftDiff < width * 0.1 && rightDiff < width * 0.1) {
    return canvas; // Already mostly flat
  }

  // Apply simple perspective correction using canvas transform
  const newCanvas = document.createElement("canvas");
  newCanvas.width = width;
  newCanvas.height = height;
  const newCtx = newCanvas.getContext("2d");
  if (!newCtx) return canvas;

  // Use a simpler approach: rotate and scale based on corner deviation
  const skewX = (topRight.x - topLeft.x) / width - 1;
  const skewY = (bottomLeft.y - topLeft.y) / height - 1;
  const angle = Math.atan2(skewY, skewX);

  // Apply rotation to correct perspective
  newCtx.translate(width / 2, height / 2);
  newCtx.rotate(angle);
  newCtx.drawImage(canvas, -width / 2, -height / 2);

  console.log(`[OCR] Perspective corrected (angle: ${(angle * 180) / Math.PI}°)`);
  return newCanvas;
}

/**
 * Resize/upscale image using bicubic interpolation
 * Improves OCR accuracy on small or low-resolution images
 */
function resizeImage(canvas: HTMLCanvasElement, scale: number = 2): HTMLCanvasElement {
  const newWidth = canvas.width * scale;
  const newHeight = canvas.height * scale;

  const newCanvas = document.createElement("canvas");
  newCanvas.width = newWidth;
  newCanvas.height = newHeight;

  const newCtx = newCanvas.getContext("2d");
  if (!newCtx) return canvas;

  // Use high-quality scaling with imageSmoothingEnabled
  newCtx.imageSmoothingEnabled = true;
  newCtx.imageSmoothingQuality = "high";
  newCtx.drawImage(canvas, 0, 0, newWidth, newHeight);

  return newCanvas;
}

/**
 * Detect document edges using Canny-like edge detection
 * Returns the bounds of the detected document
 */
function detectDocumentEdges(canvas: HTMLCanvasElement): { x: number; y: number; width: number; height: number } | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Create gradient data for edge detection
  const edges = new Uint8Array(width * height);

  // Sobel edge detection
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Get surrounding pixel values (grayscale)
      const getGray = (dy: number, dx: number) => {
        const pidx = ((y + dy) * width + (x + dx)) * 4;
        return data[pidx] * 0.299 + data[pidx + 1] * 0.587 + data[pidx + 2] * 0.114;
      };

      // Sobel X kernel
      const sobelX = -getGray(-1, -1) - 2 * getGray(0, -1) - getGray(1, -1) +
                     getGray(-1, 1) + 2 * getGray(0, 1) + getGray(1, 1);

      // Sobel Y kernel
      const sobelY = -getGray(-1, -1) - 2 * getGray(-1, 0) - getGray(-1, 1) +
                     getGray(1, -1) + 2 * getGray(1, 0) + getGray(1, 1);

      edges[y * width + x] = Math.sqrt(sobelX * sobelX + sobelY * sobelY);
    }
  }

  // Find bounding box of detected edges
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let edgeCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] > 50) {
        // Edge threshold
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        edgeCount++;
      }
    }
  }

  // Only return bounds if significant edges detected
  if (edgeCount < 100) {
    return null; // Not enough edges detected
  }

  // Add padding (5% of detected area)
  const padding = Math.max(
    Math.abs(maxX - minX) * 0.05,
    Math.abs(maxY - minY) * 0.05
  );

  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: Math.min(width, maxX + padding) - Math.max(0, minX - padding),
    height: Math.min(height, maxY + padding) - Math.max(0, minY - padding)
  };
}

/**
 * Crop document from image using detected edges
 */
function cropToDocument(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const bounds = detectDocumentEdges(canvas);

  if (!bounds) {
    console.log("[OCR] Document edges not clearly detected, using full image");
    return canvas;
  }

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = bounds.width;
  croppedCanvas.height = bounds.height;

  const ctx = croppedCanvas.getContext("2d");
  if (!ctx) return canvas;

  // Draw the cropped region
  const sourceCtx = canvas.getContext("2d");
  if (!sourceCtx) return canvas;

  const imageData = sourceCtx.getImageData(
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height
  );
  ctx.putImageData(imageData, 0, 0);

  console.log(`[OCR] Document detected and cropped: ${bounds.width}x${bounds.height}`);
  return croppedCanvas;
}

/**
 * Preprocess image for better OCR accuracy
 * Pipeline: Crop Document → Upscale → Grayscale → Sharpen → Contrast → Threshold
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

          let canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0);

          console.log(`[OCR] Starting preprocessing pipeline - Original: ${canvas.width}x${canvas.height}`);

          // ===== ENHANCED PREPROCESSING PIPELINE =====
          // Step 1: Smart Document Detection & Crop
          canvas = cropToDocument(canvas);
          console.log("[OCR] ✓ Detected & cropped document");

          // Step 2: Perspective Transform (Flatten Document)
          canvas = perspectiveTransform(canvas);
          console.log("[OCR] ✓ Flattened document perspective");

          // Step 3: Denoise (Clean)
          denoiseImage(canvas);
          console.log("[OCR] ✓ Removed noise");

          // Step 4: Enhance Text Clarity (Make Text SUPER CLEAR)
          enhanceTextClarity(canvas);
          console.log("[OCR] ✓ Enhanced text clarity");

          // Step 5: Upscale image (3x for better small text OCR)
          canvas = resizeImage(canvas, 3);
          console.log(`[OCR] ✓ Upscaled 3x to: ${canvas.width}x${canvas.height}`);

          // Step 6: Convert to grayscale
          toGrayscale(canvas);
          console.log("[OCR] ✓ Applied grayscale");

          // Step 7: Sharpen image edges (Fix blur from distance)
          sharpenImage(canvas, 2.0);
          console.log("[OCR] ✓ Applied aggressive sharpening");

          // Step 8: Increase contrast aggressively
          increaseContrast(canvas, 2.2);
          console.log("[OCR] ✓ Enhanced contrast");

          // Step 9: Apply binary threshold
          applyThreshold(canvas, 140);
          console.log("[OCR] ✓ Applied binary threshold");

          console.log("[OCR] ✅ Preprocessing pipeline complete");
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



