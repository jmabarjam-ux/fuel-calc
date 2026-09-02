# 📱 Mobile Troubleshooting Guide

## ⚠️ Problem: Tidak Bisa Menghitung di Ponsel

Kalau form tidak bisa submit atau hasil tidak muncul di mobile, ikuti langkah debug ini:

## 🔍 Step-by-Step Debugging:

### 1️⃣ Buka Aplikasi di Mobile
```
https://github.com/jmabarjam-ux/fuel-calc
atau
file:///path/to/index.html
```

### 2️⃣ Lihat Debug Console (Bottom Screen)
Setelah page load, debug console **hijau** akan muncul di bawah layar dengan message:
```
[time] 🚀 App initialized
[time] 📱 User Agent: Mozilla/5.0...
[time] 🖥️ Screen: 375x667
```

✅ **Kalau muncul** → App berhasil load
❌ **Kalau TIDAK muncul** → Ada problem JavaScript load

### 3️⃣ Isi Form & Submit
Isi form:
- Meter Awal: **1000**
- Waktu Awal: **07:00**
- Meter Akhir: **1200**
- Waktu Akhir: **15:00**

Klik **"Hitung & Simpan"**

### 4️⃣ Lihat Log Messages
Debug console harus menampilkan:
```
[time] 🔵 Form submitted - START
[time] 📋 Elements found: Y, Y, Y, Y
[time] 📊 Data: Meter 1000->1200, Time 07:00->15:00
[time] ✅ Validation passed
[time] 💰 Total usage: 200
[time] 💾 Saving to Supabase...
[time] ✅ Saved to database
[time] 🧮 Mulai kalkulasi...
[time] 📈 Duration: 8.00h, Avg: 25.00 m³/h
[time] 📺 Updating UI summary...
[time] 📊 Generating table...
[time] 📺 Displaying results...
[time] 📉 Updating chart...
[time] ✅ Done!
```

## 🐛 Possible Errors & Solutions:

### ❌ Error: "Elements found: N, N, N, N"
**Problem**: Form elements tidak ditemukan
**Cause**: Script.js load sebelum HTML ready
**Solution**: 
- Hard refresh (Ctrl+Shift+R)
- Clear cache browser
- Check console untuk error

### ❌ Error: "Validation fail: meter akhir < awal"
**Problem**: Meter akhir lebih kecil dari meter awal
**Solution**: Pastikan Meter Akhir > Meter Awal

### ❌ Error: "Supabase library not loaded"
**Problem**: CDN Supabase gagal load
**Cause**: Internet lemah atau CDN blocked
**Solution**: 
- Check koneksi internet
- Reload page
- App tetap bisa jalan (offline mode)

### ❌ Error: "relation shift_logs does not exist"
**Problem**: Table database belum dibuat
**Solution**: Jalankan SQL dari `supabase-setup.sql`

### ⚠️ Warning: "Aplikasi berjalan offline"
**Problem**: Supabase tidak terkoneksi
**Impact**: Data tidak tersimpan ke database
**Solution**: 
- Check internet
- Reload page
- Tapi kalkulasi tetap jalan ✓

### 💥 Error: "FATAL ERROR: ..."
**Problem**: JavaScript exception
**Solution**: 
- Screenshot error message
- Screenshot debug console
- Report ke developer dengan detail:
  - Tipe HP & Browser
  - Error message lengkap
  - Screenshot debug console

## 📸 Screenshot yang Dibutuhkan:

Kalau masih error, ambil screenshot:
1. ✅ **Debug console** (hijau di bawah) - Full messages
2. ✅ **Form yang diisi** (sebelum submit)
3. ✅ **Error alert** (kalau ada)
4. ✅ **Browser console** (F12 atau remote debug)

## 🔧 Advanced Debugging (Developer):

### Remote Debug Android:
```
1. Chrome Desktop → chrome://inspect
2. Enable USB debugging di HP
3. Connect HP ke PC via USB
4. Inspect WebView
5. Lihat console log detail
```

### Remote Debug iOS:
```
1. Safari Desktop → Develop menu
2. Enable Web Inspector di iOS Settings
3. Connect iPhone ke Mac
4. Inspect page
5. Lihat console log detail
```

## 🎯 Common Issues:

### Issue #1: Input Type="time" Tidak Muncul
**Browser**: Browser lama tidak support `<input type="time">`
**Solution**: Update browser atau gunakan desktop

### Issue #2: Submit Button Tidak Respond
**Cause**: Form validation error atau JavaScript error
**Check**: Lihat debug console untuk error

### Issue #3: Hasil Muncul Tapi Tidak Lengkap
**Cause**: Chart.js gagal render atau table generation error
**Check**: Debug console line "📊 Generating table..."

### Issue #4: WhatsApp Share Tidak Buka
**Cause**: WhatsApp app tidak installed
**Solution**: Install WhatsApp atau gunakan Web

## 💡 Quick Test:

**Test Minimal:**
```
1. Buka page → Debug console muncul? ✓
2. Isi form → Field bisa diisi? ✓
3. Submit → Debug log muncul? ✓
4. Hasil → Stats + grafik + tabel muncul? ✓
```

Kalau salah satu step gagal, screenshot dan report!

## 📞 Contact Developer:

Kirim via chat dengan info:
- HP: [merek & model]
- Browser: [nama & versi]
- Screenshot debug console
- Langkah yang dilakukan
- Error message lengkap

---

**Last Update**: Commit `c9dfdb2` - Enhanced logging for mobile
