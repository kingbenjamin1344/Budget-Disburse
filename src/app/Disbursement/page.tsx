"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { Search, Plus, Edit, Trash2, X, ScanEye, Camera, Upload, Loader, Wifi, WifiOff, Building2, Calendar, Clock, DollarSign, FileText, User, Tag, FolderOpen, Receipt, CreditCard } from "lucide-react";
import { performOCR, initTesseractWorker, terminateTesseractWorker, getOCRStatus, isNetworkOnline, preprocessImage, type OCRResult } from "@/lib/offlineTesseract";

// =================== Floating Scan Button ===================
interface FloatingScanButtonProps {
  onClick?: () => void;
}

const FloatingScanButton: React.FC<FloatingScanButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 bg-white border-2 border-blue-500 rounded-full p-4 shadow-2xl cursor-pointer hover:scale-110 hover:shadow-3xl transition-all duration-200 flex items-center justify-center"
      title="Open OCR Scanner"
    >
      <ScanEye className="w-8 h-8 text-blue-600" />
    </button>
  );
};

// =================== Main Page ===================
export default function DisbursementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOffice, setFilterOffice] = useState("");
  const [filterExpense, setFilterExpense] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deletePayee, setDeletePayee] = useState("");
  // Selected item for details modal
  const [selectedDisbursement, setSelectedDisbursement] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [offices, setOffices] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<{ type: string; category: string }[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    dvNo: "",
    payee: "",
    office: "",
    expenseType: "",
    expenseCategory: "",
    amount: "",
    date: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ====== Loading State ======
  const [isLoading, setIsLoading] = useState(true);

  // ====== Keyword Mapping for Dynamic Category Detection ======
  const [categoryKeywords, setCategoryKeywords] = useState<any>({});

  // ====== OCR Scanner States ======
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "upload">("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState("");
  const [isOnlineMode, setIsOnlineMode] = useState(true);
  const [ocrAvailable, setOcrAvailable] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);



  // ====== Fetch Offices, Expenses, Budgets & Check Network Status ======
  useEffect(() => {
    async function loadData() {
      try {
        const [officeRes, expenseRes, budgetRes, keywordRes] = await Promise.all([
          fetch("/api/offices"),
          fetch("/api/expenses"),
          fetch("/api/addbudget"),
          fetch("/api/expense-keywords"),
        ]);
        const officeData = await officeRes.json();
        const expenseData = await expenseRes.json();
        const budgetData = await budgetRes.json();
        const keywordData = await keywordRes.json();

        setOffices(officeData.map((o: any) => o.name));
        setExpenses(expenseData.map((e: any) => ({ type: e.type, category: e.category })));
        setBudgets(budgetData);
        
        // Set keyword mapping for dynamic category detection
        if (keywordData.keywords) {
          setCategoryKeywords(keywordData.keywords);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    // Check network status
    const updateNetworkStatus = () => {
      setIsOnlineMode(isNetworkOnline());
    };
    updateNetworkStatus();
    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    // Initialize Tesseract worker on component mount for offline OCR
    initTesseractWorker().catch((err) => {
      console.warn("Tesseract initialization delayed (will load on first OCR use):", err);
      setOcrAvailable(false);
    }).then(() => {
      const status = getOCRStatus();
      setOcrAvailable(status.available);
    });

    // Cleanup: terminate Tesseract worker on unmount
    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
      terminateTesseractWorker().catch(console.error);
    };
  }, []);

  // ====== OCR Functions ======
const preprocessCapturedImage = async (imageData: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Create canvas for preprocessing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Step 1: Calculate scale factor based on image size
      // Target minimum width of 1200px for better OCR
      const targetMinWidth = 1200;
      let width = img.width;
      let height = img.height;
      let scale = 1;
      
      if (width < targetMinWidth) {
        scale = targetMinWidth / width;
        width = targetMinWidth;
        height = height * scale;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        // Draw scaled image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Step 2: Convert to grayscale for better text detection
        const imageDataObj = ctx.getImageData(0, 0, width, height);
        const data = imageDataObj.data;
        
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = gray;     // R
          data[i + 1] = gray; // G
          data[i + 2] = gray; // B
        }
        ctx.putImageData(imageDataObj, 0, 0);
        
        // Step 3: Apply sharpening filter
        const sharpenedData = ctx.getImageData(0, 0, width, height);
        const sharpenedPixels = sharpenedData.data;
        
        // Simple sharpening (unsharp mask)
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx?.drawImage(canvas, 0, 0);
        const blurredData = tempCtx?.getImageData(0, 0, width, height);
        
        if (blurredData) {
          for (let i = 0; i < data.length; i += 4) {
            // Apply sharpening: original + (original - blurred)
            for (let j = 0; j < 3; j++) {
              const original = sharpenedPixels[i + j];
              const blurred = blurredData.data[i + j];
              const sharpened = Math.min(255, Math.max(0, original + (original - blurred) * 0.8));
              sharpenedPixels[i + j] = sharpened;
            }
          }
          ctx.putImageData(sharpenedData, 0, 0);
        }
        
        // Step 4: Increase contrast
        const contrastData = ctx.getImageData(0, 0, width, height);
        const contrastPixels = contrastData.data;
        const contrast = 1.3; // Increase contrast by 30%
        
        for (let i = 0; i < contrastPixels.length; i += 4) {
          for (let j = 0; j < 3; j++) {
            let value = contrastPixels[i + j];
            value = ((value / 255 - 0.5) * contrast + 0.5) * 255;
            contrastPixels[i + j] = Math.min(255, Math.max(0, value));
          }
        }
        ctx.putImageData(contrastData, 0, 0);
        
        // Return processed image as data URL
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } else {
        resolve(imageData);
      }
    };
    img.src = imageData;
  });
};

const checkImageQuality = (imageData: string): Promise<{ quality: 'good' | 'poor'; message: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Check resolution
      if (img.width < 800 || img.height < 600) {
        resolve({
          quality: 'poor',
          message: 'Image resolution too low. Move closer to the document or use higher resolution camera.'
        });
        return;
      }
      
      // Create temporary canvas to analyze
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      
      const imageDataObj = ctx?.getImageData(0, 0, img.width, img.height);
      if (imageDataObj) {
        // Check contrast (simple variance check)
        let total = 0;
        const data = imageDataObj.data;
        for (let i = 0; i < data.length; i += 4) {
          total += (data[i] + data[i+1] + data[i+2]) / 3;
        }
        const avg = total / (img.width * img.height);
        
        let variance = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
          variance += Math.pow(brightness - avg, 2);
        }
        variance = variance / (img.width * img.height);
        
        if (variance < 500) {
          resolve({
            quality: 'poor',
            message: 'Low contrast detected. Ensure even lighting and avoid shadows.'
          });
          return;
        }
      }
      
      resolve({ quality: 'good', message: 'Image quality sufficient for OCR' });
    };
    img.src = imageData;
  });
};

const startCamera = async () => {
  try {
    let mediaStream: MediaStream;

    // Try back camera first with higher resolution constraints
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 3840 }, // 4K if available
          height: { ideal: 2160 },
          aspectRatio: { ideal: 1.5 }
        },
        audio: false,
      });
    } catch {
      // Fallback to ANY camera with high resolution
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });
    }

    setStream(mediaStream);
    
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      await videoRef.current.play();
      setCameraActive(true);
      
      // Apply zoom if supported
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.zoom && 'zoom' in track.getSettings()) {
        const maxZoom = capabilities.zoom.max || 4;
        await track.applyConstraints({
          advanced: [{ zoom: Math.min(zoomLevel, maxZoom) } as any]
        });
      }
    }
  } catch (err) {
    toast.error("Camera error: " + String(err));
    console.error("Camera start error:", err);
  }
};




  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setCameraActive(false);
      setStream(null);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      
      // Use higher resolution capture
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      
      context?.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
      
      const imageData = canvasRef.current.toDataURL("image/jpeg", 1.0); // Max quality
      
      // Check quality before OCR
      const quality = await checkImageQuality(imageData);
      if (quality.quality === 'poor') {
        toast.warning(quality.message, { autoClose: 3000 });
      }
      
      await handlePerformOCR(imageData);
      stopCamera();
    }
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      await handlePerformOCR(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handlePerformOCR = async (imageData: string) => {
    setOcrLoading(true);
    try {
      if (!imageData || imageData.length < 100) {
        throw new Error("Invalid image data - image may be too small or corrupted");
      }

      // Show loading toast with progress indication
      toast.info("Preprocessing image for better OCR...", { autoClose: 2000 });

      // Step 1: Preprocess the image (scale up, sharpen, enhance contrast)
      const processedImage = await preprocessCapturedImage(imageData);
      
      toast.info("Running OCR (this may take a few seconds)...", { autoClose: 2000 });

      // Initialize worker if not already done
      await initTesseractWorker();

      // Step 2: Multi-pass OCR with different settings
      const ocrOptions = [
        { psm: 6, oem: 3 },        // Uniform block, LSTM engine
        { psm: 4, oem: 3 },        // Assume single column of text
        { psm: 11, oem: 3 },       // Sparse text
      ];
      
      const results: OCRResult[] = [];
      
      for (const options of ocrOptions) {
        try {
          const result = await performOCR(processedImage, options);
          if (result.text && result.text.trim()) {
            results.push(result);
          }
        } catch (err) {
          console.warn(`OCR with PSM ${options.psm} failed:`, err);
        }
      }
      
      if (results.length === 0) {
        throw new Error("No text could be extracted from the image");
      }
      
      // Find best result by confidence or length
      let bestResult = results[0];
      for (const result of results) {
        if (result.confidence > bestResult.confidence) {
          bestResult = result;
        }
      }
      
      const extractedText = bestResult.text;
      const confidence = bestResult.confidence;
      
      setOcrResult(extractedText);
      
      // Provide quality feedback
      if (confidence < 60) {
        toast.warning(`⚠️ Low OCR confidence (${confidence.toFixed(0)}%). Try taking a clearer photo with better lighting.`, {
          autoClose: 5000,
        });
      } else if (confidence >= 80) {
        toast.success(`✓ High quality extraction (${confidence.toFixed(0)}% confidence)`, {
          autoClose: 2000,
        });
      }
      
      // Parse extracted data
      parseAndFillForm(extractedText);
      
      toast.info("OCR completed successfully", { autoClose: 2000 });
      
    } catch (err) {
      const errMsg = String(err);
      let userMessage = "OCR failed. Please try again with a clearer image.";
      
      if (errMsg.includes("image") || errMsg.includes("blur")) {
        userMessage = "Image quality too low. Please ensure the document is well-lit, in focus, and fill the frame.";
      } else if (errMsg.includes("text") || errMsg.includes("extract")) {
        userMessage = "No readable text found. Try capturing the document from a closer distance with good lighting.";
      }
      
      toast.error(userMessage, { autoClose: 5000 });
      console.error("OCR Error:", err);
    } finally {
      setOcrLoading(false);
    }
  };

  // Normalize various date formats to YYYY-MM-DD for <input type="date" />
  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return "";
    const s = dateStr.trim();
    // Try ISO yyyy-mm-dd
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    // Try dd/mm/yyyy
    const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      const dd = dmy[1].padStart(2, "0");
      const mm = dmy[2].padStart(2, "0");
      return `${dmy[3]}-${mm}-${dd}`;
    }
    // Try formats like '25 Nov 2025' or '25 November 2025' or '25-Nov-2025'
    const textDate = new Date(s);
    if (!isNaN(textDate.getTime())) {
      const y = textDate.getFullYear();
      const m = String(textDate.getMonth() + 1).padStart(2, "0");
      const d = String(textDate.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return "";
  };

  const parseAndFillForm = (text: string) => {
    // Normalize text
    const raw = text || "";
    const ltext = raw.toLowerCase();

    // ============ Date Extraction (FIRST - before DV extraction to avoid conflicts) ============
    let dateStr = "";
    // Order matters: Check MM/DD/YYYY first (most common in Philippine documents)
    const datePatterns = [
      /(\d{2}\/\d{2}\/\d{4})/, // 03/20/2026 (MM/DD/YYYY) - Philippine format, TRY FIRST
      /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/, // 20 March 2026
      /(\d{1,2}[-\s][A-Za-z]{3,9}[-\s]\d{4})/, // 20-March-2026 or 20 Mar 2026
      /(\d{4}-\d{2}-\d{2})/, // 2026-03-20 (only if valid month/day, not DV number)
    ];
    
    for (const p of datePatterns) {
      const m = raw.match(p);
      if (m) {
        const extracted = m[1];
        
        // For YYYY-MM-DD format, validate that it's a real date (month 01-12, day 01-31)
        // This prevents matching DV numbers like "2025-18-0812" which have invalid months
        if (p.source === '(\\d{4}-\\d{2}-\\d{2})') {
          const parts = extracted.split('-');
          const month = parseInt(parts[1], 10);
          const day = parseInt(parts[2], 10);
          // Skip if month > 12 or day > 31 (invalid date)
          if (month > 12 || day > 31) {
            continue;
          }
        }
        
        dateStr = extracted;
        break;
      }
    }
    const normalizedDate = normalizeDate(dateStr);

    // ============ Enhanced DV Number Extraction ============
    // Try multiple patterns for Philippine DV format
    // Explicitly check for "DV" label first, then fall back to number patterns
    // Avoid matching date patterns (YYYY-MM-DD)
    let dvNo = "";
    
    // First: Look for explicit "DV No." pattern
    const dvExplicitMatch = raw.match(/dv[\s:]*no\.?[\s:]*([A-Z0-9-]+)/i);
    if (dvExplicitMatch) {
      dvNo = dvExplicitMatch[1].trim().substring(0, 50);
    } else {
      // Second: Look for DV with specific format (000-0000-00-0000)
      const dvFormatMatch = raw.match(/\b(\d{3}-\d{4}-\d{2}-\d{4})\b/);
      if (dvFormatMatch) {
        dvNo = dvFormatMatch[1].trim().substring(0, 50);
      } else {
        // Third: Look for generic DV number pattern
        const dvNumberMatch = raw.match(/dv\s*(no\.?|number)?[:\s]*([0-9]{3,5}-[0-9]{3,5})/i);
        if (dvNumberMatch) {
          dvNo = dvNumberMatch[2].trim().substring(0, 50);
        } else {
          // Fourth: Look for generic number-dash-number pattern BUT exclude date patterns
          // Only match if it's not the same as the extracted date
          const genericMatch = raw.match(/\b([0-9]{4,5})-([0-9]{3,5})\b/);
          if (genericMatch && genericMatch[0] !== dateStr) {
            dvNo = genericMatch[0].trim().substring(0, 50);
          }
        }
      }
    }

    // ============ Enhanced Amount Detection (Philippine Peso Format) ============
    // Supports various formats: ₱1,234.50, ₱1234.5, Amount: 1234, $5000.25, etc.
    const amountMatch = 
      raw.match(/₱\s*([\d,]+(?:\.\d{1,2})?)/) ||
      raw.match(/(?:amount|total)[:\s]*(?:₱\s*)?([\d,]+(?:\.\d{1,2})?)/i) ||
      raw.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:pesos?|php)/i) ||
      raw.match(/(?:p\.?|\$)\s*([\d,]+(?:\.\d{1,2})?)/i);
    
    const amount = amountMatch 
      ? amountMatch[1].replace(/,/g, "")
      : "";

    // ============ Payee Extraction ============
    const payeeMatch = raw.match(/(?:payee|received by|recipient)[:\s]*([A-Za-z0-9 .,&'-]{2,80})/i);
    const payee = payeeMatch 
      ? payeeMatch[1].trim().substring(0, 100)
      : "";

    // ============ Office Detection ============
    let office = "";
    if (offices && offices.length) {
      // Find longest matching office name in text
      const candidates = offices.filter((o) => o && ltext.includes(o.toLowerCase()));
      if (candidates.length) {
        candidates.sort((a, b) => b.length - a.length);
        office = candidates[0];
      }
    }

    // ============ Improved Expense Type & Category Detection ============
    let expenseType = "";
    let expenseCategory = "";
    
    // First: Try exact matching of expense types
    if (expenses && expenses.length) {
      const found = expenses.find((e) => {
        if (!e?.type) return false;
        return ltext.includes(e.type.toLowerCase());
      });
      if (found) {
        expenseType = found.type;
        expenseCategory = found.category || "";
      }
    }

    // Second: Try substring/partial matching for expense types (more flexible)
    if (!expenseType && expenses && expenses.length) {
      // For each expense type, check if the text contains significant parts of it
      const candidates = expenses.filter((e) => {
        if (!e?.type) return false;
        const typeWords = e.type.toLowerCase().split(/\s+/);
        // Match if text contains at least one significant word from the expense type
        return typeWords.some(word => word.length > 3 && ltext.includes(word));
      });
      if (candidates.length) {
        // Prefer longer matches
        candidates.sort((a, b) => b.type.length - a.type.length);
        expenseType = candidates[0].type;
        expenseCategory = candidates[0].category || "";
      }
    }

    // ============ Dynamic LGU Keyword Detection (Budget Classification) ============
    // Uses keywords from database/API instead of hardcoding
    if (!expenseCategory && Object.keys(categoryKeywords).length > 0) {
      // Check each category's keywords
      for (const [category, data] of Object.entries(categoryKeywords)) {
        const categoryData = data as any;
        if (categoryData.keywords && Array.isArray(categoryData.keywords)) {
          // Check if any keyword matches (case-insensitive)
          const keywordFound = categoryData.keywords.some((keyword: string) =>
            ltext.includes(keyword.toLowerCase())
          );
          if (keywordFound) {
            expenseCategory = category;
            break;
          }
        }
      }
    }

    // Fallback: detect explicit category tokens (PS, MOOE, CO) if still not found
    if (!expenseCategory) {
      const catMatch = raw.match(/\b(MOOE|PS|CO)\b/i);
      if (catMatch) {
        expenseCategory = catMatch[1].toUpperCase();
      }
    }

    // Update form data with extracted values (preserve previous values if extraction empty)
    setFormData((prev) => ({
      ...prev,
      dvNo: dvNo || prev.dvNo,
      amount: amount || prev.amount,
      payee: payee || prev.payee,
      office: office || prev.office,
      expenseType: expenseType || prev.expenseType,
      expenseCategory: expenseCategory || prev.expenseCategory,
      date: normalizedDate || (prev as any).date || "",
    }));
  };

  const closeScanModal = () => {
    stopCamera();
    setShowScanModal(false);
    setScanMode("camera");
    setOcrResult("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ====== Load Disbursements ======
  useEffect(() => {
    async function loadDisbursements() {
      try {
        const res = await fetch("/api/disbursement");
        const data = await res.json();
        setDisbursements(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadDisbursements();
  }, []);

  // ====== Auto-fill category when expenseType changes ======
  useEffect(() => {
    const match = expenses.find((e) => e.type === formData.expenseType);
    if (match && formData.expenseCategory !== match.category) {
      setFormData((prev) => ({ ...prev, expenseCategory: match.category }));
    }
  }, [formData.expenseType, expenses]);

  // When category changes, clear expenseType if it doesn't belong to the category
  useEffect(() => {
    if (!formData.expenseCategory) return;
    const typesForCategory = expenses.filter((e) => e.category === formData.expenseCategory).map((e) => e.type);
    if (formData.expenseType && !typesForCategory.includes(formData.expenseType)) {
      setFormData((prev) => ({ ...prev, expenseType: "" }));
    }
  }, [formData.expenseCategory, expenses]);

  // ====== Remaining Budget Calculation ======
  const remainingBudget = useMemo(() => {
    if (!formData.office || !formData.expenseCategory) return "";

    const budget = budgets.find(
      (b) => b.office?.toLowerCase() === formData.office.toLowerCase()
    );
    if (!budget) return "Not budgeted yet";

    const category = formData.expenseCategory.toLowerCase();
    let budgetAmount = 0;
    if (category === "ps") budgetAmount = parseFloat(budget.ps) || 0;
    else if (category === "mooe") budgetAmount = parseFloat(budget.mooe) || 0;
    else if (category === "co") budgetAmount = parseFloat(budget.co) || 0;

    const disbursed = disbursements
      .filter(
        (d) =>
          d.office?.toLowerCase() === formData.office.toLowerCase() &&
          d.expenseCategory.toLowerCase() === category &&
          d.id !== editingId
      )
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    const typedAmount = parseFloat(formData.amount) || 0;

    return `₱${(budgetAmount - disbursed - typedAmount).toLocaleString()}`;
  }, [formData.office, formData.expenseCategory, budgets, disbursements, editingId, formData.amount]);

  // ====== Handlers ======
  const handleAdd = () => {
    setShowModal(true);
    setEditingId(null);
    setFormData({
      dvNo: "",
      payee: "",
      office: "",
      expenseType: "",
      expenseCategory: "",
      amount: "",
      date: "",
    });
  };
// ====== Budget Validation (before review modal) ======
const isBudgetEnough = () => {
  if (!formData.office || !formData.expenseCategory || !formData.amount) return true;

  const budget = budgets.find(
    (b) => b.office?.toLowerCase() === formData.office.toLowerCase()
  );

  if (!budget) {
    toast.error("No budget found for this office!");
    return false;
  }

  const category = formData.expenseCategory.toLowerCase();
  let budgetAmount = 0;

  if (category === "ps") budgetAmount = parseFloat(budget.ps) || 0;
  else if (category === "mooe") budgetAmount = parseFloat(budget.mooe) || 0;
  else if (category === "co") budgetAmount = parseFloat(budget.co) || 0;

  const disbursedAmount = disbursements
    .filter(
      (d) =>
        d.office?.toLowerCase() === formData.office.toLowerCase() &&
        d.expenseCategory.toLowerCase() === category &&
        d.id !== editingId
    )
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  const newTotal = disbursedAmount + parseFloat(formData.amount);

  if (newTotal > budgetAmount) {
    const remaining = (budgetAmount - disbursedAmount).toLocaleString();
    toast.error(
      `Budget exceeded!\nYou only have ₱${remaining} remaining for ${formData.expenseCategory}.`
    );
    return false;
  }

  return true;
};

  const handleSave = async () => {
    if (!formData.dvNo || !formData.payee || !formData.office || !formData.expenseType || !formData.amount) {
      toast.error("Please fill all required fields");
      return;
    }
    const budget = budgets.find((b) => b.office?.toLowerCase() === formData.office.toLowerCase());
    if (!budget) {
      toast.error("No budget found for this office!");
      return;
    }

    const category = formData.expenseCategory.toLowerCase();
    let budgetAmount = 0;
    if (category === "ps") budgetAmount = parseFloat(budget.ps) || 0;
    else if (category === "mooe") budgetAmount = parseFloat(budget.mooe) || 0;
    else if (category === "co") budgetAmount = parseFloat(budget.co) || 0;

    const disbursedAmount = disbursements
      .filter(
        (d) =>
          d.office?.toLowerCase() === formData.office.toLowerCase() &&
          d.expenseCategory.toLowerCase() === category &&
          d.id !== editingId
      )
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    const newDisburseTotal = disbursedAmount + parseFloat(formData.amount);
    if (newDisburseTotal > budgetAmount) {
      const remaining = (budgetAmount - disbursedAmount).toLocaleString();
      toast.error(`Budget exceeded!\nYou only have ₱${remaining} remaining for ${formData.expenseCategory}.`);
      return;
    }

    const body = editingId
      ? { id: editingId, ...formData, amount: parseFloat(formData.amount) }
      : { ...formData, amount: parseFloat(formData.amount) };

    try {
      const res = await fetch("/api/disbursement", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save disbursement");
      const updated = await res.json();
      setDisbursements((prev) =>
        editingId ? prev.map((d) => (d.id === editingId ? updated : d)) : [updated, ...prev]
      );
      setShowModal(false);
      toast.success(editingId ? "Disbursement updated successfully" : "Disbursement created successfully");
    } catch (err) {
      console.error(err);
      toast.error("Error saving disbursement.");
    }
  };

  const handleEdit = (id: number) => {
    const record = disbursements.find((d) => d.id === id);
    if (!record) return;
    setEditingId(id);
    const recDate = (record as any).date || (record as any).dateCreated || "";
    setFormData({ ...record, date: normalizeDate(String(recDate)) });
    setShowModal(true);
  };

  const openDeleteModal = (id: number, payee: string) => {
    setDeleteId(id);
    setDeletePayee(payee);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch("/api/disbursement", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDisbursements((prev) => prev.filter((d) => d.id !== deleteId));
      setShowDeleteModal(false);
      toast.success("Disbursement deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting disbursement.");
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // ====== Filter & Pagination ======
  const filtered = disbursements.filter((item) => {
    const matchesSearch =
      item.dvNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.payee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOffice = filterOffice ? item.office === filterOffice : true;
    const matchesExpense = filterExpense ? item.expenseType === filterExpense : true;
    const matchesCategory = filterCategory ? item.expenseCategory === filterCategory : true;
    return matchesSearch && matchesOffice && matchesExpense && matchesCategory;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [totalPages]);

  return (
    <div className="w-full p-4 relative">
      {/* === HEADER === */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Disbursement</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search disbursement..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Filters */}
          <select
            value={filterOffice}
            onChange={(e) => {
              setFilterOffice(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Filter by Office</option>
            {offices.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setFilterExpense("");
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Filter by Category</option>
            {[...new Set(expenses.map((e) => e.category))].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterExpense}
            onChange={(e) => {
              setFilterExpense(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Filter by Expense Type</option>
            {expenses
              .filter((ex) => !filterCategory || ex.category === filterCategory)
              .map((e) => (
                <option key={e.type} value={e.type}>{e.type}</option>
              ))}
          </select>

          {/* Record Disbursement Button */}
          <button
            onClick={handleAdd}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
          >
            <Plus className="w-4 h-4 mr-2" /> Record Disbursement
          </button>
        </div>
      </div>
      <hr className="border-gray-300 mb-6" />

      {/* =================== Table =================== */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
        <div className="flex-grow overflow-y-auto relative">
          <table className="min-w-full border-collapse">
            <thead className="text-white border-b bg-cover bg-center" style={{ backgroundImage: "url('/img/blue.jpg')" }}>
              <tr>
                <th className="px-6 py-2 text-left">DV No.</th>
                <th className="px-3 py-2 text-left">Payee</th>
                <th className="px-3 py-2 text-left">Office</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">Date</th>
               </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((d) => (
                  <tr key={d.id} onClick={() => { setSelectedDisbursement(d); setShowDetailsModal(true); }} className="border-b hover:bg-gray-200 cursor-pointer">
                    <td className="px-6 py-3">{d.dvNo}</td>
                    <td className="px-6 py-3">{d.payee}</td>
                    <td className="px-6 py-3">{d.office}</td>
                    <td className="px-6 py-3">{d.expenseType}</td>
                    <td className="px-6 py-3">{d.expenseCategory}</td>
                   <td className="px-6 py-3">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-gray-700 border border-gray-700 font-semibold">
                        ₱{parseFloat(d.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-3">{new Date(d.dateCreated).toLocaleDateString()}</td>
                   
                   </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-gray-500 italic">
                    <div className="flex flex-col items-center justify-center">
                      <img src="/img/disburse.png" alt="No data" className="mb-2 max-w-[200px] h-auto object-contain" />
                      <span>No disbursement records found.</span>
                    </div>
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - right bottom */}
        <div className="border-t border-gray-200 p-2 bg-gray-50">
          <div className="flex justify-end items-end">
            <nav aria-label="Page navigation">
              <ul className="inline-flex text-sm shadow-md rounded-lg overflow-hidden bg-white">
                <li>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-5 py-2 border-r border-gray-200 font-semibold text-gray-600 bg-white transition-all ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-50 hover:text-blue-600"}`}
                  >
                    Prev
                  </button>
                </li>
                <li>
                  <span className="px-5 py-2 font-bold text-blue-700 bg-white text-lg border-r border-gray-200 select-none">
                    {currentPage}
                  </span>
                </li>
                <li>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-5 py-2 font-semibold text-gray-600 bg-white transition-all ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-50 hover:text-blue-600"}`}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* =================== Floating Scan Button =================== */}
      <FloatingScanButton
        onClick={() => {
          setShowScanModal(true);
          setScanMode("camera");
        }}
      />

{/* =================== Add/Edit Disbursement Modal =================== */}
{showModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-black/20 pointer-events-auto"
      onClick={() => setShowModal(false)}
    ></div>

    {/* Modal */}
    <div
      className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden z-10 pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1E3358]">
        <div className="flex items-center gap-2">
          <div className="bg-white p-2 rounded-full">
            {editingId ? <Edit size={18} className="text-blue-600" /> : <Plus size={18} className="text-blue-600" />}
          </div>
          <h2 className="text-white text-lg font-semibold">
            {editingId ? "Edit Disbursement" : "Record Disbursement"}
          </h2>
        </div>
        <button
          onClick={() => setShowModal(false)}
          className="text-white hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* DV No + Date Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* DV No */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 mb-1">DV No.</label>
            <input
              type="text"
              placeholder="DV No."
              value={formData.dvNo}
              onChange={(e) => setFormData({ ...formData, dvNo: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-700 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-700 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
            />
          </div>
        </div>

        {/* Payee */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 mb-1">Payee</label>
          <input
            type="text"
            placeholder="Payee"
            value={formData.payee}
            onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-700 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition"
          />
        </div>

        {/* Office */}
        <div className="bg-gray-100 rounded-lg p-3">
          <label className="text-xs text-gray-500">Office</label>
          <select
            value={formData.office}
            onChange={(e) => setFormData({ ...formData, office: e.target.value })}
            className="w-full bg-transparent mt-1 outline-none font-semibold text-gray-700"
          >
            <option value="">Select Office</option>
            {offices.filter(o => budgets.some(b => b.office === o)).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        {/* Category (select first) */}
        <div className="bg-gray-100 rounded-lg p-3">
          <label className="text-xs text-gray-500">Category</label>
          <select
            value={formData.expenseCategory}
            onChange={(e) => setFormData({ ...formData, expenseCategory: e.target.value, expenseType: "" })}
            className="w-full bg-transparent mt-1 outline-none font-semibold text-gray-700"
          >
            <option value="">Select Category</option>
            {[...new Set(expenses.map((e) => e.category))].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Expense Type (filtered by category) */}
        <div className="bg-gray-100 rounded-lg p-3">
          <label className="text-xs text-gray-500">Expense Type</label>
          <select
            value={formData.expenseType}
            onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
            className="w-full bg-transparent mt-1 outline-none font-semibold text-gray-700"
            disabled={!formData.expenseCategory}
          >
            <option value="">{formData.expenseCategory ? "Select Type" : "Select Category first"}</option>
            {expenses
              .filter((ex) => !formData.expenseCategory || ex.category === formData.expenseCategory)
              .map((ex) => (
                <option key={ex.type} value={ex.type}>{ex.type}</option>
              ))}
          </select>
        </div>

        {/* Remaining Budget */}
        <div className="bg-gray-100 rounded-lg p-3">
          <label className="text-xs text-gray-500">Remaining Budget</label>
          <input
            type="text"
            value={remainingBudget}
            readOnly
            className="w-full bg-gray-200 mt-1 outline-none font-semibold text-gray-700"
          />
        </div>

        {/* Amount */}
        <div className="bg-gray-100 rounded-lg p-3">
          <label className="text-xs text-gray-500">Amount</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full bg-transparent mt-1 outline-none font-semibold text-gray-700"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-4 py-3 bg-gray-50 border-t">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Cancel
        </button>
<button
  onClick={() => {
    // Required fields check first
    if (!formData.dvNo || !formData.payee || !formData.office || !formData.expenseType || !formData.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    // 🔥 Budget validation BEFORE saving
    if (!isBudgetEnough()) return;

    // ✅ Save directly if valid
    handleSave();
  }}
  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
>
  {editingId ? "Save Changes" : "Save"}
</button>

      </div>
    </div>
  </div>
)}

{/* 🟦 Disbursement Details Panel - Enhanced Modern UI */}
{showDetailsModal && selectedDisbursement && (
  <div className="fixed inset-0 z-50 flex">
    {/* Overlay with blur effect */}
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300"
      onClick={() => setShowDetailsModal(false)}
    ></div>

    {/* Right-side Sliding Panel */}
    <aside
      className="ml-auto w-full sm:w-[600px] h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl overflow-hidden z-10 flex flex-col animate-slide-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with gradient accent */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold tracking-tight">Disbursement Details</h2>
              <p className="text-blue-100 text-sm mt-0.5">View and manage disbursement information</p>
            </div>
          </div>
          <button
            onClick={() => setShowDetailsModal(false)}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Body with enhanced design */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">

        {/* DV No Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Disbursement Voucher Number
              </p>
              <h3 className="text-white text-2xl font-bold leading-tight">
                {selectedDisbursement.dvNo}
              </h3>
            </div>
          </div>
        </div>

        {/* Payee Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-purple-500/20 p-3 rounded-xl">
              <User className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Payee / Recipient
              </p>
              <h3 className="text-white text-xl font-bold leading-tight">
                {selectedDisbursement.payee}
              </h3>
            </div>
          </div>
        </div>

        {/* Office Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-green-500/20 p-3 rounded-xl">
              <Building2 className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-green-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Office
              </p>
              <h3 className="text-white text-xl font-bold leading-tight">
                {selectedDisbursement.office}
              </h3>
            </div>
          </div>
        </div>

        {/* Expense Details Section */}
        <div className="space-y-3">
          

          {/* Category Card */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500/20 p-2 rounded-lg">
                  <FolderOpen className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-yellow-300 text-xs font-semibold uppercase tracking-wider">
                    Category
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-lg font-bold">
                  {selectedDisbursement.expenseCategory}
                </p>
              </div>
            </div>
          </div>

          {/* Expense Type Card */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 p-2 rounded-lg">
                  <CreditCard className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-orange-300 text-xs font-semibold uppercase tracking-wider">
                    Expense Type
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-lg font-bold">
                  {selectedDisbursement.expenseType}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30 p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/30 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-green-300 text-xs font-semibold uppercase tracking-wider">
                  Amount Disbursed
                </p>
                <p className="text-gray-300 text-xs">Total amount released</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white text-3xl font-bold">
                {formatCurrency(parseFloat(selectedDisbursement.amount))}
              </p>
            </div>
          </div>
        </div>

        {/* Date Created Card */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Date 
              </p>
              <div className="space-y-2">
                <p className="text-white font-medium">
                  {new Date(selectedDisbursement.dateCreated).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  
                
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Timestamp Card */}
       

        {/* Disbursement ID */}
      
      </div>

      {/* Footer with enhanced buttons */}
      <div className="flex justify-end gap-3 px-6 py-5 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <button
          onClick={() => setShowDetailsModal(false)}
          className="px-5 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200 font-semibold text-sm flex items-center gap-2"
        >
          <X size={16} />
          Close
        </button>

   
      </div>
    </aside>
  </div>
)}


      {/* =================== Delete Modal =================== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black opacity-30 pointer-events-auto"></div>
          <div className="bg-white rounded-lg shadow-lg w-96 p-6 z-10 pointer-events-auto">
            <h2 className="text-lg font-semibold mb-3 text-center text-red-600">
              Confirm Delete
            </h2>
            <p className="text-gray-700 text-center mb-5">
              Are you sure you want to delete the disbursement for{" "}
              <span className="font-semibold">{deletePayee}</span>?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-md border bg-gray-200 border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== OCR Scanner Modal =================== */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-100 border-b p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Disbursement Document Scanner</h2>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                  isOnlineMode 
                    ? "bg-green-100 text-green-800" 
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {isOnlineMode ? (
                    <>
                      <Wifi className="w-4 h-4" /> Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4" /> Offline
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={closeScanModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Mode Selection */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setScanMode("camera")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                    scanMode === "camera"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <Camera className="w-5 h-5" /> Camera
                </button>
                <button
                  onClick={() => setScanMode("upload")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                    scanMode === "upload"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <Upload className="w-5 h-5" /> Upload
                </button>
              </div>

                     {/* Camera Mode */}
{scanMode === "camera" && (
  <div className="space-y-3">
    {/* Video Preview with Document Crop Guide */}
    <div className="relative w-full bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        controlsList="nopictureinpicture"
        className={`w-full max-h-96 bg-black rounded-lg object-cover mb-2 transition-opacity ${
          cameraActive ? "opacity-100" : "opacity-0"
        }`}
      />
      
      {/* Enhanced Document Capture Guide */}
      {cameraActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Darkened areas outside the guide */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Document frame with rounded corners and glow effect */}
          <div className="relative">
            {/* Outer glow effect */}
            <div className="absolute inset-0 rounded-2xl shadow-[0_0_0_2px_rgba(255,255,255,0.8),0_0_0_4px_rgba(0,120,255,0.5)] animate-pulse" />
            
            {/* Main document frame */}
            <div className="border-4 border-white rounded-2xl w-80 h-96 relative">
              {/* Corner markers for alignment */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white" />
              
              {/* Center guide text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <p className="text-white text-sm font-semibold">Align document here</p>
                  <p className="text-white/70 text-xs text-center">Fill frame for best results</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {!cameraActive ? (
      <button
        onClick={startCamera}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
      >
        <Camera className="w-5 h-5" /> Start Camera
      </button>
    ) : (
      <div>
    {/* Zoom Control */}
    {scanMode === "camera" && cameraActive && (
      <div className="space-y-3">
        {/* Zoom Slider */}
        <div className="flex items-center gap-3 px-2">
          <span className="text-sm text-gray-600">Zoom:</span>
          <input
            type="range"
            min="1"
            max="4"
            step="0.1"
            value={zoomLevel}
            onChange={async (e) => {
              const newZoom = parseFloat(e.target.value);
              setZoomLevel(newZoom);
              if (stream) {
                const track = stream.getVideoTracks()[0];
                try {
                  await track.applyConstraints({
                    advanced: [{ zoom: newZoom } as any]
                  });
                } catch (err) {
                  console.warn("Zoom not supported:", err);
                }
              }
            }}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-semibold text-blue-600 min-w-[40px]">
            {zoomLevel.toFixed(1)}x
          </span>
        </div>
        
        {/* Capture and Cancel Buttons */}
        <button
          onClick={capturePhoto}
          disabled={ocrLoading}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {ocrLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" /> Capture Photo
            </>
          )}
        </button>
        <button
          onClick={stopCamera}
          className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold"
        >
          Cancel
        </button>
      </div>
    )}
      </div>
    )}
  </div>
)}



              {/* Upload Mode */}
              {scanMode === "upload" && (
                <div className="space-y-3">
                  <label className="block">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="font-semibold text-gray-700">Click to upload image</p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {ocrLoading && (
                    <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold py-4">
                      <Loader className="w-5 h-5 animate-spin" /> Processing image...
                    </div>
                  )}
                </div>
              )}

              {/* OCR Result Display */}
              {ocrResult && (
                <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-800">Extracted Data</h3>
                  <div className="max-h-32 overflow-y-auto bg-white p-3 border rounded text-sm text-gray-700 font-mono whitespace-pre-wrap">
                    {ocrResult}
                  </div>
                </div>
              )}

              {/* Extracted Form Fields */}
              {ocrResult && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-800">Auto-filled Fields</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {formData.dvNo && (
                      <p>
                        <span className="font-semibold">DV No.:</span> {formData.dvNo}
                      </p>
                    )}
                    {formData.payee && (
                      <p>
                        <span className="font-semibold">Payee:</span> {formData.payee}
                      </p>
                    )}
                    {formData.office && (
                      <p>
                        <span className="font-semibold">Office:</span> {formData.office}
                      </p>
                    )}
                    {formData.expenseCategory && (
                      <p>
                        <span className="font-semibold">Category:</span> {formData.expenseCategory}
                      </p>
                    )}
                    {formData.expenseType && (
                      <p>
                        <span className="font-semibold">Expense Type:</span> {formData.expenseType}
                      </p>
                    )}
                    {formData.date && (
                      <p>
                        <span className="font-semibold">Date:</span> {formData.date}
                      </p>
                    )}
                    {formData.amount && (
                      <p>
                        <span className="font-semibold">Amount:</span> ₱{parseFloat(formData.amount).toLocaleString()}
                      </p>
                    )}
                    {!formData.dvNo && !formData.payee && !formData.amount && !formData.office && !formData.expenseType && !formData.expenseCategory && !formData.date && (
                      <p className="text-gray-500 italic">
                        No fields extracted. Please review the OCR text above.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => {
                    if (formData.dvNo || formData.payee || formData.amount || formData.office || formData.expenseType || formData.expenseCategory || formData.date) {
                      setShowModal(true);
                      closeScanModal();
                    } else {
                      toast.error("Please extract data first");
                    }
                  }}
                  disabled={!ocrResult || (!formData.dvNo && !formData.payee && !formData.amount && !formData.office && !formData.expenseType && !formData.expenseCategory && !formData.date)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Use Extracted Data
                </button>
                <button
                  onClick={closeScanModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================== Loading Overlay =================== */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-700 font-semibold">Loading data...</p>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}