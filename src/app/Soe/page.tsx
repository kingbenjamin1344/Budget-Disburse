"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { RotateCcw, Printer, Minimize2, Maximize2, Save } from "lucide-react";
import { toast } from "react-toastify";

// PDF / export libs
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function SoePage() {
  const [isCompressed, setIsCompressed] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveFilename, setSaveFilename] = useState('');
  const [saving, setSaving] = useState(false);
  const [pdfDownloadedModalOpen, setPdfDownloadedModalOpen] = useState(false);

  // Filters
  const [rawBudgetData, setRawBudgetData] = useState<any[]>([]);
  const [rawDisbData, setRawDisbData] = useState<any[]>([]);
  const [officeFilter, setOfficeFilter] = useState('');
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentYear = String(new Date().getFullYear());
  const [monthFilterFrom, setMonthFilterFrom] = useState('');
  const [yearFilterFrom, setYearFilterFrom] = useState('');
  const [monthFilterTo, setMonthFilterTo] = useState('');
  const [yearFilterTo, setYearFilterTo] = useState('');
  const [filterApplied, setFilterApplied] = useState(false);

  // Helper function to format numbers as Philippine Peso
  const formatPeso = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Generate filename based on filters
  const generateFilename = (): string => {
    const monthNames: { [key: string]: string } = {
      '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
      '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
    };

    const filenameparts: string[] = ['SOE'];

    // Add office if filtered
    if (officeFilter && officeFilter.trim()) {
      const officeName = officeFilter.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 15);
      filenameparts.push(officeName);
    }

    // Add date range
    const fromMonth = monthNames[monthFilterFrom] || monthFilterFrom;
    const toMonth = monthNames[monthFilterTo] || monthFilterTo;
    
    if (monthFilterFrom === monthFilterTo && yearFilterFrom === yearFilterTo) {
      filenameparts.push(`${fromMonth}${yearFilterFrom}`);
    } else {
      filenameparts.push(`${fromMonth}${yearFilterFrom}-${toMonth}${yearFilterTo}`);
    }

    return filenameparts.join('_') + '.pdf';
  };

  const toggleCompress = () => {
    const layout = document.getElementById("dashboard-layout");
    const sidebar = document.getElementById("sidebar");
    const navbar = document.getElementById("navbar");
    const mainContent = document.getElementById("main-content");

    if (!layout || !sidebar || !navbar || !mainContent) {
      setIsCompressed((v) => !v);
      return;
    }

    if (!isCompressed) {
      sidebar.style.display = 'none';
      navbar.style.display = 'none';
      mainContent.style.padding = '0';
      layout.style.height = '100vh';
      layout.style.background = '#fff';
      setIsCompressed(true);
    } else {
      sidebar.style.display = '';
      navbar.style.display = '';
      mainContent.style.padding = '';
      layout.style.height = '';
      layout.style.background = '';
      setIsCompressed(false);
    }
  };

  // Helper function to format period covered
  const getPeriodCovered = (): string => {
    if (!filterApplied) {
      return 'All Periods';
    }

    if (!monthFilterFrom || !monthFilterTo || !yearFilterFrom || !yearFilterTo) {
      return 'All Periods';
    }

    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const startMonth = monthNames[parseInt(monthFilterFrom)];
    const endMonth = monthNames[parseInt(monthFilterTo)];
    
    // If same year
    if (yearFilterFrom === yearFilterTo) {
      return `${startMonth} - ${endMonth}, ${yearFilterFrom}`;
    } else {
      // Different years
      return `${startMonth} ${yearFilterFrom} - ${endMonth} ${yearFilterTo}`;
    }
  };

  // Generate a PDF Blob from the SOE data by building a sanitized table (no site CSS)
  const generatePdfBlob = async (): Promise<Blob | null> => {
    try {
      // Create a container for header and table
      const containerEl = document.createElement('div');
      containerEl.style.fontFamily = 'Arial, sans-serif';
      containerEl.style.background = 'white';
      containerEl.style.padding = '20px';
      containerEl.style.width = '100%';

      // Header section
      const headerEl = document.createElement('div');
      headerEl.style.textAlign = 'center';
      headerEl.style.marginBottom = '20px';
      headerEl.style.fontFamily = 'Arial, sans-serif';

      const titleEl = document.createElement('h2');
      titleEl.textContent = 'STATEMENT OF EXPENDITURE';
      titleEl.style.margin = '0 0 8px 0';
      titleEl.style.fontSize = '16px';
      titleEl.style.fontWeight = 'bold';
      titleEl.style.letterSpacing = '1px';
      headerEl.appendChild(titleEl);

      const municipalityEl = document.createElement('p');
      municipalityEl.textContent = 'Municipality: Magallanes, Agusan del Norte';
      municipalityEl.style.margin = '0 0 5px 0';
      municipalityEl.style.fontSize = '12px';
      municipalityEl.style.fontWeight = '600';
      headerEl.appendChild(municipalityEl);

      const periodEl = document.createElement('p');
      periodEl.textContent = 'Period Covered: ' + getPeriodCovered();
      periodEl.style.margin = '0';
      periodEl.style.fontSize = '12px';
      periodEl.style.fontWeight = '600';
      headerEl.appendChild(periodEl);

      containerEl.appendChild(headerEl);

      // Divider line
      const divider = document.createElement('hr');
      divider.style.margin = '15px 0';
      divider.style.border = 'none';
      divider.style.borderTop = '2px solid #000';
      containerEl.appendChild(divider);

      // Table element
      const tableEl = document.createElement('table');
      tableEl.style.borderCollapse = 'collapse';
      tableEl.style.width = '100%';
      tableEl.style.fontFamily = 'Arial, sans-serif';
      tableEl.style.fontSize = '11px';

      // Create header rows with colspan for main sections
      const thead = document.createElement('thead');
      
      // First header row - Main sections
      const headerRow1 = document.createElement('tr');
      headerRow1.style.border = '1px solid #000';
      
      const th1 = document.createElement('th');
      th1.textContent = 'Particulars';
      th1.style.border = '1px solid #000';
      th1.style.padding = '8px';
      th1.style.background = '#f5f5f5';
      th1.style.fontWeight = '700';
      th1.style.textAlign = 'center';
      th1.rowSpan = 2;
      headerRow1.appendChild(th1);

      // Budget Appropriation
      const budgetHeader = document.createElement('th');
      budgetHeader.textContent = 'BUDGET APPROPRIATION';
      budgetHeader.colSpan = 4;
      budgetHeader.style.border = '1px solid #000';
      budgetHeader.style.padding = '8px';
      budgetHeader.style.background = '#4B5DBF';
      budgetHeader.style.color = 'white';
      budgetHeader.style.fontWeight = '700';
      budgetHeader.style.textAlign = 'center';
      headerRow1.appendChild(budgetHeader);

      // Actual Expenditure
      const actualHeader = document.createElement('th');
      actualHeader.textContent = 'ACTUAL EXPENDITURE';
      actualHeader.colSpan = 4;
      actualHeader.style.border = '1px solid #000';
      actualHeader.style.padding = '8px';
      actualHeader.style.background = '#4B5DBAF';
      actualHeader.style.color = 'white';
      actualHeader.style.fontWeight = '700';
      actualHeader.style.textAlign = 'center';
      headerRow1.appendChild(actualHeader);

      // Variance
      const varianceHeader = document.createElement('th');
      varianceHeader.textContent = 'VARIANCE';
      varianceHeader.colSpan = 4;
      varianceHeader.style.border = '1px solid #000';
      varianceHeader.style.padding = '8px';
      varianceHeader.style.background = '#4B5DBAF';
      varianceHeader.style.color = 'white';
      varianceHeader.style.fontWeight = '700';
      varianceHeader.style.textAlign = 'center';
      headerRow1.appendChild(varianceHeader);

      thead.appendChild(headerRow1);

      // Second header row - Sub-columns (PS, MOOE, CO, Total) x 3
      const headerRow2 = document.createElement('tr');
      const subHeaders = ['PS', 'MOOE', 'CO', 'Total'];
      for (let i = 0; i < 3; i++) {
        for (const sub of subHeaders) {
          const th = document.createElement('th');
          th.textContent = sub;
          th.style.border = '1px solid #000';
          th.style.padding = '6px';
          th.style.background = '#e0e0e0';
          th.style.fontWeight = '600';
          th.style.textAlign = 'center';
          th.style.fontSize = '10px';
          headerRow2.appendChild(th);
        }
      }
      thead.appendChild(headerRow2);
      tableEl.appendChild(thead);

      // Table body
      const tbody = document.createElement('tbody');
      for (const row of data) {
        const tr = document.createElement('tr');

        // Particulars (left-aligned)
        const tdParticular = document.createElement('td');
        tdParticular.textContent = row.office;
        tdParticular.style.border = '1px solid #ccc';
        tdParticular.style.padding = '6px 8px';
        tdParticular.style.textAlign = 'left';
        tdParticular.style.fontWeight = '500';
        tr.appendChild(tdParticular);

        // Budget Appropriation cells
        const budgetValues = [row.budget.ps, row.budget.mooe, row.budget.co, row.budget.total];
        for (const val of budgetValues) {
          const td = document.createElement('td');
          td.textContent = formatPeso(val);
          td.style.border = '1px solid #ccc';
          td.style.padding = '6px 4px';
          td.style.textAlign = 'right';
          tr.appendChild(td);
        }

        // Actual Expenditure cells
        const actualValues = [row.actual.ps, row.actual.mooe, row.actual.co, row.actual.total];
        for (const val of actualValues) {
          const td = document.createElement('td');
          td.textContent = formatPeso(val);
          td.style.border = '1px solid #ccc';
          td.style.padding = '6px 4px';
          td.style.textAlign = 'right';
          tr.appendChild(td);
        }

        // Variance cells
        const varianceValues = [row.variance.ps, row.variance.mooe, row.variance.co, row.variance.total];
        for (const val of varianceValues) {
          const td = document.createElement('td');
          td.textContent = formatPeso(val);
          td.style.border = '1px solid #ccc';
          td.style.padding = '6px 4px';
          td.style.textAlign = 'right';
          tr.appendChild(td);
        }

        tbody.appendChild(tr);
      }

      // Totals row
      const totalsRow = document.createElement('tr');
      totalsRow.style.fontWeight = '700';
      totalsRow.style.backgroundColor = '#d4d4d4';

      const tdTotalLabel = document.createElement('td');
      tdTotalLabel.textContent = 'OVERALL TOTAL';
      tdTotalLabel.style.border = '1px solid #000';
      tdTotalLabel.style.padding = '8px';
      tdTotalLabel.style.textAlign = 'left';
      tdTotalLabel.style.fontWeight = 'bold';
      totalsRow.appendChild(tdTotalLabel);

      // Budget total values
      const budgetTotals = [
        data.reduce((sum, r) => sum + r.budget.ps, 0),
        data.reduce((sum, r) => sum + r.budget.mooe, 0),
        data.reduce((sum, r) => sum + r.budget.co, 0),
        data.reduce((sum, r) => sum + r.budget.total, 0),
      ];
      for (const val of budgetTotals) {
        const td = document.createElement('td');
        td.textContent = formatPeso(val);
        td.style.border = '1px solid #000';
        td.style.padding = '6px 4px';
        td.style.textAlign = 'right';
        td.style.fontWeight = '700';
        totalsRow.appendChild(td);
      }

      // Actual total values
      const actualTotals = [
        data.reduce((sum, r) => sum + r.actual.ps, 0),
        data.reduce((sum, r) => sum + r.actual.mooe, 0),
        data.reduce((sum, r) => sum + r.actual.co, 0),
        data.reduce((sum, r) => sum + r.actual.total, 0),
      ];
      for (const val of actualTotals) {
        const td = document.createElement('td');
        td.textContent = formatPeso(val);
        td.style.border = '1px solid #000';
        td.style.padding = '6px 4px';
        td.style.textAlign = 'right';
        td.style.fontWeight = '700';
        totalsRow.appendChild(td);
      }

      // Variance total values
      const varianceTotals = [
        data.reduce((sum, r) => sum + r.variance.ps, 0),
        data.reduce((sum, r) => sum + r.variance.mooe, 0),
        data.reduce((sum, r) => sum + r.variance.co, 0),
        data.reduce((sum, r) => sum + r.variance.total, 0),
      ];
      for (const val of varianceTotals) {
        const td = document.createElement('td');
        td.textContent = formatPeso(val);
        td.style.border = '1px solid #000';
        td.style.padding = '6px 4px';
        td.style.textAlign = 'right';
        td.style.fontWeight = '700';
        totalsRow.appendChild(td);
      }

      tbody.appendChild(totalsRow);
      tableEl.appendChild(tbody);

      containerEl.appendChild(tableEl);

      // Render off-screen
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-99999px';
      wrapper.style.top = '0';
      wrapper.style.pointerEvents = 'none';
      wrapper.appendChild(containerEl);
      document.body.appendChild(wrapper);

      const canvas = await html2canvas(containerEl as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      // Use landscape orientation for better data visibility
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
        compress: true
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgProps = (pdf as any).getImageProperties(imgData);
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      let remainingHeight = imgHeight - pageHeight;
      while (remainingHeight > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
      }

      const blob = pdf.output('blob');

      // cleanup
      try {
        if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      } catch (e) {
        /* ignore */
      }

      return blob;
    } catch (err) {
      console.error('PDF generation error', err);
      return null;
    }
  };

  // Download the PDF file
  const downloadPdf = async (filename?: string) => {
    const blob = await generatePdfBlob();
    if (!blob) return toast.error('Unable to generate PDF') as any;

    const finalFilename = filename || `SOE_${new Date().toISOString().split('T')[0]}.pdf`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    
    // Show success modal
    setPdfDownloadedModalOpen(true);
  };

  // Save PDF using File System Access API when available, otherwise fall back to download
  const savePdfWithFilename = async (filename: string) => {
    setSaving(true);
    try {
      const blob = await generatePdfBlob();
      if (!blob) throw new Error('Unable to generate PDF');

      // If the browser supports the File System Access API
      if ('showSaveFilePicker' in window) {
        try {
          // @ts-ignore
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: 'PDF File',
                accept: { 'application/pdf': ['.pdf'] },
              },
            ],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          
          // Show success modal
          setPdfDownloadedModalOpen(true);

        } catch (err: any) {
           // User canceled save dialog → just stop, do NOT download
           if (err?.name === "AbortError") {
             console.log("User cancelled save dialog. Not saving.");
             return false;
           }
         
           // Other errors (real errors) can still fallback to download
           console.warn("Save failed, using fallback download:", err);
           const url = URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url;
           a.download = filename;
           document.body.appendChild(a);
           a.click();
           a.remove();
           URL.revokeObjectURL(url);
           
           // Show success modal
           setPdfDownloadedModalOpen(true);
          }

      } else {
        // Fallback: standard download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        
        // Show success modal
        setPdfDownloadedModalOpen(true);
      }

      return true;
    } catch (e) {
      console.error('Save PDF error', e);
      toast.error('Failed to save PDF: ' + (e as any)?.message || String(e));
      return false;
    } finally {
      setSaving(false);
    }
  };

  // View PDF in a new tab
  const viewPdf = async () => {
    const blob = await generatePdfBlob();
    if (!blob) return toast.error('Unable to generate PDF') as any;
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Download ZIP containing PDF (requires jszip). If jszip not installed, fallback to PDF download.
  const downloadZipWithPdf = async () => {
    const blob = await generatePdfBlob();
    if (!blob) return toast.error('Unable to generate PDF') as any;

    try {
      const JSZip = (await import('jszip')).default;
      // If TypeScript/IDE complains about missing types, run: npm install jszip
      const zip = new JSZip();
      zip.file('soe.pdf', blob);
      const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'soe.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('JSZip not available — falling back to PDF download', e);
      // fallback
      await downloadPdf('soe.pdf');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [budgetRes, disbRes] = await Promise.all([
          fetch("/api/addbudget"),
          fetch("/api/disbursement"),
        ]);

        const budgetData = await budgetRes.json();
        const disbData = await disbRes.json();

          // keep raw copies for filtering
          setRawBudgetData(budgetData);
          setRawDisbData(disbData);

        const calculateTotals = (office: string, category: string) => {
          if (!office || !category) return 0;
          return disbData
            .filter(
              (d: any) =>
                d.office?.toLowerCase() === office.toLowerCase() &&
                d.expenseCategory?.toLowerCase() === category.toLowerCase()
            )
            .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
        };

        const merged = budgetData.map((b: any) => {
          const psActual = calculateTotals(b.office, "PS");
          const mooeActual = calculateTotals(b.office, "MOOE");
          const coActual = calculateTotals(b.office, "CO");
          const totalActual = psActual + mooeActual + coActual;

          const psVariance = (b.ps || 0) - psActual;
          const mooeVariance = (b.mooe || 0) - mooeActual;
          const coVariance = (b.co || 0) - coActual;
          const totalVariance = (b.total || 0) - totalActual;

          return {
            office: b.office,
            budget: {
              ps: b.ps || 0,
              mooe: b.mooe || 0,
              co: b.co || 0,
              total: b.total || 0,
            },
            actual: {
              ps: psActual,
              mooe: mooeActual,
              co: coActual,
              total: totalActual,
            },
            variance: {
              ps: psVariance,
              mooe: mooeVariance,
              co: coVariance,
              total: totalVariance,
            },
          };
        });

        setData(merged);
        // apply initial filters (none selected)
        // computeFiltered will run via effect as well, but set once for immediate view
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // compute merged data applying filters
  const computeFiltered = (budgets: any[], disbs: any[]) => {
    const calculateTotals = (office: string, category: string) => {
      if (!office || !category) return 0;
      
      // Filter disbursements by office, category, and date range (only if filter is applied)
      const relevantDisbs = disbs.filter((d: any) => {
        if (!d.dateCreated) return false;
        
        let dt: Date;
        try {
          dt = new Date(d.dateCreated);
          // Validate date is valid
          if (isNaN(dt.getTime())) return false;
        } catch (e) {
          return false;
        }
        
        const disbMonth = String(dt.getMonth() + 1).padStart(2, '0');
        const disbYear = String(dt.getFullYear());
        
        // Only apply date range filter if user has clicked "Set" and all values are provided
        if (filterApplied && monthFilterFrom && monthFilterTo && yearFilterTo) {
          const startDate = new Date(parseInt(yearFilterFrom || currentYear), parseInt(monthFilterFrom) - 1, 1);
          const endDate = new Date(parseInt(yearFilterTo), parseInt(monthFilterTo), 0, 23, 59, 59);
          
          if (dt < startDate || dt > endDate) {
            return false;
          }
        }
        
        // Finally check office and category
        return (
          d.office?.toLowerCase() === office.toLowerCase() &&
          d.expenseCategory?.toLowerCase() === category.toLowerCase()
        );
      });

      // Sum all disbursements within the date range
      return relevantDisbs.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
    };

    let merged = budgets.map((b: any) => {
      const psActual = calculateTotals(b.office, "PS");
      const mooeActual = calculateTotals(b.office, "MOOE");
      const coActual = calculateTotals(b.office, "CO");
      const totalActual = psActual + mooeActual + coActual;

      const psVariance = (b.ps || 0) - psActual;
      const mooeVariance = (b.mooe || 0) - mooeActual;
      const coVariance = (b.co || 0) - coActual;
      const totalVariance = (b.total || 0) - totalActual;

      return {
        office: b.office,
        budget: {
          ps: b.ps || 0,
          mooe: b.mooe || 0,
          co: b.co || 0,
          total: b.total || 0,
        },
        actual: {
          ps: psActual,
          mooe: mooeActual,
          co: coActual,
          total: totalActual,
        },
        variance: {
          ps: psVariance,
          mooe: mooeVariance,
          co: coVariance,
          total: totalVariance,
        },
      };
    });

    if (officeFilter && officeFilter.trim()) {
      const q = officeFilter.toLowerCase();
      merged = merged.filter((m) => m.office.toLowerCase().includes(q));
    }

    setData(merged);
  };

  // Recompute whenever raw data or filters change
  useEffect(() => {
    computeFiltered(rawBudgetData, rawDisbData);
  }, [rawBudgetData, rawDisbData, officeFilter, monthFilterFrom, yearFilterFrom, monthFilterTo, yearFilterTo, filterApplied]);

  useEffect(() => {
    return () => {
      const sidebar = document.getElementById("sidebar");
      const navbar = document.getElementById("navbar");
      const mainContent = document.getElementById("main-content");
      const layout = document.getElementById("dashboard-layout");

      if (sidebar && navbar && mainContent && layout) {
        sidebar.style.display = "";
        navbar.style.display = "";
        mainContent.style.padding = "";
        layout.style.height = "";
        layout.style.background = "";
      }
    };
  }, []);

  return (
    <div className="w-full transition-all duration-300 relative">
      {/* =================== Loading Screen =================== */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center gap-4">
            {/* Animated Spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-300" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin" />
            </div>
            <p className="text-white text-lg font-semibold">Loading...</p>
          </div>
        </div>
      )}
      
      {/* Apply blur to main content when loading */}
      <div className={`transition-all duration-300 ${loading ? "blur-sm" : ""}`}>
     {/* === HEADER === */}
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
  {/* Title */}
  <h1 className="text-3xl font-bold text-gray-800">
    Statement Of Expenditure
  </h1>

  {/* Buttons inline */}
  <div className="flex space-x-3">
    <button
      className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
      onClick={() => {
        const defaultName = generateFilename();
        setSaveFilename(defaultName);
        setSaveModalOpen(true);
      }}
    >
      <Save className="w-4 h-4 mr-2" />
      Download PDF
    </button>

    <button
      onClick={toggleCompress}
      className="flex items-center bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
    >
      {isCompressed ? (
        <>
          <Maximize2 className="w-4 h-4 mr-2" /> Compress
        </>
      ) : (
        <>
          <Minimize2 className="w-4 h-4 mr-2" /> Decompress
        </>
      )}
    </button>
  </div>
</div>

{/* Divider line */}
<hr className="border-gray-300 mb-6" />

      {/* Filters: Search bar and Month/Year/Set controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search Bar"
          value={officeFilter}
          onChange={(e) => setOfficeFilter(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2 w-full sm:w-auto"
        />

        {/* Month/Year/Set Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {/* First Month Dropdown */}
          <select
            value={monthFilterFrom}
            onChange={(e) => setMonthFilterFrom(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 sm:flex-none w-full sm:w-auto"
          >
            <option value="" disabled>Select Month From</option>
            {[
              ['01','January'],['02','February'],['03','March'],['04','April'],['05','May'],['06','June'],
              ['07','July'],['08','August'],['09','September'],['10','October'],['11','November'],['12','December']
            ].map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          {/* Year From Dropdown */}
          <select
            value={yearFilterFrom}
            onChange={(e) => setYearFilterFrom(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 sm:flex-none w-full sm:w-auto"
          >
            <option value="" disabled>Year From</option>
            {[...new Set(rawDisbData.map(d => {
              try { return new Date(d.dateCreated).getFullYear(); } catch { return null; }
            })).values()]
              .filter(Boolean)
              .sort((a: any, b: any) => b - a)
              .map((y: any) => (
                <option key={y} value={String(y)}>{String(y)}</option>
              ))}
          </select>

          {/* Second Month Dropdown */}
          <select
            value={monthFilterTo}
            onChange={(e) => setMonthFilterTo(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 sm:flex-none w-full sm:w-auto"
          >
            <option value="" disabled>Select Month To</option>
            {[
              ['01','January'],['02','February'],['03','March'],['04','April'],['05','May'],['06','June'],
              ['07','July'],['08','August'],['09','September'],['10','October'],['11','November'],['12','December']
            ].map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          {/* Year To Dropdown */}
          <select
            value={yearFilterTo}
            onChange={(e) => setYearFilterTo(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 sm:flex-none w-full sm:w-auto"
          >
            <option value="" disabled>Year To</option>
            {[...new Set(rawDisbData.map(d => {
              try { return new Date(d.dateCreated).getFullYear(); } catch { return null; }
            })).values()]
              .filter(Boolean)
              .sort((a: any, b: any) => b - a)
              .map((y: any) => (
                <option key={y} value={String(y)}>{String(y)}</option>
              ))}
          </select>

          {/* Set Button */}
          <button
            onClick={() => {
              // Validate all fields are selected
              if (!monthFilterFrom || !monthFilterTo || !yearFilterFrom || !yearFilterTo) {
                toast.error('Please select month from, year from, month to, and year to');
                return;
              }
                return;
              }
              // Apply filter - data will recompute via useEffect
              setFilterApplied(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition whitespace-nowrap flex-1 sm:flex-none w-full sm:w-auto"
          >
            Set
          </button>
        </div>

        {/* Clear Filters Button */}
        <button
          onClick={() => { 
            setOfficeFilter(''); 
            setMonthFilterFrom(''); 
            setYearFilterFrom(''); 
            setMonthFilterTo(''); 
            setYearFilterTo('');
            setFilterApplied(false);
          }}
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition whitespace-nowrap flex-1 sm:flex-none w-full sm:w-auto"
        >
          Clear
        </button>
      </div>


      {/* Save / Rename Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setSaveModalOpen(false)} />
          <div className="bg-white rounded-lg shadow-lg z-10 w-[min(600px,90%)] p-6">
            <h3 className="text-lg font-semibold mb-3">Save PDF</h3>
            <label className="block text-sm text-gray-700 mb-2">Filename</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
              value={saveFilename}
              onChange={(e) => setSaveFilename(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setSaveModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                onClick={async () => {
                  if (!saveFilename) return toast.error('Please provide a filename.') as any;
                  const ok = await savePdfWithFilename(saveFilename.endsWith('.pdf') ? saveFilename : saveFilename + '.pdf');
                  if (ok) setSaveModalOpen(false);
                }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Downloaded Success Modal */}
      {pdfDownloadedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setPdfDownloadedModalOpen(false)} />
          <div className="bg-white rounded-lg shadow-lg z-10 w-[min(400px,90%)] p-8 text-center">
            <div className="flex justify-center mb-4">
              <svg
                className="w-16 h-16 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">PDF Downloaded</h3>
            <p className="text-gray-600 mb-6">Your Statement of Expenditure has been successfully saved.</p>
            <button
              className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
              onClick={() => setPdfDownloadedModalOpen(false)}
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm transition-all duration-300">
        <table className="min-w-full border-collapse border border-gray-300 text-sm text-center">
          <thead>
  <tr className="bg-gray-100 border-b border-gray-300">
    <th
      rowSpan={2}
      className="px-4 py-2 border border-gray-300 align-middle"
    >
      Particulars
    </th>
    <th
      colSpan={4}
      className="px-4 py-2 border border-gray-300 bg-blue-500 text-white font-semibold"
    >
      Budget Appropriation
    </th>
    <th
      colSpan={4}
      className="px-4 py-2 border border-gray-300 bg-blue-500 text-white font-semibold"
    >
      Actual Expenditure
    </th>
    <th
      colSpan={4}
      className="px-4 py-2 border border-gray-300 bg-blue-500 text-white font-semibold"
    >
      Variance
    </th>
  </tr>
  <tr className="border-b border-gray-300 text-white">
    {/* Budget Appropriation */}
    {["PS", "MOOE", "CO", "Total"].map((h) => (
      <th
        key={`budget-${h}`}
        className={`px-3 py-2 border border-gray-300 ${
          h === "PS"
            ? "bg-blue-600"
            : h === "MOOE"
            ? "bg-green-600"
            : h === "CO"
            ? "bg-yellow-600"
            : "bg-indigo-600"
        } relative group`}
      >
        {h}
        {h !== "Total" && (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {h === "PS"
              ? "Personnel Services"
              : h === "MOOE"
              ? "Maintenance and Other Operating Expense"
              : "Capital Outlay"}
          </span>
        )}
      </th>
    ))}

    {/* Actual Expenditure */}
    {["PS", "MOOE", "CO", "Total"].map((h) => (
      <th
        key={`actual-${h}`}
        className={`px-3 py-2 border border-gray-300 ${
          h === "PS"
            ? "bg-blue-600"
            : h === "MOOE"
            ? "bg-green-600"
            : h === "CO"
            ? "bg-yellow-600"
            : "bg-indigo-600"
        } relative group`}
      >
        {h}
        {h !== "Total" && (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {h === "PS"
              ? "Personnel Services"
              : h === "MOOE"
              ? "Maintenance and Other Operating Expense"
              : "Capital Outlay"}
          </span>
        )}
      </th>
    ))}

    {/* Variance */}
    {["PS", "MOOE", "CO", "Total"].map((h) => (
      <th
        key={`variance-${h}`}
        className={`px-3 py-2 border border-gray-300 ${
          h === "PS"
            ? "bg-blue-600"
            : h === "MOOE"
            ? "bg-green-600"
            : h === "CO"
            ? "bg-yellow-600"
            : "bg-indigo-600"
        } relative group`}
      >
        {h}
        {h !== "Total" && (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {h === "PS"
              ? "Personnel Services"
              : h === "MOOE"
              ? "Maintenance and Other Operating Expense"
              : "Capital Outlay"}
          </span>
        )}
      </th>
    ))}
  </tr>
</thead>

<tbody>
  {loading ? (
    <tr>
      <td colSpan={13} className="py-6 text-gray-500 italic">
        Loading data...
      </td>
    </tr>
  ) : data.length === 0 ? (
    <tr className="h-48">
      <td colSpan={13} className="text-gray-500 italic p-0">
        <div className="flex flex-col items-center justify-center h-full w-full">
          <Image
            src="/img/add.png"
            alt="No data"
            width={200}
            height={200}
            className="mb-2 object-contain"
            loading="lazy"
          />
          <span>No disbursement records found.</span>
        </div>
      </td>
    </tr>
  ) : (
    <>
      {data.map((row, i) => (
        <tr key={i} className="hover:bg-gray-50">
          <td className="border border-gray-300 px-3 py-2 font-medium">
            {row.office}
          </td>

          {/* Budget */}
          <td className="border border-gray-300 px-3 py-2">
            {formatPeso(row.budget.ps)}
          </td>
          <td className="border border-gray-300 px-3 py-2">
            {formatPeso(row.budget.mooe)}
          </td>
          <td className="border border-gray-300 px-3 py-2">
            {formatPeso(row.budget.co)}
          </td>
          <td className="border border-gray-300 px-3 py-2 font-semibold bg-indigo-100">
            {formatPeso(row.budget.total)}
          </td>

          {/* Actual */}
          <td className="border border-gray-300 px-3 py-2">
            {formatPeso(row.actual.ps)}
          </td>
          <td className="border border-gray-300 px-3 py-2">
            {formatPeso(row.actual.mooe)}
          </td>
          <td className="border border-gray-300 px-3 py-2">
            {formatPeso(row.actual.co)}
          </td>
          <td className="border border-gray-300 px-3 py-2 font-semibold bg-indigo-100">
            {formatPeso(row.actual.total)}
          </td>

          {/* Variance */}
          <td className="border border-gray-300 px-3 py-2 text-black-600">
            {formatPeso(row.variance.ps)}
          </td>
          <td className="border border-gray-300 px-3 py-2 text-black-600">
            {formatPeso(row.variance.mooe)}
          </td>
          <td className="border border-gray-300 px-3 py-2 text-black-600">
            {formatPeso(row.variance.co)}
          </td>
          <td className="border border-gray-300 px-3 py-2 font-bold text-black-600 bg-indigo-100">
            {formatPeso(row.variance.total)}
          </td>
        </tr>
      ))}

      {/* Totals Row */}
      <tr className="bg-indigo-50 font-semibold">
        <td className="border border-gray-300 px-3 py-2">Overall Total</td>

        {/* Budget Totals */}
        <td className="border border-gray-300 px-3 py-2">
          {formatPeso(data.reduce((sum, r) => sum + r.budget.ps, 0))}
        </td>
        <td className="border border-gray-300 px-3 py-2">
          {formatPeso(data.reduce((sum, r) => sum + r.budget.mooe, 0))}
        </td>
        <td className="border border-gray-300 px-3 py-2">
          {formatPeso(data.reduce((sum, r) => sum + r.budget.co, 0))}
        </td>
        <td className="border border-gray-300 px-3 py-2 bg-indigo-300">
          {formatPeso(data.reduce((sum, r) => sum + r.budget.total, 0))}
        </td>

        {/* Actual Totals */}
        <td className="border border-gray-300 px-3 py-2">
          {formatPeso(data.reduce((sum, r) => sum + r.actual.ps, 0))}
        </td>
        <td className="border border-gray-300 px-3 py-2">
          {formatPeso(data.reduce((sum, r) => sum + r.actual.mooe, 0))}
        </td>
        <td className="border border-gray-300 px-3 py-2">
          {formatPeso(data.reduce((sum, r) => sum + r.actual.co, 0))}
        </td>
        <td className="border border-gray-300 px-3 py-2 bg-indigo-300">
          {formatPeso(data.reduce((sum, r) => sum + r.actual.total, 0))}
        </td>

        {/* Variance Totals */}
        <td className="border border-gray-300 px-3 py-2 text-black-600">
          {formatPeso(data.reduce((sum, r) => sum + r.variance.ps, 0))}
        </td>
        <td className="border border-gray-300 px-3 py-2 text-black-600">
          {formatPeso(data.reduce((sum, r) => sum + r.variance.mooe, 0))}
        </td>
        <td className="border border-gray-300 px-3 py-2 text-black-600">
          {formatPeso(data.reduce((sum, r) => sum + r.variance.co, 0))}
        </td>
        <td className="border border-gray-300 px-3 py-2 text-red-600 bg-indigo-300">
          {formatPeso(data.reduce((sum, r) => sum + r.variance.total, 0))}
        </td>
      </tr>
    </>
  )}
</tbody>


        </table>
      </div>
      </div>
    </div>
  );
}
