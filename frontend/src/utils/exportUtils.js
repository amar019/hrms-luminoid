import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet1') => {
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Custom styling
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({ c: C, r: R });
      if (!ws[cell_address]) continue;
      
      // Header styling
      if (R === 0) {
        ws[cell_address].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "2563EB" } },
          alignment: { horizontal: "center" }
        };
      }
    }
  }
  
  // Set column widths
  ws['!cols'] = data.length > 0 ? Object.keys(data[0]).map(() => ({ wch: 15 })) : [];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (data, filename = 'export', title = 'Report') => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235);
  doc.text(title, 14, 22);
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Prepare table data
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  const rows = data.map(item => headers.map(header => item[header] || ''));
  
  // Add table
  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 40,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });
  
  doc.save(`${filename}.pdf`);
};