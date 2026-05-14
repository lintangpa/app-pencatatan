# Issue & Implementation Plan: Refactor Riwayat Tabungan & Fitur Sorting

Dokumen ini berisi perencanaan untuk mengubah tampilan riwayat tabungan (savings history) agar lebih optimal di perangkat mobile dan menambahkan fitur pengurutan data (sorting).

## 1. UI Riwayat Tabungan (Mobile-Friendly Modal)

**Deskripsi Masalah:**
Tampilan riwayat tabungan saat ini perlu dioptimalkan agar lebih nyaman dilihat di layar kecil (mobile) namun tetap menggunakan komponen Modal (Dialog).

**Tahapan Implementasi:**
*   **Frontend (React/Next.js):**
    1.  **Refactor Modal:** Gunakan komponen `Dialog` dari Shadcn UI. Tambahkan kelas responsif agar pada mobile, modal mengambil area yang cukup luas (misal: `w-[95vw]` atau `max-w-md`).
    2.  **Sticky Header:** Pastikan bagian judul Modal dan kontrol sorting (filter) bersifat *sticky* (tetap di atas) sehingga pengguna tidak kehilangan konteks saat melakukan scroll pada riwayat yang panjang.
    3.  **Optimasi Item Riwayat:**
        *   Gunakan font size yang pas (`text-sm` untuk detail, `text-xs` untuk tanggal).
        *   Pastikan area klik/sentuh tidak terlalu rapat.
        *   Gunakan warna yang jelas untuk membedakan uang masuk (nabung) dan uang keluar (tarik).
    4.  **Scroll Area:** Pastikan kontainer riwayat memiliki `max-h` yang dinamis (misal `max-h-[60vh]`) dengan `overflow-y-auto` agar tidak merusak layout modal.

## 2. Fitur Sorting (Terbaru & Terlama)

**Deskripsi Masalah:**
Pengguna membutuhkan kemampuan untuk melihat riwayat dari yang paling baru atau dari yang paling awal (terlama).

**Tahapan Implementasi:**
*   **Frontend (React/Next.js):**
    1.  **State Management:** Tambahkan state baru, misalnya `sortOrder` dengan nilai default `'desc'` (terbaru).
    2.  **Komponen UI Sorting:** 
        *   Tambahkan komponen `Select` atau toggle button di dalam header modal riwayat.
        *   Opsi: "Terbaru" (Sort by Date Descending) dan "Terlama" (Sort by Date Ascending).
    3.  **Logika Sorting:**
        *   Lakukan sorting di sisi client (frontend) terhadap array `history` sebelum di-render.
        *   Contoh logika:
          ```javascript
          const sortedHistory = [...history].sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });
          ```
    4.  **Feedback Visual:** Pastikan ada indikator (misal ikon panah atas/bawah) yang menunjukkan urutan sorting yang sedang aktif.

---

### Catatan untuk Developer:
- Pastikan komponen Shadcn UI yang diperlukan (`Select`, `Dialog`, `Button`) sudah terpasang.
- Uji coba tampilan menggunakan mode "Inspect" di browser dengan berbagai resolusi layar HP.
- Jaga agar kode tetap bersih dan berikan komentar pada bagian logika sorting.
