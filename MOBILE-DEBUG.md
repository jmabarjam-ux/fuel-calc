# 📱 Mobile Debugging Guide

## 🔥 Fitur Baru - On-Screen Debug Console

Sekarang aplikasi punya **debug console** yang muncul di layar (bottom screen) untuk debugging di mobile!

## 📋 Cara Test di Mobile:

### 1️⃣ Buka Aplikasi
```
https://jmabarjam-ux.github.io/fuel-calc/
```
Atau buka file `index.html` langsung di mobile browser

### 2️⃣ Perhatikan Debug Console
- Debug console akan muncul **otomatis** di bottom screen
- Warna hijau = console.log
- Warna kuning = console.warn  
- Warna merah = console.error

### 3️⃣ Test Form Submit
Isi form:
- **Meter Awal**: 1000
- **Waktu Awal**: 07:00
- **Meter Akhir**: 1150
- **Waktu Akhir**: 15:00

Klik **"Hitung & Simpan"**

### 4️⃣ Lihat Log Messages
Debug console akan menampilkan:
```
🔵 Form submitted
📊 Data: {...}
💰 Kalkulasi: {...}
💾 Saving to Supabase...
✅ Saved to database: [...]
🧮 Mulai kalkulasi...
📈 Results: {...}
📊 Generating table...
📺 Displaying results...
📉 Updating chart...
✅ Done!
```

### 5️⃣ Cek Error Messages
Kalau ada error, akan muncul:
```
❌ Error saving data: [error message]
```
atau
```
⚠️ Supabase not initialized
```

## 🐛 Possible Errors & Solutions:

### ❌ "Supabase library not loaded"
**Problem**: CDN Supabase tidak load
**Solution**: 
- Cek koneksi internet
- Coba reload page
- Cek apakah CDN blocked

### ❌ "relation \"shift_logs\" does not exist"
**Problem**: Table belum dibuat di Supabase
**Solution**: 
- Buka Supabase dashboard
- Jalankan SQL dari `supabase-setup.sql`

### ⚠️ "Aplikasi berjalan offline"
**Problem**: Supabase client tidak terinisialisasi
**Solution**:
- Cek apakah Supabase library loaded
- Cek console untuk error detail

### 💥 "Kalkulasi tidak muncul"
**Problem**: JavaScript error
**Solution**:
- Lihat debug console di bottom screen
- Screenshot error message
- Share ke developer

## 📸 Screenshot untuk Report Bug

Kalau ada masalah, screenshot:
1. ✅ **Form yang diisi** (sebelum submit)
2. ✅ **Debug console** (message yang muncul)
3. ✅ **Alert/error message** (kalau ada)
4. ✅ **Hasil perhitungan** (kalau muncul/tidak muncul)

## 🔧 Matikan Debug Console

Kalau sudah selesai debugging, click tombol **X** di kanan atas debug console.

Atau developer bisa hapus seluruh `<div id="mobileDebug">` section dari `index.html`

## 🎯 Expected Behavior

**✅ Normal Flow:**
```
Submit → Logging → Save DB → Kalkulasi → Display Results → Toast
```

**⚠️ Offline Flow:**
```
Submit → Logging → Alert (offline) → Kalkulasi → Display Results → Toast
```

## 📞 Contact

Kalau masih error, kirim:
- Screenshot debug console
- Tipe HP & browser
- Error message lengkap
