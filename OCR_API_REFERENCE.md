# Quick Reference: Offline OCR API

## Import
```typescript
import { 
  performOCR, 
  initTesseractWorker, 
  terminateTesseractWorker,
  getOCRStatus,
  isNetworkOnline 
} from "@/lib/offlineTesseract";
```

## Core Functions

### `initTesseractWorker()`
Initialize the OCR worker. Call this once on app start.

```typescript
await initTesseractWorker();
// Handles caching and offline setup automatically
```

**Returns**: `Promise<void>`

**When to call**: 
- App initialization
- Before using OCR
- Automatically re-uses existing worker if already initialized

---

### `performOCR(image)`
Extract text from an image.

```typescript
const text = await performOCR(imageData);
console.log(text); // "DV No. 2025-00123..."
```

**Parameters**:
- `image` (required): HTMLCanvasElement | HTMLImageElement | File | Data URL string

**Returns**: `Promise<string>` - Extracted text

**Error handling**:
```typescript
try {
  const text = await performOCR(image);
} catch (err) {
  if (!isNetworkOnline()) {
    // Offline mode - use cached data
    console.log("Running offline:", err.message);
  }
}
```

---

### `terminateTesseractWorker()`
Clean up OCR worker and free resources.

```typescript
await terminateTesseractWorker();
// Call on component unmount or app shutdown
```

**Returns**: `Promise<void>`

---

### `getOCRStatus()`
Check OCR availability and status.

```typescript
const status = getOCRStatus();
// {
//   available: boolean,  // Worker initialized
//   online: boolean,     // Network connected
//   cached: boolean      // Language data cached
// }
```

**Returns**: `{ available: boolean, online: boolean, cached: boolean }`

---

### `isNetworkOnline()`
Check current network status.

```typescript
if (isNetworkOnline()) {
  console.log("Online");
} else {
  console.log("Offline - using cached data");
}
```

**Returns**: `boolean`

---

## Usage Examples

### Example 1: Basic Camera Scan
```typescript
const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);

const captureAndScan = async () => {
  if (videoRef.current && canvasRef.current) {
    const context = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    
    const imageData = canvasRef.current.toDataURL("image/jpeg");
    const text = await performOCR(imageData);
    
    console.log("Extracted:", text);
  }
};
```

### Example 2: File Upload Scan
```typescript
const handleFileUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const imageData = e.target?.result as string;
    const text = await performOCR(imageData);
    
    // Parse and use extracted text
    parseDocument(text);
  };
  reader.readAsDataURL(file);
};
```

### Example 3: With Error Handling
```typescript
const scanDocument = async (image: string) => {
  try {
    await initTesseractWorker();
    const text = await performOCR(image);
    
    // Check status
    const status = getOCRStatus();
    if (!status.online && !status.cached) {
      console.warn("Offline without cached data");
    }
    
    return text;
  } catch (error) {
    if (!isNetworkOnline()) {
      console.error("Offline mode error:", error);
    } else {
      console.error("Network error:", error);
    }
    throw error;
  } finally {
    // Optionally cleanup when done
    // await terminateTesseractWorker();
  }
};
```

### Example 4: In React Component
```typescript
export function DocumentScanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [ocrLoading, setOcrLoading] = useState(false);

  useEffect(() => {
    // Initialize OCR on mount
    initTesseractWorker().catch(console.error);
    
    // Track online status
    const updateStatus = () => setIsOnline(isNetworkOnline());
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    
    return () => {
      terminateTesseractWorker().catch(console.error);
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  const handleScan = async (imageData: string) => {
    setOcrLoading(true);
    try {
      const text = await performOCR(imageData);
      console.log(`OCR successful (${isOnline ? "online" : "offline"}):`, text);
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div>
      <div>{isOnline ? "🟢 Online" : "🔴 Offline"}</div>
      <button onClick={() => handleScan(imageData)}>
        {ocrLoading ? "Processing..." : "Scan"}
      </button>
    </div>
  );
}
```

---

## Console Logs (Debugging)

The OCR module logs with `[OCR]` prefix. Example output:

```
[OCR] Network: Online
[OCR] Worker initialized (Online: true)
[OCR] Starting recognition (Online: true)...
[OCR] Recognition complete: { length: 245, confidence: 0.95 }
```

**Log levels:**
- `console.log("[OCR] ...")` - Info/status
- `console.warn("[OCR] ...")` - Warnings (non-critical)
- `console.error("[OCR] ...")` - Errors (failures)

---

## Caching Details

**What's cached**: English language data (~150 MB)
**Where**: Browser IndexedDB (`TesseractDB` database)
**Key**: `tesseract-lang-data-eng`
**Lifetime**: Persistent until user clears site data

**Manual cache check** (DevTools):
```javascript
// Open DevTools Console
const db = indexedDB.open('TesseractDB');
db.onsuccess = () => {
  const tx = db.result.transaction(['lang-data'], 'readonly');
  const store = tx.objectStore('lang-data');
  const req = store.get('tesseract-lang-data-eng');
  req.onsuccess = () => console.log('Cached:', req.result ? 'Yes' : 'No');
};
```

---

## Performance Tips

1. **Call `initTesseractWorker()` early** (on page load, not on user action)
2. **Reuse worker instance** - Don't reinitialize repeatedly
3. **Process one image at a time** - Queue multiple scans
4. **Free up resources** - Call `terminateTesseractWorker()` when done
5. **Cache language data online** - Use OCR at least once while online

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| OCR hangs/slow | Is language data cached? Use OCR once online |
| "Worker failed to init" | Check browser console errors |
| Works online, fails offline | Language data not cached - use online first |
| IndexedDB quota exceeded | Clear browser cache, re-cache data |
| Camera permission denied | Check browser camera permissions |

---

## Configuration

**Change language** (in `offlineTesseract.ts`):
```typescript
// Line ~90: Change "eng" to other language codes
tesseractWorker = await Tesseract.createWorker("fra", 1, workerConfig); // French
// Supported: "deu" (German), "spa" (Spanish), "ita" (Italian), etc.
```

---

## Browser Support Check
```javascript
// Check if offline OCR will work
const supported = {
  indexedDB: 'indexedDB' in window,
  webWorkers: typeof Worker !== 'undefined',
  canvas: !!document.createElement('canvas').getContext,
  mediaDevices: !!navigator.mediaDevices?.getUserMedia
};
console.log('OCR Support:', supported);
```

**All modern browsers support these APIs** ✅
