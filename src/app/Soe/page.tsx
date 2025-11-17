"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Printer, Minimize2, Maximize2, Save } from "lucide-react";

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

  // Helper function to format numbers as Philippine Peso
  const formatPeso = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value);
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

  // Generate a PDF Blob from the SOE data by building a sanitized table (no site CSS)
  const generatePdfBlob = async (): Promise<Blob | null> => {
    try {
      const tableEl = document.createElement('table');
      tableEl.style.borderCollapse = 'collapse';
      tableEl.style.width = '100%';
      tableEl.style.fontFamily = 'Arial, sans-serif';
      tableEl.style.fontSize = '12px';

      // header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const headers = [
        'Particulars',
        'Budget PS',
        'Budget MOOE',
        'Budget CO',
        'Budget Total',
        'Actual PS',
        'Actual MOOE',
        'Actual CO',
        'Actual Total',
        'Variance PS',
        'Variance MOOE',
        'Variance CO',
        'Variance Total',
      ];
      for (const h of headers) {
        const th = document.createElement('th');
        th.textContent = h;
        th.style.border = '1px solid #d1d5db';
        th.style.padding = '6px 8px';
        th.style.background = '#f3f4f6';
        th.style.fontWeight = '700';
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);
      tableEl.appendChild(thead);

      // body
      const tbody = document.createElement('tbody');
      for (const row of data) {
        const tr = document.createElement('tr');
        tr.style.border = '1px solid #e5e7eb';

        const cells = [
          row.office,
          formatPeso(row.budget.ps),
          formatPeso(row.budget.mooe),
          formatPeso(row.budget.co),
          formatPeso(row.budget.total),
          formatPeso(row.actual.ps),
          formatPeso(row.actual.mooe),
          formatPeso(row.actual.co),
          formatPeso(row.actual.total),
          formatPeso(row.variance.ps),
          formatPeso(row.variance.mooe),
          formatPeso(row.variance.co),
          formatPeso(row.variance.total),
        ];

        for (const c of cells) {
          const td = document.createElement('td');
          td.textContent = String(c ?? '');
          td.style.border = '1px solid #e5e7eb';
          td.style.padding = '6px 8px';
          td.style.textAlign = 'right';
          tr.appendChild(td);
        }

        if (tr.firstChild) (tr.firstChild as HTMLElement).style.textAlign = 'left';
        tbody.appendChild(tr);
      }

      // totals row
      const totalsRow = document.createElement('tr');
      totalsRow.style.fontWeight = '700';
      const totals = [
        'Overall Total',
        formatPeso(data.reduce((sum, r) => sum + r.budget.ps, 0)),
        formatPeso(data.reduce((sum, r) => sum + r.budget.mooe, 0)),
        formatPeso(data.reduce((sum, r) => sum + r.budget.co, 0)),
        formatPeso(data.reduce((sum, r) => sum + r.budget.total, 0)),
        formatPeso(data.reduce((sum, r) => sum + r.actual.ps, 0)),
        formatPeso(data.reduce((sum, r) => sum + r.actual.mooe, 0)),
        formatPeso(data.reduce((sum, r) => sum + r.actual.co, 0)),
        formatPeso(data.reduce((sum, r) => sum + r.actual.total, 0)),
        formatPeso(data.reduce((sum, r) => sum + r.variance.ps, 0)),
        formatPeso(data.reduce((sum, r) => sum + r.variance.mooe, 0)),
        formatPeso(data.reduce((sum, r) => sum + r.variance.co, 0)),
        formatPeso(data.reduce((sum, r) => sum + r.variance.total, 0)),
      ];
      for (const c of totals) {
        const td = document.createElement('td');
        td.textContent = String(c ?? '');
        td.style.border = '1px solid #e5e7eb';
        td.style.padding = '6px 8px';
        td.style.textAlign = 'right';
        totalsRow.appendChild(td);
      }
      if (totalsRow.firstChild) (totalsRow.firstChild as HTMLElement).style.textAlign = 'left';
      tbody.appendChild(totalsRow);

      tableEl.appendChild(tbody);

      // Render off-screen
      const wrapper = document.createElement('div');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-99999px';
      wrapper.style.top = '0';
      wrapper.style.pointerEvents = 'none';
      wrapper.appendChild(tableEl);
      document.body.appendChild(wrapper);

      const canvas = await html2canvas(tableEl as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'pt', 'a4');
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
    if (!blob) return alert('Unable to generate PDF');

    const finalFilename = filename || `SOE_${new Date().toISOString().split('T')[0]}.pdf`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
      }

      return true;
    } catch (e) {
      console.error('Save PDF error', e);
      alert('Failed to save PDF: ' + (e as any)?.message || e);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // View PDF in a new tab
  const viewPdf = async () => {
    const blob = await generatePdfBlob();
    if (!blob) return alert('Unable to generate PDF');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Download ZIP containing PDF (requires jszip). If jszip not installed, fallback to PDF download.
  const downloadZipWithPdf = async () => {
    const blob = await generatePdfBlob();
    if (!blob) return alert('Unable to generate PDF');

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
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    <div className="w-full transition-all duration-300">
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
        const defaultName = `SOE_${new Date().toISOString().split('T')[0]}.pdf`;
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
          <Maximize2 className="w-4 h-4 mr-2" /> Decompress
        </>
      ) : (
        <>
          <Minimize2 className="w-4 h-4 mr-2" /> Compress
        </>
      )}
    </button>
  </div>
</div>

{/* Divider line */}
<hr className="border-gray-300 mb-6" />


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
                  if (!saveFilename) return alert('Please provide a filename.');
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
          <img
            src="/img/add.png"
            alt="No data"
            className="mb-2 max-w-[200px] h-auto object-contain"
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
          <td className="border border-gray-300 px-3 py-2 text-red-600">
            {formatPeso(row.variance.ps)}
          </td>
          <td className="border border-gray-300 px-3 py-2 text-red-600">
            {formatPeso(row.variance.mooe)}
          </td>
          <td className="border border-gray-300 px-3 py-2 text-red-600">
            {formatPeso(row.variance.co)}
          </td>
          <td className="border border-gray-300 px-3 py-2 font-bold text-red-600 bg-indigo-100">
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
        <td className="border border-gray-300 px-3 py-2 text-red-600">
          {formatPeso(data.reduce((sum, r) => sum + r.variance.ps, 0))}
        </td>
        <td className="border border-gray-300 px-3 py-2 text-red-600">
          {formatPeso(data.reduce((sum, r) => sum + r.variance.mooe, 0))}
        </td>
        <td className="border border-gray-300 px-3 py-2 text-red-600">
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
  );
}
