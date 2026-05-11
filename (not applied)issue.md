# Task: Fitur Statistics (Analisis Data & Tren Keuangan)

Tugas ini adalah membangun endpoint **Statistics**. Perbedaan utama dengan fitur *Dashboard* adalah: Dashboard fokus pada "Ringkasan Cepat Bulan Berjalan" (Current Month), sedangkan fitur *Statistics* berfokus pada **Analisis Tren dan Pola (Pattern)** dari waktu ke waktu. 

Data yang dihasilkan oleh API ini harus diformat sedemikian rupa agar sangat mudah dikonsumsi oleh pustaka *Charting* (seperti Chart.js atau Recharts) di *Frontend*.

## Objektif Fitur
Memberikan data untuk menampilkan:
- Tren pengeluaran dan pemasukan bulanan (selama satu tahun).
- Menghitung rata-rata pengeluaran bulanan.
- Menemukan kategori yang "paling sering digunakan" (berdasarkan frekuensi/jumlah transaksi, bukan sekadar nominal).
- Perbandingan (*Comparison*) pengeluaran bulan ini versus bulan lalu.

---

## Tahapan Pembuatan API Endpoint

Buat endpoint berikut di backend (misal: `index.js`). **Wajib** gunakan middleware `authenticate` untuk menjaga privasi data.

**Endpoint:** `GET /api/statistics`
**Query Parameter:** `?year=2026` *(Opsional. Jika tidak dikirim, gunakan tahun berjalan/current year dari server).*

Karena kueri untuk statistik cukup berat jika digabung di satu baris SQL, pecahlah menjadi 3 langkah logika berikut:

### Langkah 1: Analisis Tren Bulanan (Cash Flow)
Lakukan kueri untuk mendapatkan total pemasukan dan pengeluaran **dikategorikan per bulan** dalam satu tahun.

**Kueri SQL:**
```sql
SELECT 
    MONTH(transaction_date) as month_number,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
FROM transactions
WHERE user_id = ? AND YEAR(transaction_date) = ?
GROUP BY MONTH(transaction_date)
ORDER BY month_number ASC
```
**Tahapan di NodeJS:**
- Setelah mendapatkan array dari DB, hitunglah **Rata-Rata Pengeluaran Bulanan** (`average_monthly_expense`) di Javascript: yaitu jumlahkan seluruh `total_expense` dibagi dengan jumlah bulan yang memiliki pengeluaran.

### Langkah 2: Analisis Pola Pengeluaran (Spending Pattern)
Cari tahu 5 kategori pengeluaran yang **paling sering** terjadi transaksinya di tahun tersebut. (Cocok untuk visualisasi Pie Chart).

**Kueri SQL:**
```sql
SELECT 
    cb.name as category_name,
    COUNT(t.id) as transaction_count,
    SUM(t.amount) as total_amount
FROM transactions t
JOIN category_budgets cb ON t.category_budget_id = cb.id
WHERE t.user_id = ? AND t.type = 'expense' AND YEAR(t.transaction_date) = ?
GROUP BY cb.id, cb.name
ORDER BY transaction_count DESC
LIMIT 5
```

### Langkah 3: Perbandingan Antar Bulan (Month over Month Comparison)
Bandingkan total pengeluaran bulan berjalan (*Current Month*) dengan bulan sebelumnya (*Last Month*). 

**Tahapan di NodeJS:**
1. Dapatkan angka bulan/tahun saat ini dan bulan/tahun sebelumnya.
2. Buat kueri sederhana untuk mendapatkan `SUM(amount)` tipe `expense` dari transaksi bulan ini.
3. Buat kueri yang sama untuk transaksi bulan lalu.
4. Hitung selisih persentasenya di Javascript: 
   `percentage_change = ((current_expense - last_month_expense) / last_month_expense) * 100`
   *(Atasi pembagian dengan nol jika bulan lalu belum ada pengeluaran)*.

### Langkah 4: Susun Response JSON
Gabungkan seluruh hasil dari ketiga langkah di atas ke dalam satu *response*:

```json
{
    "year": 2026,
    "average_monthly_expense": 2500000,
    "monthly_trends": [
        { "month": 4, "total_income": 8000000, "total_expense": 2000000 },
        { "month": 5, "total_income": 9000000, "total_expense": 3000000 }
    ],
    "top_frequent_categories": [
        { "category_name": "Makan", "transaction_count": 25, "total_amount": 1500000 },
        { "category_name": "Transport", "transaction_count": 10, "total_amount": 500000 }
    ],
    "month_comparison": {
        "current_month_expense": 3000000,
        "last_month_expense": 2000000,
        "expense_increase_percentage": 50.0 
    }
}
```
*(Catatan: `expense_increase_percentage` positif berarti pengeluaran lebih boros dibanding bulan lalu, negatif berarti lebih hemat).*

---
**Pesan Khusus untuk Junior Dev / AI Executor:**
Tugas utama pembuatan statistik adalah **Meringankan beban Frontend**. Sebisa mungkin kerjakan agregasi berat (Grouping, Counting, Summing) di SQL, dan gunakan NodeJS hanya untuk operasi matematis ringan (Averaging dan Persentase). 
