# Offline OCR Architecture & Data Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Components (Disbursement Page)               │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │ OCR Scanner Modal                             │ │   │
│  │  │ - Camera Mode                                 │ │   │
│  │  │ - Upload Mode                                 │ │   │
│  │  │ - Online/Offline Indicator                    │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  OCR Module (src/lib/offlineTesseract.ts)           │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │ initTesseractWorker()                          │ │   │
│  │  │ performOCR(image)                              │ │   │
│  │  │ getOCRStatus()                                 │ │   │
│  │  │ isNetworkOnline()                              │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tesseract.js Worker                               │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │ OCR Processing                                 │ │   │
│  │  │ Image → Text Extraction                        │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                     ↙         ↘                              │
│           (Online)           (Offline)                       │
│              ↓                   ↓                            │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Network Layer   │  │   IndexedDB      │               │
│  │  (CDN)           │  │  (Browser Cache) │               │
│  │  Download Lang   │  │  Language Data   │               │
│  │  Data            │  │  (150 MB)        │               │
│  └──────────────────┘  └──────────────────┘               │
│           ↓                    ↓                            │
│  ┌──────────────────────────────────────┐                │
│  │  Both paths → Store in IndexedDB     │                │
│  │  (First online, then reuse offline)  │                │
│  └──────────────────────────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow: Online (First Time)

```
User Opens Scan Modal
        ↓
  Check Network
        ↓
  [ONLINE] ✅
        ↓
  Initialize Tesseract Worker
        ↓
  Download Language Data from CDN
        ↓
  Process Image with Downloaded Data
        ↓
  Store Language Data in IndexedDB
        ↓
  Extract Text from Image
        ↓
  Return Results to UI
        ↓
  Form Auto-Fills ✅
```

## Data Flow: Offline (Subsequent Uses)

```
User Opens Scan Modal
        ↓
  Check Network
        ↓
  [OFFLINE] ✅
        ↓
  Initialize Tesseract Worker
        ↓
  Load Language Data from IndexedDB Cache
        ↓
  Process Image with Cached Data
        ↓
  Extract Text from Image
        ↓
  Return Results to UI
        ↓
  Form Auto-Fills ✅
```

## State Management Flow

```
┌─────────────────────────────────────┐
│  Component State (page.tsx)         │
├─────────────────────────────────────┤
│                                      │
│  isOnlineMode: boolean              │
│  └→ Tracked via navigator.onLine   │
│  └→ Updates on online/offline event│
│                                      │
│  ocrAvailable: boolean              │
│  └→ Worker initialization status    │
│                                      │
│  ocrLoading: boolean                │
│  └→ Active OCR processing status    │
│                                      │
│  ocrResult: string                  │
│  └→ Extracted text                  │
│                                      │
│  formData: object                   │
│  └→ Auto-filled with OCR results    │
│                                      │
└─────────────────────────────────────┘
```

## Module State

```
┌─────────────────────────────────────┐
│  OCR Module State                   │
│  (offlineTesseract.ts)              │
├─────────────────────────────────────┤
│                                      │
│  tesseractWorker: Worker | null     │
│  └→ Singleton instance              │
│                                      │
│  initPromise: Promise | null        │
│  └→ Prevents multiple initializations
│                                      │
│  isOnline: boolean                  │
│  └→ Cached network status           │
│  └→ Updated by event listeners      │
│                                      │
└─────────────────────────────────────┘
```

## Error Handling Flow

```
User Initiates OCR
        ↓
   Try {
      Initialize Worker
            ↓
      Perform Recognition
            ↓
      Success? 
      ├─ YES → Return text
      └─ NO  → Catch error
   }
   Catch {
      Check: isOnline?
      ├─ No + fetch error
      │  └→ "OCR requires language data..."
      ├─ Yes + fetch error
      │  └→ "Network error. Check connection..."
      └─ Other
         └→ "OCR failed. Please try again..."
   }
```

## Network Monitoring

```
Browser Window Object
        ↓
   addEventListener('online')
        ↓
   isOnline = true
   Update UI → Show "Online" badge
        ↓
   (User actions here)
        ↓
   addEventListener('offline')
        ↓
   isOnline = false
   Update UI → Show "Offline" badge
        ↓
   (User can still use cached data)
```

## Component Update Flow

```
Disbursement Page Component
        ↓
   useEffect (onMount)
        ├→ Initialize OCR worker
        ├→ Setup network listeners
        ├→ Load offices/expenses/budgets
        └→ Set initial network status
        ↓
   User clicks scan button
        ├→ Check isOnlineMode
        ├→ Display appropriate badge
        ├→ Show camera or upload UI
        ↓
   User scans/uploads
        ├→ Capture image
        ├→ Call performOCR(imageData)
        ├→ Set ocrLoading = true
        ├→ Wait for results
        └→ Set ocrLoading = false
        ↓
   OCR returns text
        ├→ Parse and extract fields
        ├→ Update formData state
        ├→ Auto-fill form fields
        └→ Show success toast
        ↓
   Network status changes
        ├→ Trigger online/offline listener
        ├→ Update isOnlineMode state
        └→ UI reflects new status
        ↓
   Component unmounts
        └→ Cleanup: remove listeners, terminate worker
```

## Cache Lifecycle

```
First Load (Online)
        ↓
    OCR Used?
    ├─ No  → Skip caching
    └─ Yes → 
            ├─ Download language data
            ├─ Store in IndexedDB
            └─ Cache available ✅
        ↓
    Page Refresh
        ├─ Cache persists ✅
        └─ Offline still works ✅
        ↓
    Browser Restart
        ├─ Cache persists ✅
        └─ Offline still works ✅
        ↓
    User Clears Site Data
        └─ Cache deleted
           (Will recache next online use)
```

## Performance Timeline (First Use - Online)

```
Time (seconds)    Event
───────────────────────────────────────
0s               User clicks scan button
                 ↓
0.1s             Check network status → Online ✅
                 ↓
0.2s             Load Tesseract worker
                 ↓
2-5s             Download language data (CDN)
                 ↓
7s               Language data ready
                 ↓
7.1s             User scans/uploads image
                 ↓
7.2s             OCR processing begins
                 ↓
12-30s           Text extraction (varies by image)
                 ↓
30s+             Results returned & cached
                 └─→ Form auto-fills
```

## Performance Timeline (Offline Use - After Caching)

```
Time (seconds)    Event
───────────────────────────────────────
0s               User clicks scan button
                 ↓
0.1s             Check network status → Offline ℹ️
                 ↓
0.2s             Load Tesseract worker
                 ↓
0.3s             Load language data from IndexedDB cache
                 ↓
0.5s             Language data ready (from cache!)
                 ↓
0.6s             User scans/uploads image
                 ↓
0.7s             OCR processing begins
                 ↓
5-30s            Text extraction (varies by image)
                 ↓
30s+             Results returned
                 └─→ Form auto-fills
```

## Key Differences: Online vs Offline

```
┌──────────────────┬────────────────────┬──────────────────┐
│ Aspect           │ Online             │ Offline          │
├──────────────────┼────────────────────┼──────────────────┤
│ Startup time     │ 2-5s (+ download)  │ <1s              │
│ Badge color      │ Green              │ Yellow           │
│ Badge text       │ "Online"           │ "Offline"        │
│ Data source      │ CDN                │ IndexedDB        │
│ Error if no data │ "Network error"    │ "Cache required" │
│ Processing speed │ Normal             │ Normal           │
│ First time req.  │ Required           │ Not needed       │
│ Network needed   │ Yes (first use)    │ No               │
│ Cache usage      │ Yes (automatic)    │ Yes (reuse)      │
└──────────────────┴────────────────────┴──────────────────┘
```

---

## Summary

The offline OCR implementation uses a **two-tier data strategy**:

1. **Online Mode**: Download and cache language data
2. **Offline Mode**: Reuse cached data from IndexedDB

Both paths lead to the same outcome: **reliable OCR text extraction**, whether connected or not.
