# Issue & Implementation Plan: Perbaikan Fitur Tabungan (Savings)

Dokumen ini berisi perencanaan untuk memperbaiki beberapa isu terkait fitur Tabungan (Savings) pada aplikasi. Silakan ikuti tahapan implementasi berikut secara rinci.

## 1. Error 500 saat Nabung dan Tarik Savings

**Deskripsi Masalah:** 
Ketika pengguna mencoba menambahkan saldo (nabung) atau menarik saldo (tarik) dari savings, terjadi Internal Server Error (500).

**Tahapan Implementasi:**
*   **Backend (Node.js/Express):**
    1.  Identifikasi rute endpoint yang menangani proses nabung dan tarik (biasanya `POST /api/savings/...` atau `PUT /api/savings/...`).
    2.  Buka *controller* yang sesuai dan periksa blok `try-catch`. Tambahkan `console.error(error)` di dalam blok `catch` untuk melihat detail error di terminal backend.
    3.  Periksa query database (MySQL). Pastikan nama tabel, nama kolom, dan *foreign key* sudah benar.
    4.  Cek validasi data sebelum query dijalankan. Pastikan variabel seperti `amount` dikonversi menjadi tipe numerik (`Number` atau `parseFloat/parseInt`) sebelum dimasukkan ke database, karena terkadang payload dari frontend berupa string yang bisa menyebabkan error komputasi SQL.
*   **Frontend (React/Next.js):**
    1.  Cek file komponen form untuk nabung/tarik savings.
    2.  Gunakan tab *Network* pada browser Developer Tools untuk melihat payload request yang dikirim saat tombol submit ditekan. Pastikan struktur JSON yang dikirim (terutama tipe datanya) sesuai dengan yang diharapkan backend.

## 2. Perubahan UI/UX Riwayat Tabungan (Hindari Modal)

**Deskripsi Masalah:** 
Menampilkan riwayat tabungan menggunakan Modal kurang efektif dan kurang nyaman dilihat ketika jumlah riwayat transaksi sangat banyak.

**Tahapan Implementasi:**
*   **Frontend (React/Next.js):**
    1.  **Pendekatan UI:** Ganti Modal dengan menggunakan salah satu dari opsi berikut:
        *   **Halaman Detail Khusus (Rekomendasi):** Buat rute baru (misal: `/savings/[id]`) untuk menampilkan detail tabungan beserta tabel riwayat secara penuh.
        *   **Sheet / Side Drawer:** Jika menggunakan Shadcn UI, gunakan komponen `Sheet` yang muncul dari samping layar. Ini memberi lebih banyak ruang vertikal untuk *scroll* riwayat dibandingkan Modal di tengah layar.
        *   **Accordion / Expandable Card:** Tampilkan riwayat tepat di bawah card tabungan utama menggunakan sistem *expand/collapse*.
    2.  **Pembuatan Tabel Riwayat:** Buat komponen tabel yang rapi untuk menampilkan riwayat (kolom: Tanggal, Tipe Transaksi, Nominal, Keterangan).
    3.  **Pagination / Batas Tampilan:** Jika memilih Sheet atau form ringkas, pastikan tambahkan *Pagination* atau fitur "Load More", atau batasi data yang diambil via backend agar aplikasi tidak *lag* saat me-render ratusan data sekaligus.
    4.  **Refactor Trigger:** Ubah *event onClick* pada tombol "Lihat Riwayat" yang sebelumnya membuka `state` modal (misal `isModalOpen = true`) menjadi navigasi ke halaman baru (`router.push`) atau trigger komponen UI yang baru.

## 3. Nabung dari Kategori Tercatat sebagai Tarik Saldo

**Deskripsi Masalah:** 
Saat memindahkan dana (nabung) dari suatu Kategori ke Tabungan, transaksinya justru tercatat sebagai histori "tarik saldo" (withdrawal) alih-alih "nabung" (deposit) di bagian tabungan.

**Tahapan Implementasi:**
*   **Backend (Node.js/Express):**
    1.  Cari endpoint yang menangani logika "Nabung dari Kategori" (kemungkinan rute khusus transfer/alokasi).
    2.  Periksa logika `INSERT` ke tabel histori/riwayat tabungan (`savings_history` atau tabel serupa).
    3.  **Perbaiki Tipe Transaksi:** Pastikan variabel yang merepresentasikan tipe transaksi (*type* / *status*) di-set nilainya dengan benar. Jika sebelumnya tertulis `tarik` atau `out`, ubah menjadi `nabung` atau `in` khusus untuk histori yang masuk ke Tabungan.
    4.  **Periksa Logika Ganda (Opsional namun Penting):** Transaksi alokasi ini harusnya memicu 2 riwayat:
        *   Record di histori Kategori: `Keluar / Tarik`
        *   Record di histori Tabungan: `Masuk / Nabung`
        Pastikan logika pencatatannya tidak terbalik.
*   **Frontend (React/Next.js):**
    1.  Jika *type* transaksi ini dikirim dari payload frontend (di dalam request body), pastikan form mengirimkan value yang benar untuk backend (misal `{ type: "nabung" }`).
    2.  Uji coba kembali flow nabung dari kategori dan pastikan ikon, warna (misal: warna hijau), atau teks di UI tabel riwayat sudah mengindikasikan bahwa dana tersebut masuk/bertambah.
