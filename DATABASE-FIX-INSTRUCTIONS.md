# 🔧 Panduan Perbaikan Database Error

## 🚨 Error yang Diperbaiki

1. ❌ **"Could not find a relationship between 'transactions' and 'transaction_items'"**
   - **Penyebab:** Tabel `transaction_items` belum dibuat atau foreign key belum ada
   
2. ❌ **"Could not find the 'note' column of 'transactions'"**
   - **Penyebab:** Kolom `note` belum ditambahkan ke tabel `transactions`

---

## ✅ Langkah Perbaikan

### **Langkah 1: Jalankan SQL Fix di Supabase**

1. Buka **Supabase Dashboard** → klik project kamu
2. Pilih menu **SQL Editor** di sidebar kiri
3. Klik tombol **"New query"**
4. Buka file `supabase-schema-fix.sql` di project ini
5. **Copy semua isi file** tersebut
6. **Paste** ke SQL Editor Supabase
7. Klik tombol **"Run"** (atau tekan `Ctrl+Enter`)

**Output yang diharapkan:**
```
NOTICE: Kolom note berhasil ditambahkan ke tabel transactions
NOTICE: ✓ Foreign key relationship antara transaction_items → transactions sudah ada
```

Jika muncul pesan tersebut, database sudah diperbaiki! ✅

---

### **Langkah 2: Restart Dev Server Next.js**

Setelah SQL selesai dijalankan, **restart server Next.js**:

```powershell
# Tekan Ctrl+C untuk stop server yang sedang berjalan

# Lalu jalankan ulang:
npm run dev
```

---

### **Langkah 3: Test Aplikasi**

1. **Buka halaman admin:** `http://localhost:3000/admin`
2. **Login** dengan akun admin Supabase kamu
3. **Test form Uang Masuk:**
   - Pilih **"Uang Masuk"**
   - Isi Keterangan: `Iuran Warga RT 03`
   - Isi Nominal: `500000`
   - Klik **Simpan Transaksi**
   - ✅ Harus berhasil tanpa error
   
4. **Test form Uang Keluar:**
   - Pilih **"Uang Keluar"**
   - Isi Keterangan: `Beli Air Galon`
   - Tambah item: `Air Galon`, qty `5`, harga `20000`
   - Total otomatis: `Rp 100.000`
   - Klik **Simpan Transaksi**
   - ✅ Harus berhasil tanpa error

5. **Cek halaman publik:** `http://localhost:3000`
   - ✅ Data transaksi harus muncul dengan detail item

---

## 🔍 Troubleshooting

### Jika masih ada error "schema cache":

**Solusi A: Clear cache Supabase**
1. Di Supabase Dashboard → **Settings** → **Database**
2. Scroll ke bawah → klik **"Reset database cache"** (jika ada)
3. Tunggu beberapa detik, lalu refresh browser

**Solusi B: Restart Supabase Project**
1. Di Supabase Dashboard → **Settings** → **General**
2. Scroll ke **Danger Zone** → klik **"Pause project"**
3. Tunggu sampai status jadi "Paused"
4. Klik **"Resume project"**
5. Tunggu ~1-2 menit sampai status jadi "Active"

### Jika error "new row violates check constraint":

Berarti ada data lama yang tidak valid. Hapus data contoh:

```sql
-- Jalankan di SQL Editor Supabase:
DELETE FROM public.transaction_items;
DELETE FROM public.transactions;
```

Lalu coba insert data baru via form admin.

---

## 📊 Verifikasi Manual di Supabase

Untuk memastikan struktur sudah benar, jalankan query ini di SQL Editor:

```sql
-- Cek kolom di tabel transactions
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'transactions'
ORDER BY ordinal_position;

-- Cek kolom di tabel transaction_items
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'transaction_items'
ORDER BY ordinal_position;

-- Cek foreign key
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'transaction_items';
```

**Output yang benar:**
- Tabel `transactions` harus punya kolom: `id`, `date`, `description`, `category`, `amount`, `type`, `note`, `created_at`, `updated_at`
- Tabel `transaction_items` harus punya foreign key: `transaction_id` → `transactions(id)`

---

## 📝 Catatan Penting

### Kolom yang TIDAK perlu ditambahkan:
❌ **Jangan buat kolom `manual_amount`** di database
- Kolom ini hanya ada di state React (form input)
- Nilainya langsung dipindahkan ke kolom `amount` saat simpan
- Kode frontend sudah diperbaiki untuk strip field ini

### Struktur Data Final:

**Tabel `transactions`:**
```
id              UUID (PK)
date            DATE
description     TEXT
category        TEXT (nullable)
amount          NUMERIC(15,2)
type            TEXT ('masuk' atau 'keluar')
note            TEXT (nullable) ← ditambahkan oleh script fix
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

**Tabel `transaction_items`:**
```
id              UUID (PK)
transaction_id  UUID (FK → transactions.id) ← relasi untuk fix error #1
product_name    TEXT
quantity        NUMERIC(10,2)
unit            TEXT
unit_price      NUMERIC(15,2)
subtotal        NUMERIC(15,2) (computed)
created_at      TIMESTAMPTZ
```

---

## ✨ Fitur yang Sekarang Berfungsi

Setelah perbaikan ini, semua fitur akan berjalan normal:

✅ **Uang Masuk (Iuran/Donasi/Sponsor)**
- Input nominal langsung tanpa detail item
- Field "Catatan" untuk info tambahan
- Kategori khusus: Iuran Warga, Donasi, Sponsor, dll.

✅ **Uang Keluar (Belanja Barang)**
- Detail item produk: nama, qty, satuan, harga
- Total otomatis dari item
- Tambah/hapus baris item dinamis

✅ **CRUD Lengkap**
- Buat, edit, hapus transaksi
- Data relasi (items) otomatis ikut terupdate/terhapus (CASCADE)

✅ **Cetak PDF**
- Struk per transaksi
- Rekap keseluruhan

✅ **Halaman Publik Read-Only**
- Tampil detail item inline
- Tombol cetak rekap PDF

---

## 🆘 Masih Ada Masalah?

Jika setelah mengikuti semua langkah di atas masih ada error:

1. **Screenshot error** yang muncul (termasuk panel Console/Network di browser DevTools)
2. **Cek log Supabase:** Dashboard → Settings → Logs → API
3. Pastikan file `.env.local` sudah benar:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```

---

**Happy coding! 🚀**
