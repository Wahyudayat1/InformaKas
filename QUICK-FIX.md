# ⚡ Quick Fix — Database Error

## 🎯 Solusi Cepat (3 Langkah)

### 1️⃣ **Jalankan SQL di Supabase**

Buka **Supabase Dashboard** → **SQL Editor** → **New query** → Copy-paste kode di bawah ini → **Run**

```sql
-- Tambah kolom 'note' jika belum ada
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'note'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN note TEXT;
  END IF;
END $$;

-- Buat tabel transaction_items jika belum ada
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id              UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id  UUID            NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_name    TEXT            NOT NULL,
  quantity        NUMERIC(10, 2)  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit            TEXT            DEFAULT 'pcs',
  unit_price      NUMERIC(15, 2)  NOT NULL CHECK (unit_price >= 0),
  subtotal        NUMERIC(15, 2)  GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at      TIMESTAMPTZ     DEFAULT NOW() NOT NULL
);

-- Buat index
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id
  ON public.transaction_items (transaction_id);

-- RLS untuk transaction_items
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read items" ON public.transaction_items;
DROP POLICY IF EXISTS "Authenticated users can insert items" ON public.transaction_items;
DROP POLICY IF EXISTS "Authenticated users can update items" ON public.transaction_items;
DROP POLICY IF EXISTS "Authenticated users can delete items" ON public.transaction_items;

CREATE POLICY "Public can read items"
  ON public.transaction_items FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert items"
  ON public.transaction_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update items"
  ON public.transaction_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete items"
  ON public.transaction_items FOR DELETE TO authenticated USING (true);
```

### 2️⃣ **Restart Next.js**

```powershell
# Tekan Ctrl+C, lalu:
npm run dev
```

### 3️⃣ **Test Form**

- Buka `/admin`
- Coba simpan transaksi **Uang Masuk** (iuran/donasi)
- Coba simpan transaksi **Uang Keluar** (belanja barang)
- ✅ Harus berhasil tanpa error!

---

## 📋 Checklist Verifikasi

Jalankan query ini di SQL Editor untuk memastikan struktur benar:

```sql
-- Cek kolom transactions (harus ada 'note')
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'transactions';

-- Cek relasi foreign key (harus ada 1 baris result)
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'transaction_items' 
  AND constraint_type = 'FOREIGN KEY';
```

**Output yang benar:**
- Kolom transactions: `id`, `date`, `description`, `category`, `amount`, `type`, `note`, `created_at`, `updated_at`
- Foreign key: ada 1 constraint dengan nama `transaction_items_transaction_id_fkey` (atau serupa)

---

## 🆘 Masih Error?

Lihat file lengkap: `DATABASE-FIX-INSTRUCTIONS.md` untuk troubleshooting detail.
