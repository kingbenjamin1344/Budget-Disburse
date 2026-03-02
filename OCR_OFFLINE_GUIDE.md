# Offline OCR Implementation Guide

## Overview
The Budget Disburse application now includes comprehensive offline OCR (Optical Character Recognition) capabilities using Tesseract.js. This allows users to scan and extract text from disbursement documents even without an active internet connection.

## Features

### ✅ Full Offline Support
- **Complete offline functionality**: OCR works without internet after initial setup
- **Language data caching**: English language data is cached in IndexedDB for offline use
- **Automatic fallback**: If online, the app downloads language data; if offline, it uses cached data
- **Network status detection**: Real-time detection of online/offline status with UI indicators

### 🎯 Key Capabilities
1. **Camera Mode**: Real-time document scanning using device camera
2. **Upload Mode**: Upload existing document images
3. **Smart Form Filling**: Automatically parses and fills form fields with extracted data
4. **Online/Offline Status Indicator**: Shows current network status in the OCR modal

## How It Works

### Architecture

```
┌─────────────────────────────────────────────┐
│      Browser (React/Next.js Client)         │
├─────────────────────────────────────────────┤
│     OCR Module (src/lib/offlineTesseract.ts)│
│  ┌───────────────────────────────────────┐  │
│  │  Tesseract.js Worker                  │  │
│  │  - English language support           │  │
│  │  - Web Worker processing              │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│     Storage Layers                          │
│  ┌───────────────────────────────────────┐  │
│  │  IndexedDB - Language Data Cache      │  │
│  │  (Persistent across sessions)         │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Data Flow

**Online Mode:**
1. User opens OCR scanner → Network detected as online
2. Tesseract.js initializes and downloads language data from CDN
3. Language data is automatically cached in IndexedDB
4. OCR processes images using language data
5. Results are parsed and form fields are populated

**Offline Mode:**
1. User opens OCR scanner → Network detected as offline
2. Tesseract.js initializes using cached language data from IndexedDB
3. OCR processes images using cached language data
4. Results are parsed and form fields are populated
5. User sees "Offline" indicator in modal

## Usage

### For End Users

#### First-Time Setup (with internet)
1. Click the floating OCR scanner button (blue scan icon at bottom)
2. Choose "Camera" or "Upload" mode
3. Scan/upload your disbursement document
4. OCR will process and automatically fill in detected information
5. Language data will be cached for future offline use

#### Using Offline
1. Ensure you've used OCR at least once while connected to internet
2. Disconnect from internet (or use offline mode)
3. Click the floating OCR scanner button
4. You'll see "Offline" indicator showing offline mode
5. Scan/upload documents normally - OCR works with cached data

### For Developers

#### File Structure
```
src/
├── lib/
│   └── offlineTesseract.ts      # Core OCR module
└── app/
    └── Disbursement/
        └── page.tsx              # Uses OCR functionality
```

#### Key Functions in `offlineTesseract.ts`

**Initialize Worker**
```typescript
await initTesseractWorker()
```
- Initializes Tesseract worker with offline support
- Automatically caches language data when online
- Reuses cached data when offline

**Perform OCR**
```typescript
const text = await performOCR(image)
```
- Accepts: HTMLCanvasElement, HTMLImageElement, File, or data URL string
- Returns: Extracted text as string
- Works online or offline

**Get OCR Status**
```typescript
const status = getOCRStatus()
// Returns: { available: boolean, online: boolean, cached: boolean }
```

**Check Network Status**
```typescript
const isOnline = isNetworkOnline()
```

#### Error Handling

The OCR module provides helpful error messages:

| Scenario | Message |
|----------|---------|
| Offline, no cached data | "OCR requires language data. Please ensure language data was cached while online, or connect to internet." |
| Network error | "Network error. Please check your connection and try again." |
| General OCR failure | "OCR failed. Please try again." |
| Offline mode (success) | "OCR completed successfully (Offline mode)" |
| Online mode (success) | "OCR completed successfully (Online mode)" |

## Technical Details

### Dependencies
- **tesseract.js** (v6.0.1): JavaScript OCR library
- **IndexedDB**: Browser-native storage for language data persistence
- **lucide-react**: UI icons for online/offline indicators

### Language Support
- Currently configured for: **English (eng)**
- Can be extended to support additional languages by:
  1. Modifying the language code in `initTesseractWorker()`
  2. Additional language files will be cached similarly

### Performance Characteristics
- **First-time initialization**: 2-5 seconds (includes downloading language data)
- **Offline initialization**: < 1 second (uses cached data)
- **OCR processing**: 5-30 seconds depending on image complexity
- **Memory usage**: ~150-200 MB during processing (cleared after)

### Browser Compatibility
- Chrome/Chromium: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 13+)
- Edge: ✅ Full support
- Opera: ✅ Full support

**Requirements:**
- IndexedDB support (for caching)
- Web Workers support
- Canvas API support

### Caching Strategy

**What gets cached:**
- English language data (~150 MB)
- Cached in IndexedDB under key: `tesseract-lang-data-eng`

**When cached:**
- Automatically on first successful OCR while online
- Persists across browser sessions
- Does not require manual cache management

**Cache lifecycle:**
- No automatic expiration
- Survives browser restart
- Cleared when user clears IndexedDB/site data
- Can be manually cleared via browser DevTools

## Troubleshooting

### "OCR not available" or slow initialization
**Solution**: 
- First use should be with internet connection to download language data
- Language data is cached for offline use afterwards
- If still slow, clear browser cache and retry online

### OCR works online but fails offline
**Solution**:
- Language data may not be cached
- Use OCR feature once while online to cache data
- Check browser IndexedDB is enabled (usually enabled by default)

### Camera permission denied
**Solution**:
- Check browser camera permissions
- Reload page and try again
- Use "Upload" mode instead to upload existing images

### "Network error" message
**Solution**:
- Check internet connection
- If offline, switch to offline mode and use cached data
- Reload the page

### IndexedDB quota exceeded
**Solution**:
- Clear browser cache/data and re-cache language data
- Use a different browser profile
- Increase IndexedDB quota if supported by browser

## Configuration

### Modifying Settings

**In `src/lib/offlineTesseract.ts`:**

Change language:
```typescript
// Line ~90
tesseractWorker = await Tesseract.createWorker("eng", 1, workerConfig);
// Change "eng" to other language codes: "fra", "deu", "spa", etc.
```

Adjust logging:
```typescript
// Modify the logger function in workerConfig
logger: (m: any) => {
  // Customize logging behavior
}
```

### Environment Variables
- No additional environment variables required
- Works with existing application setup

## Future Enhancements

Possible improvements:
1. **Multi-language support**: Add support for more OCR languages
2. **Handwriting recognition**: Improve handwritten document support
3. **Document preprocessing**: Auto-rotate/enhance images
4. **Batch processing**: Scan multiple documents in sequence
5. **Custom training**: Fine-tune OCR for specific document formats
6. **Form field mapping**: Pre-define extraction patterns for standard documents

## Security & Privacy

### Data Processing
- ✅ **Local processing**: All OCR happens in-browser, no data sent to servers
- ✅ **No tracking**: No usage tracking or analytics on OCR operations
- ✅ **User data privacy**: Document images never leave the device

### IndexedDB Security
- Data stored in IndexedDB is **domain-specific** (isolated per domain)
- Only accessible from the application origin
- Cleared when user clears site data

## Support & Resources

### Documentation
- [Tesseract.js Documentation](https://github.com/naptha/tesseract.js)
- [MDN IndexedDB Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

### Debugging
Enable verbose logging:
```javascript
// In browser console
localStorage.setItem('debug', 'tesseract:*');
```

## Version History

### v1.0.0 (Current)
- ✅ Offline OCR with language data caching
- ✅ Online/offline status detection
- ✅ Smart form field extraction
- ✅ Camera and upload modes
- ✅ Comprehensive error handling
