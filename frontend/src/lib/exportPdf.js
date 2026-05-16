import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import as function

export const exportPdf = (transactions, monthName, year) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
  
  // Element abstrak di bagian paling atas (background header)
  doc.setFillColor(240, 253, 244); // Hijau sangat muda (emerald-50)
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.triangle(0, 25, pageWidth, 25, pageWidth, 32, 'F'); // Efek miring/abstrak
  
  // Header
  // Logo & Brand
  try {
    doc.addImage('/hk.png', 'PNG', 14, 10, 8, 8);
  } catch (e) {
    console.error("Failed to load logo", e);
    // Fallback: draw a green square if image fails
    doc.setFillColor(22, 163, 74);
    doc.rect(14, 10, 8, 8, 'F');
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0); // Black
  doc.text('HaloKalin', 24, 16);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  // Align title to the right
  doc.text('Laporan Transaksi/Statement', pageWidth - 14, 16, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0); // Hitam
  // Letakkan di bawah judul dan rata kanan
  doc.text(`Periode: ${monthName} ${year}`, pageWidth - 14, 22, { align: 'right' });
  
  // Sort transactions by date ASC
  const sortedTrans = [...transactions].sort((a, b) => {
    return new Date(a.transaction_date) - new Date(b.transaction_date);
  });
  
  // Main Table
  const tableData = [];
  let totalDebit = 0;
  let totalCredit = 0;
  
  sortedTrans.forEach(t => {
    const date = new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const desc = t.note || '-';
    const cat = t.category_name || 'Tanpa Kategori';
    
    let debit = '-';
    let credit = '-';
    
    if (t.type === 'expense') {
      debit = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(t.amount);
      totalDebit += parseFloat(t.amount);
    } else {
      credit = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(t.amount);
      totalCredit += parseFloat(t.amount);
    }
    
    tableData.push([date, desc, cat, debit, credit]);
  });
  
  const drawFooter = (data) => {
    const pageSize = doc.internal.pageSize;
    const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
    const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
    
    doc.setFillColor(22, 163, 74);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(255);
    doc.setFont('helvetica', 'normal');
    doc.text(`HaloKalin | E-Statement ${monthName} ${year}`, 14, pageHeight - 4);
    
    // Menggunakan doc.internal.getNumberOfPages() agar nomor halaman sesuai dengan total halaman dokumen
    const pageStr = `Halaman ${doc.internal.getNumberOfPages()}`;
    doc.text(pageStr, pageWidth - 30, pageHeight - 4);
  };

  // Use autoTable function
  autoTable(doc, {
    startY: 40, // Adjusted for smaller header height
    head: [['Tanggal', 'Deskripsi', 'Kategori', 'Debit', 'Credit']],
    body: tableData,
    foot: [[
      'Total', 
      '', 
      '', 
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalDebit),
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalCredit)
    ]],
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74], textColor: 255, halign: 'center' },
    footStyles: { fillColor: [244, 244, 245], textColor: 0, fontStyle: 'bold' },
    styles: { halign: 'center' },
    columnStyles: {
      1: { halign: 'left' } // Deskripsi rata kiri
    },
    showHead: 'firstPage',
    showFoot: 'lastPage',
    didDrawPage: drawFooter,
    margin: { bottom: 25 }
  });
  
  // Category Summary
  const expenses = sortedTrans.filter(t => t.type === 'expense');
  const catSummary = {};
  expenses.forEach(t => {
    const cat = t.category_name || 'Tanpa Kategori';
    catSummary[cat] = (catSummary[cat] || 0) + parseFloat(t.amount);
  });
  
  const catData = Object.entries(catSummary).map(([cat, total]) => [
    cat,
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total)
  ]);
  
  const totalCategoryAmount = Object.values(catSummary).reduce((acc, curr) => acc + curr, 0);
  
  // Forced page break for category summary
  doc.addPage();
  
  doc.setFontSize(14);
  doc.text('Ringkasan Pengeluaran per Kategori', 14, 20);
  
  // Use autoTable function here too
  autoTable(doc, {
    startY: 25,
    head: [['Nama Kategori', 'Total Pengeluaran']],
    body: catData,
    foot: [[
      'Total', 
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalCategoryAmount)
    ]],
    theme: 'grid',
    styles: { halign: 'center' },
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    footStyles: { fillColor: [244, 244, 245], textColor: 0, fontStyle: 'bold' },
    showFoot: 'lastPage',
    didDrawPage: drawFooter,
    margin: { bottom: 25 }
  });
  
  doc.save(`E-Statement ${monthName} ${year}.pdf`);
};
