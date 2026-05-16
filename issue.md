# Plan Implementasi: Perbaikan Tampilan Export PDF

## Objektif
Memperbaiki tampilan export PDF agar lebih profesional dengan tema menyerupai shadcn (dominan hijau), mengubah judul laporan menjadi "E-Statement", dan menyempurnakan tata letak halaman (memisahkan tabel kategori ke halaman baru dan mengatur header tabel panjang).

## Rincian Kebutuhan & Solusi

### 1. Perubahan Judul dan Tema Warna (Dominan Hijau Shadcn)
- **File Target:** `frontend/src/lib/exportPdf.js`
- **Teks Judul:** Ganti tulisan `'Laporan Transaksi Keuangan'` menjadi `'E-Statement'`.
- **Warna & Tema (Shadcn-like):** 
  - Ubah warna header tabel (`headStyles.fillColor`) dari biru/gelap menjadi hijau ala shadcn (misal hijau zamrud/emerald `[22, 163, 74]` atau `#16a34a`).
  - Gunakan `theme: 'grid'` (atau tetap `striped` dengan warna belang sangat terang seperti zinc-50) agar tabel terlihat rapi, kotak-kotak terstruktur, dan modern.
  - Ubah warna background pada baris *footer* ("Total") menjadi warna abu-abu terang (misal `[244, 244, 245]` atau `#f4f4f5` khas zinc-100 shadcn) agar elegan.

### 2. Memindahkan Ringkasan Kategori ke Halaman Baru
- **Kondisi Saat Ini:** Tabel kategori diletakkan tepat di bawah tabel transaksi (menggunakan koordinat `doc.lastAutoTable.finalY`).
- **Kebutuhan:** Ringkasan kategori wajib berada di halaman baru (halaman terpisah) meskipun tabel transaksi utama masih menyisakan ruang kosong.
- **Solusi:**
  - Panggil fungsi `doc.addPage();` sebelum mencetak judul ringkasan kategori.
  - Hapus variabel `finalY` dan atur ulang koordinat `Y` (misalnya `20`) agar posisi judul dan tabel kategori merapat ke bagian atas di halaman baru.

### 3. Konfigurasi Header Tabel (Menghilangkan Pengulangan Header)
- **Kondisi Saat Ini:** Jika tabel transaksi terlalu panjang dan terpotong ke halaman berikutnya, header tabel ("Tanggal", "Deskripsi", dll) akan tercetak ulang di halaman baru.
- **Kebutuhan:** Jika tabel kepanjangan, header tabel tidak perlu diulang lagi di halaman baru tersebut.
- **Solusi:** Tambahkan properti `showHead: 'firstPage'` pada opsi konfigurasi `autoTable`.

---

## Langkah-langkah Implementasi Rinci (Step-by-Step Code)

Instruksi teknis untuk modifikasi pada `frontend/src/lib/exportPdf.js`:

### Step 1: Ubah Judul Dokumen
Cari baris yang mencetak judul utama:
```javascript
doc.text('Laporan Transaksi Keuangan', 14, 22);
```
Ubah menjadi:
```javascript
doc.text('E-Statement', 14, 22);
```

### Step 2: Modifikasi `autoTable` Pertama (Tabel Transaksi Utama)
Tambahkan `showHead: 'firstPage'` dan ubah konfigurasi warna menjadi hijau:
```javascript
autoTable(doc, {
  startY: 42,
  head: [['Tanggal', 'Deskripsi', 'Kategori', 'Debit (Keluar)', 'Credit (Masuk)']],
  body: tableData,
  foot: [[
    // ... data total ...
  ]],
  theme: 'grid', // atau 'striped' - gunakan grid untuk kesan lebih rapi ala ui table
  headStyles: { fillColor: [22, 163, 74], textColor: 255 }, // Warna dominan Hijau (shadcn green-600)
  footStyles: { fillColor: [244, 244, 245], textColor: 0, fontStyle: 'bold' }, // Abu-abu muda untuk footer
  showHead: 'firstPage' // Mencegah header berulang di halaman selanjutnya
});
```

### Step 3: Memindahkan Tabel Kategori ke Halaman Baru
Ubah logika bagian `// Category Summary` (sekitar baris 75 ke bawah).

Hapus pengambilan posisi akhir tabel sebelumnya:
```javascript
// HAPUS BARIS INI:
// const finalY = doc.lastAutoTable.finalY || 42;
```

Ganti bagian pencetakan tabel ringkasan kategori dengan kode berikut:
```javascript
// Tambahkan halaman baru secara paksa
doc.addPage();

doc.setFontSize(14);
// Set posisi Y fix di bagian atas halaman (misal 20)
doc.text('Ringkasan Pengeluaran per Kategori', 14, 20);

// Gunakan autoTable untuk tabel kategori di halaman baru
autoTable(doc, {
  startY: 25, // Mulai tabel sedikit di bawah judul
  head: [['Nama Kategori', 'Total Pengeluaran']],
  body: catData,
  theme: 'grid',
  headStyles: { fillColor: [22, 163, 74], textColor: 255 }, // Samakan dengan warna hijau tabel transaksi
  columnStyles: { 1: { halign: 'right' } }
});
```
