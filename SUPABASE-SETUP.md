# 🚀 Setup Supabase untuk Fuel Calculator

## ✅ Status Koneksi
- **Project URL**: `https://dpnerteilzewxvndziit.supabase.co`
- **Anon Key**: Sudah terpasang di `script.js`
- **Status**: Siap digunakan!

## 📋 Langkah Setup Database

### 1. Buka Supabase SQL Editor
1. Buka dashboard Supabase: https://supabase.com/dashboard/project/dpnerteilzewxvndziit
2. Klik menu **SQL Editor** di sidebar kiri
3. Klik **New Query**

### 2. Jalankan SQL Setup
1. Buka file `supabase-setup.sql` di folder ini
2. **Copy SEMUA isi file** tersebut
3. **Paste** ke SQL Editor di Supabase
4. Klik tombol **Run** atau tekan `Ctrl + Enter`
5. Tunggu sampai muncul "Success. No rows returned"

### 3. Verifikasi Table Sudah Dibuat
1. Klik menu **Table Editor** di sidebar
2. Cek apakah table **shift_logs** sudah muncul
3. Table akan punya kolom:
   - `id` (primary key)
   - `created_at` (timestamp otomatis)
   - `time_start` (text)
   - `time_end` (text)
   - `meter_start` (decimal)
   - `meter_end` (decimal)
   - `total_usage` (decimal)
   - `cost` (decimal)
   - `note` (text, optional)

### 4. Test Aplikasi
1. Buka `index.html` di browser
2. Isi form perhitungan gas
3. Klik **Hitung & Simpan**
4. Cek di Supabase Table Editor → shift_logs
5. Data harus muncul di table!

## 🔥 Fitur yang Sudah Terkoneksi

✅ **Simpan data shift** ke Supabase otomatis
✅ **Load riwayat shift** dari database
✅ **Export history** ke JSON
✅ **Hapus semua log** dari database
✅ **Auto-fill meter awal** dari shift sebelumnya (localStorage)

## ⚠️ Keamanan

Saat ini aplikasi menggunakan **public access** (semua orang bisa baca/tulis).

Untuk production, sebaiknya:
1. Tambah autentikasi user
2. Update RLS policy untuk membatasi akses per user
3. Ganti anon key dengan service_role key di backend

## 🎯 Testing

Setelah setup selesai, coba:
1. Submit 2-3 form shift gas
2. Lihat apakah "Log Riwayat Shift Gas" muncul di bawah
3. Coba export JSON
4. Coba hapus log (clear history)

Kalau semua berfungsi = Setup Berhasil! 🎉
