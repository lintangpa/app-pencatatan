# Task: Peningkatan Fitur Autentikasi (Register & Login)

## Deskripsi Tugas
Tugas ini mencakup perbaikan dan penambahan fitur pada alur autentikasi aplikasi. Tujuan utamanya adalah meningkatkan keamanan data pengguna serta memberikan *User Experience* (UX) yang lebih baik pada halaman login dan register.

Fitur yang harus diimplementasikan:
1. **Popup & Redirect (Register):** Menampilkan pesan/popup sukses saat pengguna berhasil membuat akun, lalu mengarahkannya (*redirect*) ke halaman login.
2. **Kunci Scroll (Login):** Mengatur halaman login agar pas dalam satu layar (100vh) dan tidak dapat di-scroll.
3. **Hashing Password:** Menggunakan `bcrypt` di sisi backend untuk mengenkripsi password sebelum disimpan ke database.

---

## Tahapan Implementasi Rinci

### 1. Implementasi Hashing Password dengan `bcrypt` (Backend)
**Lokasi Modifikasi:** Endpoint Register (misalnya di `backend/controllers/authController.js` atau file endpoint terkait seperti `backend/index.js`)

**Langkah-langkah:**
1. Pastikan package `bcrypt` atau `bcryptjs` sudah terinstall. Jika belum, jalankan perintah `npm install bcrypt` pada folder backend.
2. Import `bcrypt` ke dalam file controller registrasi (`const bcrypt = require('bcrypt');`).
3. Pada fungsi untuk *handle* register, tangkap variabel `password` dari `req.body`.
4. Lakukan hashing password menggunakan `bcrypt.hash()`. Gunakan *salt rounds* sebesar 10 (standar keamanan yang baik).
   ```javascript
   const saltRounds = 10;
   const hashedPassword = await bcrypt.hash(password, saltRounds);
   ```
5. Simpan `hashedPassword` ke dalam database, jangan menyimpan `password` asli (plain-text).
6. **Perhatian:** Jangan lupa juga memperbarui bagian endpoint **Login** untuk mencocokkan password menggunakan `bcrypt.compare(passwordInput, passwordDariDatabase)`.

### 2. Implementasi Popup Sukses dan Redirect (Frontend)
**Lokasi Modifikasi:** Komponen / Halaman Register (misalnya di `frontend/app/register/page.tsx` atau direktori serupa)

**Langkah-langkah:**
1. Buka fungsi *handler* yang menangani pengiriman *form* registrasi (misalnya `onSubmit` atau `handleSubmit`).
2. Setelah permintaan API registrasi selesai dan mengembalikan status sukses (misal HTTP 201 Created atau 200 OK), hentikan proses loading.
3. Tampilkan notifikasi popup berhasil. Anda bisa menggunakan komponen *Toast* bawaan Shadcn UI, `sweetalert2`, atau komponen notifikasi yang sudah ada di proyek.
4. Tambahkan jeda waktu sementara menggunakan `setTimeout` (misal 1500ms - 2000ms) agar pengguna sempat membaca popup.
5. Setelah jeda selesai, lakukan *redirect* ke rute `/login`. Jika menggunakan Next.js, gunakan `router.push('/login')` dari `useRouter()`.

### 3. Mengunci *Scroll* pada Halaman Login (Frontend)
**Lokasi Modifikasi:** Komponen / Halaman Login (misalnya di `frontend/app/login/page.tsx` atau direktori serupa)

**Langkah-langkah:**
Pendekatan yang direkomendasikan adalah dengan membatasi *height* atau menggunakan `overflow: hidden`.

**Pendekatan React `useEffect` (Direkomendasikan):**
1. Import `useEffect` dari React.
2. Tambahkan *hook* `useEffect` untuk mengubah styling `body` saat komponen login di-render:
   ```javascript
   useEffect(() => {
     // Kunci scroll ketika masuk halaman login
     document.body.style.overflow = 'hidden';

     // Kembalikan scroll (cleanup) ketika pindah dari halaman login
     return () => {
       document.body.style.overflow = 'auto'; // atau ''
     };
   }, []);
   ```
3. Pastikan *container* / *wrapper* utama halaman login dirancang menggunakan flexbox atau grid dengan tinggi layar penuh (`h-screen` atau `min-h-screen` pada Tailwind) agar elemen login tetap berada tepat di tengah layar tanpa terpotong.
