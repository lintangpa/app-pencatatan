# Panduan Implementasi: Global Update - Fitur Light/Dark Mode

Dokumen ini berisi panduan bagi *junior developer* atau *AI model* untuk mengimplementasikan fitur peralihan tema terang dan gelap (Light/Dark Mode) yang terintegrasi secara global menggunakan `next-themes`.

---

### Tujuan Utama
Memberikan fleksibilitas bagi pengguna untuk mengganti tema aplikasi antara **Light Mode** dan **Dark Mode**. *Toggle* peralihan tema akan ditempatkan di dalam komponen Navbar.

---

### Tahapan Implementasi

#### 1. Instalasi Dependensi
Jalankan perintah berikut di terminal (pastikan berada di dalam folder `frontend`):
```bash
npm install next-themes
```

#### 2. Konfigurasi `globals.css` (Mendefinisikan Light Mode)
Saat ini, variabel `:root` dan `.dark` di file `frontend/src/app/globals.css` sama-sama menggunakan warna gelap (hitam). Ubah blok `:root` agar merepresentasikan warna terang (Light Mode), sedangkan `.dark` tetap untuk warna gelap.
Contoh penyesuaian `:root`:
```css
:root {
  --background: oklch(1 0 0); /* Putih */
  --foreground: oklch(0 0 0); /* Hitam */
  --card: oklch(0.98 0 0);
  --card-foreground: oklch(0 0 0);
  --popover: oklch(0.98 0 0);
  --popover-foreground: oklch(0 0 0);
  --primary: oklch(0.6 0.18 160); /* Tetap Hijau Terang */
  --primary-foreground: oklch(1 1 1);
  --secondary: oklch(0.95 0 0);
  --secondary-foreground: oklch(0 0 0);
  --muted: oklch(0.95 0 0);
  --muted-foreground: oklch(0.4 0 0);
  --accent: oklch(0.95 0 0);
  --accent-foreground: oklch(0 0 0);
  --destructive: oklch(0.6 0.2 25);
  --border: oklch(0.9 0 0);
  --input: oklch(0.9 0 0);
  --ring: oklch(0.6 0.18 160);
}
```
*(Jangan ubah blok `.dark`, biarkan seperti semula).*

#### 3. Membuat ThemeProvider
- Buat file baru di `frontend/src/components/theme-provider.jsx` (atau `.js`).
- Isi dengan komponen dasar `ThemeProvider` dari `next-themes`:
```jsx
"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

#### 4. Membungkus Root Layout
- Buka file `frontend/src/app/layout.js`.
- *Import* `ThemeProvider` yang baru saja dibuat.
- Bungkus seluruh elemen di dalam `<body>` dengan `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` agar tema bisa menyesuaikan preferensi sistem pengguna atau pilihan spesifik (Light/Dark).

#### 5. Menambahkan Tombol Toggle di Navbar
- Buka file `frontend/src/components/Navbar.jsx`.
- *Import* `useTheme` dari `next-themes`.
- *Import* icon `Sun` dan `Moon` dari `lucide-react`.
- Buat fungsi/tombol toggle di bagian pojok kanan Navbar (sebelah tombol menu mobile atau sejajar).
- **Logika Tombol**:
  Gunakan state bawaan `theme` dan fungsi `setTheme`.
  Jika `theme === 'dark'`, tampilkan icon `Sun` (klik untuk `setTheme('light')`).
  Jika `theme === 'light'`, tampilkan icon `Moon` (klik untuk `setTheme('dark')`).
  *(Catatan: pastikan ada penanganan *hydration mismatch* jika menggunakan tombol yang berbeda untuk *light/dark* dengan cara memastikan komponen sudah di-*mount*).*

---

**Instruksi Khusus untuk Junior Dev / AI Model:**
Karena aplikasi ini dibangun dengan Tailwind CSS v4, pergantian kelas `.dark` pada tag `<html>` yang ditangani oleh `next-themes` akan secara otomatis mengganti palet variabel CSS yang telah Anda sesuaikan di `globals.css`. Pastikan Anda menguji tombol pergantian tema (Toggle) pada antarmuka, dan periksa apakah teks (*foreground*) dan warna latar (*background*) dapat terbaca dengan baik di kedua mode.
