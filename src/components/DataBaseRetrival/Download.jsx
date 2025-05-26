import React from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export const DownloadButton = ({ data, filename, columns }) => {
  const handleDownload = () => {
    // Prepare the data for export
    const exportData = data.map(item => {
      const row = {};
      columns.forEach(({ header, field }) => {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          row[header] = item[parent]?.[child] || '';
        } else {
          row[header] = item[field] || '';
        }
      });
      return row;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Generate Excel file
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
    >
      <Download className="h-3 w-3" />
      Download Excel
    </button>
  );
};