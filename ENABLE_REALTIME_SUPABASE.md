# ⚡ Enable Supabase Realtime

Panduan mengaktifkan Supabase Realtime untuk fitur auto-sync.

---

## 🎯 Mengapa Perlu Diaktifkan?

Supabase Realtime **TIDAK aktif secara default** untuk setiap tabel. Anda harus mengaktifkannya manual di dashboard agar halaman publik bisa auto-update saat admin melakukan CRUD.

---

## ✅ Cara Aktifkan Realtime

### Method 1: Via Supabase Dashboard (Paling Mudah)

1. **Login ke Supabase Dashboard**
   - Buka https://supabase.com/dashboard
   - Pilih project Anda

2. **Buka Database → Replication**
   - Klik menu **Database** di sidebar kiri
   - Pilih tab **Replication**

3. **Enable Realtime untuk tabel `transactions`**
   - Cari tabel **`transactions`** di list
   - Toggle switch **"Enable Realtime"** menjadi **ON** (hijau)
   - Klik **Save** jika ada

4. **Verifikasi**
   - Pastikan ada tanda centang hijau ✅ atau toggle aktif
   - Status harus: **"Realtime enabled"**

---

### Method 2: Via SQL Editor

Jika method 1 tidak berfungsi, jalankan SQL ini:

```sql
-- Enable Realtime untuk tabel transactions
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
```

**Cara menjalankan:**
1. Dashboard → **SQL Editor**
2. Klik **New Query**
3. Paste SQL di atas
4. Klik **Run** atau tekan `Ctrl+Enter`

---

## 🧪 Test Apakah Sudah Aktif

### Test di Browser Console:

1. **Buka halaman publik:** `http://localhost:3000`
2. **Buka Developer Tools:** Tekan `F12`
3. **Buka tab Console**
4. **Buka tab admin di browser lain:** `http://localhost:3000/admin`
5. **Tambah transaksi di admin**
6. **Lihat console halaman publik**, seharusnya ada log:

```
🔄 Realtime change detected: {eventType: 'INSERT', ...}
```

Jika tidak ada log, berarti Realtime belum aktif!

---

## 🚨 Troubleshooting

### 1. Log Console: "Failed to connect to Realtime"

**Problem:** Realtime belum enabled di Supabase

**Solution:**
- Pastikan sudah enable di **Database → Replication**
- Tunggu 30 detik setelah enable (propagation time)
- Refresh halaman publik

---

### 2. Tidak ada log "Realtime change detected"

**Problem:** Subscription gagal atau Realtime tidak broadcasting

**Check:**
```javascript
// Tambahkan ini di console browser (halaman publik)
const supabase = window.supabase; // Jika exposed
console.log('Channels:', supabase.getChannels());
```

**Expected output:**
```javascript
[
  {
    state: "joined",
    topic: "realtime:public-transactions-changes"
  }
]
```

Jika `state: "closed"` atau array kosong, berarti subscription gagal.

---

### 3. Realtime bekerja tapi data tidak update

**Problem:** Re-fetch query error atau state tidak update

**Check di Console:**
- Seharusnya ada log: `"🔄 Realtime change detected"`
- Lalu ada network request ke Supabase (check tab **Network**)

**Solution:**
- Cek apakah ada error di console
- Pastikan RLS (Row Level Security) tidak block query

---

## 📊 Quota Free Tier

**Supabase Free Tier Limits:**
- ✅ 2 million Realtime messages/month
- ✅ 200 concurrent connections
- ✅ Unlimited channels

Untuk aplikasi buku kas, ini sudah lebih dari cukup!

---

## ✅ Success Indicator

Realtime **SUDAH AKTIF** jika:

✅ Toggle "Enable Realtime" ON di dashboard  
✅ Console browser ada log `"🔄 Realtime change detected"`  
✅ Data di halaman publik **auto-update tanpa refresh manual**  
✅ Saldo, total masuk/keluar berubah real-time  

---

**Setelah aktifkan Realtime, restart dev server:**
```bash
npm run dev
```

Lalu test dengan buka 2 tab browser (admin + publik) dan lakukan CRUD di admin!

