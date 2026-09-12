# 🧪 Panduan Testing Real-time Sync

Ikuti langkah-langkah ini untuk memastikan fitur real-time sync bekerja sempurna.

---

## 📋 Prerequisites

✅ Supabase project sudah setup  
✅ Environment variables sudah di `.env.local`  
✅ Database schema sudah di-run  
✅ User admin sudah terdaftar  
✅ **Supabase Realtime SUDAH DIAKTIFKAN** (lihat [ENABLE_REALTIME_SUPABASE.md](./ENABLE_REALTIME_SUPABASE.md))

---

## 🚀 Test Scenario

### 1. Setup Testing Environment

```bash
# Jalankan dev server
npm run dev
```

Server akan berjalan di:
- `http://localhost:3000` (atau port lain jika 3000 sudah dipakai)

### 2. Buka 2 Tab Browser

**Tab 1 (Publik):** `http://localhost:3000`
- Halaman publik (read-only)
- Akan menampilkan data transaksi real-time

**Tab 2 (Admin):** `http://localhost:3000/admin`
- Login dengan akun admin Supabase
- Panel CRUD untuk manage transaksi

**💡 TIP:** Letakkan kedua tab side-by-side agar bisa lihat perubahan langsung!

---

## ✅ Test Case 1: CREATE (Tambah Transaksi)

### Steps:

1. **Di Tab Publik:**
   - Catat jumlah transaksi saat ini (misal: "5 transaksi")
   - Catat nilai **Saldo Saat Ini**: Rp 1.000.000

2. **Di Tab Admin:**
   - Scroll ke form "Tambah Transaksi"
   - Pilih **Tipe: Uang Masuk**
   - Isi form:
     - Tanggal: Hari ini
     - Keterangan: **"Test Real-time Sync"**
     - Kategori: **"Donasi"**
     - Jumlah: **100000**
   - Klik **Simpan**
   - Toast muncul: "Transaksi berhasil ditambahkan!"

3. **Expected Result di Tab Publik:**

   ✅ Jumlah transaksi bertambah: "5 transaksi" → **"6 transaksi"**  
   ✅ Saldo Saat Ini: Rp 1.000.000 → **Rp 1.100.000**  
   ✅ Total Pemasukan bertambah **Rp 100.000**  
   ✅ Transaksi "Test Real-time Sync" muncul di tabel **paling atas**  
   ✅ **TANPA manual refresh browser!**  
   ⏱️ Update time: **~1-2 detik**

---

## ✏️ Test Case 2: UPDATE (Edit Transaksi)

### Steps:

1. **Di Tab Admin:**
   - Cari transaksi "Test Real-time Sync"
   - Klik tombol **Edit** (icon pensil)
   - Form ter-populate dengan data existing
   - Ubah **Jumlah: 100000** → **200000**
   - Klik **Update**
   - Toast: "Transaksi berhasil diperbarui!"

2. **Expected Result di Tab Publik:**

   ✅ Jumlah transaksi **tetap** (tidak berubah)  
   ✅ Saldo Saat Ini: Rp 1.100.000 → **Rp 1.200.000** (+Rp 100.000)  
   ✅ Total Pemasukan bertambah **Rp 100.000**  
   ✅ Nilai transaksi "Test Real-time Sync": Rp 100.000 → **Rp 200.000**  
   ✅ **TANPA manual refresh browser!**

---

## 🗑️ Test Case 3: DELETE (Hapus Transaksi)

### Steps:

1. **Di Tab Admin:**
   - Cari transaksi "Test Real-time Sync"
   - Klik tombol **Hapus** (merah)
   - Dialog konfirmasi muncul
   - Klik **Hapus** di dialog
   - Toast: "Transaksi berhasil dihapus"

2. **Expected Result di Tab Publik:**

   ✅ Jumlah transaksi berkurang: "6 transaksi" → **"5 transaksi"**  
   ✅ Saldo Saat Ini: Rp 1.200.000 → **Rp 1.000.000** (-Rp 200.000)  
   ✅ Total Pemasukan berkurang **Rp 200.000**  
   ✅ Transaksi "Test Real-time Sync" **hilang** dari tabel  
   ✅ **TANPA manual refresh browser!**

---

## 🎯 Test Case 4: Rapid CRUD Operations

Test multiple operations dalam waktu singkat:

1. **Di Tab Admin (lakukan cepat berurutan):**
   - Tambah 3 transaksi baru (mixed masuk/keluar)
   - Edit 1 transaksi existing
   - Hapus 1 transaksi

2. **Expected Result di Tab Publik:**
   
   ✅ Semua perubahan ter-reflect secara **sequential**  
   ✅ Tidak ada data **duplicate** atau **missing**  
   ✅ Saldo selalu **akurat** dan **konsisten**  
   ✅ Tidak ada **race condition** atau **UI glitch**

---

## 🌐 Test Case 5: Multi-Device Sync

Test dari perangkat berbeda (opsional):

1. **Device 1 (HP):**
   - Buka `http://[your-laptop-ip]:3000`
   - Contoh: `http://192.168.1.100:3000`

2. **Device 2 (Laptop):**
   - Buka `http://localhost:3000/admin`
   - Login dan lakukan CRUD

3. **Expected Result di HP:**
   
   ✅ Data sync ke HP secara real-time  
   ✅ Latency masih acceptable (<3 detik)

**💡 Cara cek IP laptop:**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

---

## 🐛 Troubleshooting

### ❌ Data TIDAK update otomatis di halaman publik

**Check Console Browser:**

1. Buka Tab Publik
2. Tekan `F12` → tab **Console**
3. Lakukan CRUD di tab admin
4. Lihat console, seharusnya ada:

```
🔄 Realtime change detected: {eventType: 'INSERT', ...}
```

**Jika TIDAK ada log:**

❌ **Problem:** Supabase Realtime belum enabled

**Solution:**
1. Buka Supabase Dashboard
2. **Database** → **Replication**
3. Enable Realtime untuk tabel `transactions`
4. Tunggu 30 detik, lalu refresh halaman publik

Lihat panduan lengkap: [ENABLE_REALTIME_SUPABASE.md](./ENABLE_REALTIME_SUPABASE.md)

---

### ❌ Error: "Failed to connect to Realtime"

**Check:**
1. Environment variables di `.env.local`
2. Supabase project status (tidak down)
3. Internet connection

**Fix:**
```bash
# Restart dev server
npm run dev
```

---

### ❌ Cache tidak clear di production (Vercel)

**Problem:** Revalidation tidak bekerja di Vercel

**Check:**
- Pastikan file `src/app/actions/revalidate.js` sudah di-deploy
- Lihat Vercel Function Logs untuk error

**Solution:**
```bash
# Re-deploy ke Vercel
git push origin main
```

---

## ✅ Success Criteria

Test dianggap **LULUS** jika:

✅ 100% CRUD operations ter-reflect di halaman publik  
✅ Update latency **< 3 detik**  
✅ Tidak ada data loss atau duplicate  
✅ Saldo selalu konsisten dan akurat  
✅ Tidak ada console error  
✅ Bekerja di multiple tabs/devices  

---

## 📊 Performance Benchmark

| Metric | Target | Acceptable |
|--------|--------|------------|
| Update latency | < 1s | < 3s |
| Re-fetch time | < 500ms | < 1s |
| Memory usage | < 50MB | < 100MB |
| No memory leak | 30+ min | 1+ hour |

**Test memory leak:**
1. Buka halaman publik
2. Biarkan open 30 menit
3. Lakukan CRUD di admin secara berkala
4. Check memory di Task Manager

Expected: memory usage **stabil**, tidak terus naik.

---

## 🎉 Next Steps

Setelah semua test **LULUS**:

1. ✅ Deploy ke Vercel
2. ✅ Test di production URL
3. ✅ Share dengan stakeholder
4. ✅ Monitor Supabase quota

---

**Happy Testing! 🚀**

