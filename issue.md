# 📝 Task: Perbaikan & Fitur Baru Menu Management (Budget Bulanan)

**Target Pekerja:** Junior Developer / AI Assistant
**Fokus Area:** Frontend (React/Next.js + Tailwind CSS) & Backend (Express.js)

## 📌 Deskripsi Tugas
Tugas ini fokus pada penyempurnaan fitur di halaman **Management** (Manajemen Anggaran/Budget Bulanan). Tujuannya adalah membuat UI lebih interaktif, sangat ramah pengguna di perangkat mobile (*mobile-friendly*), dan memastikan interaksi data (CRUD) berjalan mulus disertai notifikasi yang jelas.

---

## ✅ Kriteria Penerimaan (Acceptance Criteria)

Harap pastikan semua poin di bawah ini terpenuhi saat implementasi:
1. **Fetch Data on Load:** Saat halaman Management dibuka, data budget bulanan harus langsung di-fetch dari backend dan ditampilkan tanpa perlu user menekan tombol apapun.
2. **Penggunaan Month Picker:** Input pemilihan waktu tidak lagi menggunakan tanggal lengkap, melainkan **Month Picker** (hanya memilih Bulan dan Tahun). Sesuaikan format API atau database di sisi Backend jika dirasa perlu untuk mengakomodasi format ini.
3. **Toggle Card State:** Ketika *card* budget bulan yang sedang dalam status **Aktif** di-klik, statusnya harus langsung berubah menjadi **Nonaktif** (sebuah aksi *toggle* cepat).
4. **Modal Edit:** Terdapat tombol/ikon Edit pada card. Jika diklik, akan muncul sebuah **Modal/Dialog** yang memuat form untuk mengubah data budget bulan tersebut.
5. **Konfirmasi Delete:** Terdapat tombol/ikon Delete pada card. Jika diklik, **WAJIB** memunculkan Alert/Peringatan yang mengonfirmasi bahwa *"Menghapus data ini akan menghapus semua data transaksi yang ada di bulan tersebut"*.
6. **Toast Notifikasi:** Wajib mengimplementasikan *toast notification* (notifikasi popup di sudut layar) untuk memberikan *feedback* kepada user setiap kali aksi (Simpan, Edit, Hapus, Toggle) berhasil dilakukan maupun jika terjadi error/kegagalan dari server.
7. **Mobile-First UI:** Semua elemen di atas (Card, Modal Edit, Alert Delete, dan Toast) harus terlihat rapi, responsif, dan mudah ditekan *(tappable)* saat dibuka di layar HP.

---

## 🚀 Tahapan Implementasi (Step-by-Step Guide)

Ikuti urutan langkah-langkah di bawah ini secara bertahap agar proses implementasi lebih terstruktur.

### Tahap 1: Persiapan Environment & Library
- Pastikan kamu sudah memahami struktur *routing* dan letak komponen halaman Management.
- Pastikan library UI komponen (seperti Shadcn UI) dan icon (seperti Lucide React) sudah tersedia.
- Install atau siapkan library *Toast* (misal: `react-hot-toast`, `sonner`, atau komponen bawaan Shadcn) jika belum ada di project.

### Tahap 2: Penyesuaian API / Backend (Opsional tapi Penting)
- Cek endpoint backend yang menangani Create dan Update.
- Karena Frontend sekarang akan mengirimkan data *Bulan dan Tahun* saja, pastikan backend bisa memprosesnya (misal: mengubahnya menjadi format hari pertama pada bulan tersebut seperti `YYYY-MM-01` sebelum disimpan ke database MySQL, atau cukup simpan string `YYYY-MM`).

### Tahap 3: Implementasi Fetch Data Otomatis
- Pada komponen halaman Management, gunakan `useEffect` (atau React Query/SWR jika tersedia di project).
- Lakukan request `GET` ke endpoint data management saat komponen pertama kali di-*mount*.
- Simpan datanya ke dalam state dan tambahkan *loading state* (seperti *skeleton loading* atau *spinner*) jika diperlukan.

### Tahap 4: Desain Layout & Card (Mobile-Responsive)
- Buat struktur list dengan menggunakan *CSS Grid* atau *Flexbox*. 
- Pastikan di layar kecil tampil 1 kolom (`grid-cols-1`), dan merenggang (2 atau 3 kolom) di layar yang lebih besar.
- Pastikan ukuran tombol Edit dan Delete di dalam *card* cukup besar agar mudah di-klik dengan jari di HP.

### Tahap 5: Implementasi Interaksi Card (Toggle, Edit, Delete)
1. **Toggle Aktif/Nonaktif:**
   - Tambahkan *event handler* `onClick` pada card.
   - Panggil API `PATCH`/`PUT` untuk *toggle status*.
   - Ubah UI (misal: warna card menjadi abu-abu jika nonaktif) berdasarkan respons API.
2. **Modal Edit:**
   - Buat state lokal seperti `isEditOpen` dan `selectedBudget`.
   - Gunakan komponen *Modal* atau *Dialog*. Ganti input tanggal dengan komponen *Month Picker*.
   - Panggil API `PUT` saat form disubmit, lalu tutup modal jika berhasil.
3. **Peringatan Hapus (Delete Alert):**
   - Gunakan komponen *AlertDialog*.
   - Tampilkan teks peringatan yang spesifik mengenai penghapusan seluruh data bulan tersebut.
   - Jika user menekan *Confirm*, panggil API `DELETE`.

### Tahap 6: Integrasi Toast Notification
- Bungkus semua fungsi pemanggilan API (Toggle, Create, Edit, Delete) ke dalam blok `try...catch`.
- Di dalam `try` (setelah sukses), jalankan `toast.success('Pesan sukses')`.
- Di dalam `catch` (jika error), tangkap *error message* dan jalankan `toast.error('Pesan error')`.
- Pastikan posisi toast tidak menutupi tombol navigasi penting, terutama di HP (lebih disarankan di atas tengah atau bawah tengah).

### Tahap 7: Testing (Quality Assurance)
1. Buka *Developer Tools* (Inspect Element) di browser, ubah tampilan ke simulator perangkat *Mobile* (misal: iPhone 12/14).
2. Lakukan simulasi lengkap:
   - Apakah data langsung muncul saat halaman di-*refresh*?
   - Coba tambah data menggunakan *Month Picker*.
   - Coba klik card untuk mengetes fungsi *Toggle*.
   - Coba buka modal Edit, pastikan inputnya terlihat jelas dan tidak kepotong layarnya.
   - Coba tekan hapus, pastikan peringatannya muncul.
   - Pastikan toast muncul setelah setiap aksi.

---
**Catatan untuk Implementator:** Jangan ragu untuk membuat sub-komponen terpisah (misalnya `BudgetCard.jsx` atau `EditBudgetModal.jsx`) jika kode di halaman utama Management mulai terlalu panjang. Prioritaskan *Clean Code*!
