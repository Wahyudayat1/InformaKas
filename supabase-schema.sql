-- ================================================================
-- BUKU KAS TRANSPARAN — Schema Fix & Migration
-- Jalankan di: Supabase Dashboard → SQL Editor → Run
--
-- Script ini aman dijalankan berkali-kali (idempotent).
-- Akan membuat tabel baru jika belum ada, atau menambah kolom
-- yang missing jika tabel sudah ada.
-- ================================================================

-- ================================================================
-- 1. BUAT / PERBARUI TABEL TRANSACTIONS
-- ================================================================

-- Buat tabel jika belum ada
CREATE TABLE IF NOT EXISTS public.transactions (
  id           UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
  date         DATE            NOT NULL,
  description  TEXT            NOT NULL,
  category     TEXT,
  amount       NUMERIC(15, 2)  NOT NULL CHECK (amount > 0),
  type         TEXT            NOT NULL CHECK (type IN ('masuk', 'keluar')),
  created_at   TIMESTAMPTZ     DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ     DEFAULT NOW() NOT NULL
);

-- Tambahkan kolom 'note' jika belum ada (FIX ERROR #2)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'note'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN note TEXT;
    RAISE NOTICE 'Kolom note berhasil ditambahkan ke tabel transactions';
  ELSE
    RAISE NOTICE 'Kolom note sudah ada di tabel transactions';
  END IF;
END $$;

-- ================================================================
-- 2. BUAT / PERBARUI TABEL TRANSACTION_ITEMS (FIX ERROR #1)
-- ================================================================

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

-- ================================================================
-- 3. TRIGGER: auto-update kolom updated_at
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

-- Aktifkan RLS
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- Hapus semua policy lama (idempotent)
DROP POLICY IF EXISTS "Public can read transactions"           ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can insert"         ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can update"         ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can delete"         ON public.transactions;
DROP POLICY IF EXISTS "Public can read items"                  ON public.transaction_items;
DROP POLICY IF EXISTS "Authenticated users can insert items"   ON public.transaction_items;
DROP POLICY IF EXISTS "Authenticated users can update items"   ON public.transaction_items;
DROP POLICY IF EXISTS "Authenticated users can delete items"   ON public.transaction_items;

-- Buat policy baru
-- TRANSACTIONS
CREATE POLICY "Public can read transactions"
  ON public.transactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (true);

-- TRANSACTION_ITEMS
CREATE POLICY "Public can read items"
  ON public.transaction_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert items"
  ON public.transaction_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update items"
  ON public.transaction_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete items"
  ON public.transaction_items FOR DELETE
  TO authenticated
  USING (true);

-- ================================================================
-- 6. VERIFIKASI STRUKTUR
-- ================================================================

-- Query untuk memverifikasi bahwa semua kolom ada
DO $$
DECLARE
  tx_cols TEXT[];
  item_cols TEXT[];
BEGIN
  -- Cek kolom di transactions
  SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
  INTO tx_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'transactions';
  
  RAISE NOTICE 'Kolom di transactions: %', tx_cols;
  
  -- Cek kolom di transaction_items
  SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
  INTO item_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'transaction_items';
  
  RAISE NOTICE 'Kolom di transaction_items: %', item_cols;
  
  -- Cek foreign key
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'transaction_items'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE NOTICE '✓ Foreign key relationship antara transaction_items → transactions sudah ada';
  ELSE
    RAISE WARNING '✗ Foreign key relationship BELUM ada!';
  END IF;
END $$;

-- ================================================================
-- SELESAI
-- ================================================================
-- Jika output di panel Result menampilkan:
--   - "Kolom note berhasil ditambahkan" → Error #2 fixed
--   - "✓ Foreign key relationship sudah ada" → Error #1 fixed
--
-- Restart dev server Next.js setelah script ini selesai:
--   npm run dev
-- ================================================================
