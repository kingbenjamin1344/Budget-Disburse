"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { Search, Plus, Edit, Trash2, X, ScanEye, Camera, Upload, Loader, Wifi, WifiOff } from "lucide-react";
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

  // ====== OCR Scanner States ======
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "upload">("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState("");
  const [isOnlineMode, setIsOnlineMode] = useState(true);
  const [ocrAvailable, setOcrAvailable] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);


  // ====== Fetch Offices, Expenses, Budgets & Check Network Status ======
  useEffect(() => {
    async function loadData() {
      try {
        const [officeRes, expenseRes, budgetRes] = await Promise.all([
          fetch("/api/offices"),
          fetch("/api/expenses"),
          fetch("/api/addbudget"),
        ]);
        const officeData = await officeRes.json();
        const expenseData = await expenseRes.json();
        const budgetData = await budgetRes.json();

        setOffices(officeData.map((o: any) => o.name));
        setExpenses(expenseData.map((e: any) => ({ type: e.type, category: e.category })));
        setBudgets(budgetData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
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
const startCamera = async () => {
  try {
    let stream;

    // Try back camera first (mobile)
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch {
      // Fallback to ANY camera
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    }

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);
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
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      
      const imageData = canvasRef.current.toDataURL("image/jpeg");
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
      // Initialize worker if not already done
      await initTesseractWorker();

      // First pass: Standard PSM mode for general document layout
      const result1 = await performOCR(imageData, { psm: 6 });
      
      // Second pass: Uniform block mode for better text extraction
      const result2 = await performOCR(imageData, { psm: 11 });
      
      // Combine text from both passes for more complete extraction
      const combinedText = result1.text + "\n" + result2.text;
      const avgConfidence = (result1.confidence + result2.confidence) / 2;
      
      setOcrResult(combinedText);
      
      // Check OCR confidence quality
      if (avgConfidence < 60) {
        toast.warning(`⚠️ Low OCR confidence (${avgConfidence.toFixed(0)}%). Please review extracted data carefully.`, {
          autoClose: 4000,
        });
      } else if (avgConfidence >= 80) {
        toast.info(`✓ High confidence OCR (${avgConfidence.toFixed(0)}%)`, {
          autoClose: 2000,
        });
      }
      
      // Parse disbursement data from combined OCR text
      parseAndFillForm(combinedText);
      
      // Show appropriate success message
      if (isOnlineMode) {
        toast.success("OCR completed successfully (Online mode)");
      } else {
        toast.success("OCR completed successfully (Offline mode)");
      }
    } catch (err) {
      const errMsg = String(err);
      let userMessage = "OCR failed. Please try again.";
      
      if (!isOnlineMode) {
        userMessage = "Offline mode: Language data may need to be downloaded while online first.";
      } else if (errMsg.includes("fetch") || errMsg.includes("network")) {
        userMessage = "Network error. Please check your connection and try again.";
      }
      
      toast.error(userMessage);
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

    // ============ Enhanced DV Number Extraction ============
    // Try multiple patterns for Philippine DV format
    const dvMatch = 
      raw.match(/dv[\s:]*no\.?[\s:]*([A-Z0-9-]+)/i) || 
      raw.match(/\b\d{4,}-\d{3,}\b/) ||
      raw.match(/dv\s*(no\.?|number)?[:\s]*([0-9]{3,5}-[0-9]{3,5})/i);
    
    const dvNo = dvMatch 
      ? (dvMatch[1] || dvMatch[0]).trim().substring(0, 50) 
      : "";

    // ============ Enhanced Amount Detection (Philippine Peso Format) ============
    const amountMatch = 
      raw.match(/₱\s*([\d,]+\.?\d{0,2})/) ||
      raw.match(/(?:amount|total)[:\s]*(?:₱\s*)?([\d,]+\.\d{2})/i) ||
      raw.match(/([\d,]+\.\d{2})\s*(?:pesos?|php)/i) ||
      raw.match(/(?:p\.?|\$)\s*([\d,]+\.?\d*)/i);
    
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

    // ============ Expense Type & Category Detection ============
    let expenseType = "";
    let expenseCategory = "";
    
    // First try matching against known expense types
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

    // ============ LGU Keyword Detection (Budget Classification) ============
    // Smart keyword detection for LGU disbursement system
    if (!expenseCategory) {
      if (ltext.includes("maintenance") || ltext.includes("repairs") || ltext.includes("utilities")) {
        expenseCategory = "MOOE";
      } else if (
        ltext.includes("personal services") ||
        ltext.includes("salary") ||
        ltext.includes("honorarium") ||
        ltext.includes("compensation")
      ) {
        expenseCategory = "PS";
      } else if (
        ltext.includes("capital outlay") ||
        ltext.includes("equipment") ||
        ltext.includes("construction") ||
        ltext.includes("purchase") ||
        ltext.includes("asset")
      ) {
        expenseCategory = "CO";
      }
    }

    // Fallback: detect explicit category tokens (PS, MOOE, CO)
    if (!expenseCategory) {
      const catMatch = raw.match(/\b(MOOE|PS|CO)\b/i);
      if (catMatch) {
        expenseCategory = catMatch[1].toUpperCase();
      }
    }

    // ============ Date Extraction ============
    let dateStr = "";
    const datePatterns = [
      /(\d{4}-\d{2}-\d{2})/, // 2025-11-25
      /(\d{2}\/\d{2}\/\d{4})/, // 25/11/2025
      /(\d{1,2}[-\s][A-Za-z]{3,9}[-\s]\d{4})/, // 25 Nov 2025
      /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/, // 25 November 2025
    ];
    for (const p of datePatterns) {
      const m = raw.match(p);
      if (m) {
        dateStr = m[1];
        break;
      }
    }
    const normalizedDate = normalizeDate(dateStr);

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
      (b) => b.office.toLowerCase() === formData.office.toLowerCase()
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
          d.office.toLowerCase() === formData.office.toLowerCase() &&
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
    (b) => b.office.toLowerCase() === formData.office.toLowerCase()
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
        d.office.toLowerCase() === formData.office.toLowerCase() &&
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
    const budget = budgets.find((b) => b.office.toLowerCase() === formData.office.toLowerCase());
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
          d.office.toLowerCase() === formData.office.toLowerCase() &&
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
            {offices.map((o) => (
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

    // 🔥 Budget validation BEFORE review modal
    if (!isBudgetEnough()) return;

    // ✅ Open review modal only if valid
    setShowReviewModal(true);
  }}
  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
>
  {editingId ? "Save Changes" : "Save"}
</button>

      </div>
    </div>
  </div>
)}

{showReviewModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-black/30"
      onClick={() => setShowReviewModal(false)}
    ></div>

    {/* Modal */}
    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg z-10">
      {/* Header */}
      <div className="px-6 py-4 bg-[#1E3358] flex justify-between items-center">
        <h2 className="text-white text-xl font-bold">
          Review Disbursement Details
        </h2>
        <button
          onClick={() => setShowReviewModal(false)}
          className="text-white"
        >
          <X size={22} />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4 text-gray-800">
        <div className="text-center">
          <p className="text-sm text-gray-500">DV No.</p>
          <p className="font-bold text-lg">{formData.dvNo}</p>
        </div>

        <hr />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Payee</p>
            <p className="font-semibold">{formData.payee}</p>
          </div>

          <div>
            <p className="text-gray-500">Office</p>
            <p className="font-semibold">{formData.office}</p>
          </div>

          <div>
            <p className="text-gray-500">Category</p>
            <p className="font-semibold">{formData.expenseCategory}</p>
          </div>

          <div>
            <p className="text-gray-500">Expense Type</p>
            <p className="font-semibold">{formData.expenseType}</p>
          </div>

          <div>
            <p className="text-gray-500">Amount</p>
            <p className="font-bold text-green-600">
              ₱{parseFloat(formData.amount || "0").toLocaleString()}
            </p>
          </div>

          {formData.date && (
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-semibold">{formData.date}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
        <button
          onClick={() => setShowReviewModal(false)}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={() => {
            setShowReviewModal(false);
            handleSave(); // ✅ original save logic
          }}
          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          Confirm & Save
        </button>
      </div>
    </div>
  </div>
)}

{/* 🟦 Disbursement Details Panel */}
{showDetailsModal && selectedDisbursement && (
  <div className="fixed inset-0 z-50 flex">
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setShowDetailsModal(false)}
    ></div>

    {/* Right-side Sliding Panel */}
    <aside
      className="ml-auto w-full sm:w-[520px] h-full bg-[#0F2544] shadow-xl overflow-hidden z-10 flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
        <h2 className="text-white text-2xl font-bold">Disbursement Details</h2>
        <button
          onClick={() => setShowDetailsModal(false)}
          className="text-white hover:text-gray-300"
        >
          <X size={24} />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6 text-white flex-1 overflow-y-auto">

        {/* DV No */}
        <div className="text-center">
          <div className="text-sm text-blue-200 uppercase tracking-wide">
            DV No.
          </div>
          <div className="text-2xl font-bold mt-1">
            {selectedDisbursement.dvNo}
          </div>
        </div>

        <hr className="border-white/20" />

        {/* Payee */}
        <div className="text-center">
          <div className="text-sm text-blue-200 uppercase tracking-wide">
            Payee
          </div>
          <div className="text-2xl font-bold mt-1">
            {selectedDisbursement.payee}
          </div>
        </div>

        <hr className="border-white/20" />

        {/* Office */}
        <div className="text-center">
          <div className="text-sm text-blue-200 uppercase tracking-wide">
            Office
          </div>
          <div className="text-2xl font-bold mt-1">
            {selectedDisbursement.office}
          </div>
        </div>

        <hr className="border-white/20" />

        {/* Amount */}
        <div className="flex justify-between items-center bg-white/10 rounded-lg p-4">
          <span className="text-lg text-blue-100 font-semibold">
            Amount
          </span>
          <span className="text-2xl font-extrabold">
            ₱{parseFloat(selectedDisbursement.amount).toLocaleString()}
          </span>
        </div>

        <hr className="border-white/20" />

        {/* Category */}
        <div className="flex justify-between items-center">
          <span className="text-blue-200">
            Category
          </span>
          <span className="text-xl font-bold">
            {selectedDisbursement.expenseCategory}
          </span>
        </div>

        {/* Type */}
        <div className="flex justify-between items-center">
          <span className="text-blue-200">
            Type
          </span>
          <span className="text-xl font-bold">
            {selectedDisbursement.expenseType}
          </span>
        </div>

        <hr className="border-white/20" />

        {/* Date */}
        <div className="text-center">
          <div className="text-sm text-blue-200 uppercase tracking-wide">
            Date & Time Created
          </div>
          <div className="font-semibold mt-1">
            {new Date(selectedDisbursement.dateCreated).toLocaleString()}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="mt-auto flex justify-end gap-3 px-6 py-4 border-t border-white/20 bg-[#0F2544]">

        <button
          onClick={() => setShowDetailsModal(false)}
          className="px-5 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 text-lg font-semibold"
        >
          Close
        </button>

        {/*
        <button
          onClick={() => {
            setShowDetailsModal(false);
            handleEdit(selectedDisbursement.id);
          }}
          className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold flex items-center gap-2"
        >
          <Edit size={18} /> Edit
        </button>

        <button
          onClick={() => {
            setShowDetailsModal(false);
            openDeleteModal(selectedDisbursement.id, selectedDisbursement.payee);
          }}
          className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-lg font-semibold flex items-center gap-2"
        >
          <Trash2 size={18} /> Delete
        </button>
        */}
      </div>
    </aside>
  </div>
)}








      {/* =================== Delete Modal =================== 
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
      */}

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
      
      {/* Document Crop Guide Overlay - Visible when camera is active */}
      {cameraActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Darkened areas outside the guide */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* White border rectangle showing capture area */}
          <div className="border-4 border-white rounded-xl w-80 h-96 flex items-center justify-center">
            <div className="text-white text-center text-sm font-semibold drop-shadow-lg">
              <p>📄</p>
              <p>Align document</p>
              <p>with rectangle</p>
            </div>
          </div>
          
          {/* Corner markers for better visibility */}
          <div className="absolute top-1/4 left-1/4 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
          <div className="absolute top-1/4 right-1/4 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
          <div className="absolute bottom-1/4 left-1/4 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
          <div className="absolute bottom-1/4 right-1/4 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
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
      <div className="flex gap-2">
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

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
