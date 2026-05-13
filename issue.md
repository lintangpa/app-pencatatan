# Task / Issue Planning: Perbaikan UI/UX dan Fitur Category

Dokumen ini berisi panduan implementasi langkah demi langkah untuk mengerjakan 3 fitur/perbaikan baru. Baca secara teliti dan ikuti instruksi pada setiap tahapannya.

## Daftar Fitur yang Akan Diimplementasikan:
1. **Reorder Kategori**: Pengguna dapat mengubah urutan kategori (yang bisa di-scroll) pada halaman transaksi.
2. **Integrasi Kategori Baru & Tabungan (Savings)**: Saat membuat kategori baru, terdapat opsi untuk memasukkannya ke dalam *savings*. Jika dipilih, sistem akan otomatis membuat transaksi baru dan menambah saldo *savings* sesuai dengan nominal budget kategori tersebut.
3. **Kompatibilitas Safari (iOS)**: Memastikan semua fitur dan tampilan berjalan mulus tanpa bug di browser Safari (khususnya iOS).

---

## Tahapan Implementasi Secara Rinci

### Fase 1: Backend (Database & API)

#### 1.1 Modifikasi Endpoint Pembuatan Kategori (`POST /api/categories`)
- **Tugas**: Tambahkan parameter body baru, misalnya `isAddToSavings` (boolean).
- **Proses**:
  1. Lakukan validasi, jika `isAddToSavings` adalah `true`, pastikan parameter `budget` (atau nominal target) memiliki nilai yang valid (> 0).
  2. Insert data kategori baru ke dalam tabel `categories`.
  3. **Jika `isAddToSavings` bernilai `true`**:
     - Buat sebuah baris transaksi baru secara otomatis di tabel `transactions`.
     - Tipe transaksi: *Income* atau *Transfer ke Savings* (sesuaikan dengan struktur yang sudah ada).
     - Nominal transaksi: Mengambil dari nominal `budget` kategori tersebut.
     - Deskripsi: "Alokasi awal tabungan untuk kategori: [Nama Kategori]".
     - Jika ada tabel terpisah untuk saldo *savings*, lakukan update/increment saldo tersebut secara atomic menggunakan *database transaction* untuk mencegah inkonsistensi data.
- **Output**: Kembalikan data kategori yang baru dibuat berserta status penambahan transaksi (jika ada).

---

### Fase 2: Frontend (UI/UX & Interaksi)

#### 2.1 Fitur Reorder Kategori pada Halaman Transaksi (Client-Side Only)
- **Tugas**: Di halaman Transaksi, pada bagian list kategori yang *scrollable*, tambahkan mode edit atau mekanisme *drag-and-drop*. Karena di-handle secara *Frontend Only*, urutan akan disimpan di peramban (browser) pengguna secara lokal.
  - *Saran Library*: Jika menggunakan React, gunakan library yang ringan untuk drag-and-drop (misal: `@hello-pangea/dnd` atau `dnd-kit`). Jika ingin sederhana, bisa gunakan tombol panah (Up/Down) di samping masing-masing kategori.
- **Proses**:
  - Setelah pengguna selesai mengubah urutan, simpan urutan ID kategori yang baru ke dalam `localStorage` (contoh: `localStorage.setItem('categoryOrder', JSON.stringify(orderedIds))`).
  - Saat komponen list kategori ditampilkan (*mounted*) dan menerima data kategori dari API, periksa urutan ID yang tersimpan di `localStorage`. Lakukan sorting *array* kategori berdasarkan urutan yang ada di `localStorage`. Jika ada kategori baru yang ID-nya belum ada di penyimpanan lokal, posisikan di bagian paling akhir.
  - Tampilkan notifikasi *success* bahwa urutan telah disimpan (tersimpan secara lokal pada perangkat ini).

#### 2.2 Penambahan Opsi "Add to Savings" pada Form Buat Kategori
- **Tugas**: Pada komponen form atau modal *Create Category*, tambahkan sebuah *Switch* atau *Checkbox*: **"Masukkan ke dalam Savings?"**.
- **Proses**:
  - Jika dicentang, pastikan input nominal budget wajib diisi (*required*).
  - Saat form di-*submit*, sertakan *payload* `isAddToSavings: true` beserta data kategori lainnya ke endpoint `POST /api/categories`.
  - Setelah berhasil disubmit, lakukan *refetch* atau perbarui *state* global (termasuk *state* saldo *savings* dan daftar transaksi jika ditampilkan di halaman yang sama) agar UI langsung ter-update secara *real-time*.

---

### Fase 3: Kompatibilitas Khusus Safari (iOS)

Pada fase ini, periksa dan perbaiki kode frontend agar berjalan sempurna di perangkat iOS (iPhone/iPad).

#### 3.1 Pencegahan Auto-Zoom pada Input Form
- **Tugas**: Safari iOS secara otomatis melakukan zoom saat mengklik `<input>` atau `<textarea>` jika ukuran font kurang dari `16px`.
- **Aksi**: Pastikan semua input pada form pembuatan kategori dan transaksi menggunakan kelas Tailwind `text-base` atau mendefinisikan CSS `font-size: 16px;`.

#### 3.2 Parsing Tanggal (Date) yang Aman
- **Tugas**: Safari sangat ketat mengenai format tanggal. Penggunaan `new Date('2024-05-14 10:00:00')` akan menghasilkan `Invalid Date`.
- **Aksi**: Pastikan konversi tanggal dari backend selalu menggunakan format standar ISO 8601 (misal `YYYY-MM-DDTHH:mm:ss.sssZ`) atau ubah tanda hubung menjadi garis miring `new Date(dateString.replace(/-/g, '/'))` sebelum memproses tanggal di Frontend.

#### 3.3 Penanganan Scrollable Container
- **Tugas**: Memastikan *scroll* pada daftar kategori terasa mulus (native feel) di iOS.
- **Aksi**: Tambahkan class Tailwind yang mengatur overscroll, seperti memastikan adanya `-webkit-overflow-scrolling: touch` pada container list kategori yang horizontal. (Bisa menggunakan class pendukung di Tailwind jika diperlukan).

#### 3.4 Isu Flexbox dan Gap (Legacy iOS)
- **Tugas**: Jika aplikasi menargetkan iOS Safari versi lama (< 14.5), property `gap` pada flexbox bisa jadi tidak berfungsi.
- **Aksi**: Uji bagian scrollable list kategori di emulator iOS. Pastikan jarak antar *chip* kategori tidak bertumpuk. Jika perlu, sediakan *fallback* menggunakan *margin*.

---

### Catatan Tambahan untuk Developer
- Jangan lupa tambahkan penanganan *error handling* (*try-catch*) pada setiap panggilan API dan gunakan komponen Toast (`sonner` / `react-hot-toast`) untuk memberikan *feedback* kepada pengguna.
- Pastikan perubahan *state* dilakukan secara sinkron setelah aksi berhasil di *backend* agar pengguna tidak perlu melakukan *refresh* (F5) untuk melihat perubahannya.
