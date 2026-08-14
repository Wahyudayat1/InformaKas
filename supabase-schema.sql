-- ================================================================
-- BUKU KAS TRANSPARAN — Supabase Schema v2
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run
--
-- LANGKAH:
--   1. Jalankan seluruh script ini sekali
--   2. Jika sudah ada tabel lama, jalankan bagian DROP di bawah dulu
-- ================================================================

-- ----------------------------------------------------------------
-- (Opsional) Hapus tabel lama jika ingin mulai bersih
-- ----------------------------------------------------------------
-- DROP TABLE IF EXISTS public.transaction_items CASCADE;
-- DROP TABLE IF EXISTS public.transactions CASCADE;

-- ================================================================
-- 1. TABEL TRANSAKSI (header)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id           UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
  date         DATE            NOT NULL,
  description  TEXT            NOT NULL,
  category     TEXT,
  amount       NUMERIC(15, 2)  NOT NULL CHECK (amount > 0),
  type         TEXT            NOT NULL CHECK (type IN ('masuk', 'keluar')),
  note         TEXT,                        -- catatan tambahan opsional
  created_at   TIMESTAMPTZ     DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ     DEFAULT NOW() NOT NULL
);

-- ================================================================
-- 2. TABEL ITEM / PRODUK PER TRANSAKSI
--    Satu transaksi bisa punya banyak item (misal: beli 3 galon + 2 detergen)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id              UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id  UUID            NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_name    TEXT            NOT NULL,               -- nama produk/barang
  quantity        NUMERIC(10, 2)  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit            TEXT            DEFAULT 'pcs',          -- satuan: pcs, kg, liter, galon, dll.
  unit_price      NUMERIC(15, 2)  NOT NULL CHECK (unit_price >= 0),
  subtotal        NUMERIC(15, 2)  GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at      TIMESTAMPTZ     DEFAULT NOW() NOT NULL
);

-- ================================================================
-- 3. TRIGGER: auto-update kolom updated_at pada transactions
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_transactions_updated ON public.transactions;
CREATE TRIGGER on_transactions_updated
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ================================================================
-- 4. INDEX untuk performa
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON public.transactions (date DESC);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id
  ON public.transaction_items (transaction_id);

-- ================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Aktifkan RLS pada kedua tabel
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- Hapus policy lama jika ada (idempotent)
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "Public can read transactions"      ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can insert"    ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can update"    ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can delete"    ON public.transactions;

DROP POLICY IF EXISTS "Public can read items"             ON public.transaction_items;
DROP POLICY IF EXISTS "Authenticated users can insert items"  ON public.transaction_items;
DROP POLICY IF EXISTS "Authenticated users can update items"  ON public.transaction_items;
DROP POLICY IF EXISTS "Authenticated users can delete items"  ON public.transaction_items;

-- ----------------------------------------------------------------
-- POLICIES: transactions
-- ----------------------------------------------------------------

-- SELECT: siapa saja (publik / anon) boleh baca
CREATE POLICY "Public can read transactions"
  ON public.transactions FOR SELECT
  USING (true);

-- INSERT: hanya user yang sudah login
CREATE POLICY "Authenticated users can insert"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: hanya user yang sudah login
CREATE POLICY "Authenticated users can update"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: hanya user yang sudah login
CREATE POLICY "Authenticated users can delete"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- POLICIES: transaction_items
-- ----------------------------------------------------------------

-- SELECT: siapa saja boleh baca
CREATE POLICY "Public can read items"
  ON public.transaction_items FOR SELECT
  USING (true);

-- INSERT: hanya authenticated
CREATE POLICY "Authenticated users can insert items"
  ON public.transaction_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: hanya authenticated
CREATE POLICY "Authenticated users can update items"
  ON public.transaction_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: hanya authenticated
CREATE POLICY "Authenticated users can delete items"
  ON public.transaction_items FOR DELETE
  TO authenticated
  USING (true);

-- ================================================================
-- 6. DATA CONTOH (hapus jika tidak perlu)
-- ================================================================
INSERT INTO public.transactions (date, description, category, amount, type, note) VALUES
  ('2024-01-05', 'Donasi awal operasional komunitas', 'Donasi',     5000000,  'masuk',  'Donasi dari pak Budi'),
  ('2024-01-10', 'Pembelian perlengkapan kebersihan',  'Operasional', 185000,  'keluar', NULL),
  ('2024-01-15', 'Iuran anggota bulan Januari',        'Iuran',      2500000,  'masuk',  '25 anggota × Rp 100.000'),
  ('2024-02-01', 'Sponsor acara peluncuran',            'Sponsor',   10000000, 'masuk',  NULL),
  ('2024-02-08', 'Pembelian air galon & sembako',       'Kebutuhan',   335000,  'keluar', NULL)
ON CONFLICT DO NOTHING;

-- Ambil ID transaksi pembelian perlengkapan kebersihan untuk insert item
WITH t AS (
  SELECT id FROM public.transactions
  WHERE description = 'Pembelian perlengkapan kebersihan' LIMIT 1
)
INSERT INTO public.transaction_items (transaction_id, product_name, quantity, unit, unit_price)
SELECT t.id, 'Sapu', 2, 'pcs', 25000 FROM t
UNION ALL
SELECT t.id, 'Pel lantai', 1, 'pcs', 45000 FROM t
UNION ALL
SELECT t.id, 'Sabun cuci', 3, 'pcs', 15000 FROM t
UNION ALL
SELECT t.id, 'Kain lap', 4, 'pcs', 10000 FROM t;

WITH t AS (
  SELECT id FROM public.transactions
  WHERE description = 'Pembelian air galon & sembako' LIMIT 1
)
INSERT INTO public.transaction_items (transaction_id, product_name, quantity, unit, unit_price)
SELECT t.id, 'Air Galon', 5, 'galon', 20000 FROM t
UNION ALL
SELECT t.id, 'Beras', 5, 'kg', 15000 FROM t
UNION ALL
SELECT t.id, 'Minyak Goreng', 2, 'liter', 20000 FROM t;
