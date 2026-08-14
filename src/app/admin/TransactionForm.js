"use client";

import { useState, useEffect } from "react";

// ─── Helpers ────────────────────────────────────────────────────
function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_ITEM = { product_name: "", quantity: "1", unit: "pcs", unit_price: "" };

const EMPTY_FORM = {
  date: today(),
  description: "",
  category: "",
  type: "keluar",
  note: "",
  manual_amount: "", // hanya dipakai saat type === "masuk"
};

// Kategori dipisah per tipe agar relevan
const CATEGORY_MASUK = [
  "Iuran Warga",
  "Donasi",
  "Sponsor",
  "Dana Hibah",
  "Penjualan",
  "Pengembalian Dana",
  "Lainnya (Masuk)",
];

const CATEGORY_KELUAR = [
  "Operasional",
  "Kebutuhan",
  "Gaji",
  "Transportasi",
  "Konsumsi",
  "Kegiatan",
  "Perlengkapan",
  "Utilitas",
  "Lainnya (Keluar)",
];

const UNIT_OPTIONS = [
  "pcs", "kg", "gram", "liter", "galon", "pak",
  "lusin", "meter", "lembar", "buah", "unit", "porsi",
];

// ─── Baris item produk (hanya untuk tipe keluar) ─────────────────
function ItemRow({ item, index, onChange, onRemove, canRemove }) {
  const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);

  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      {/* Nama Produk */}
      <div className="col-span-12 sm:col-span-4">
        <input
          type="text"
          className="input text-xs"
          placeholder="Nama produk / barang"
          value={item.product_name}
          onChange={(e) => onChange(index, "product_name", e.target.value)}
          required
        />
      </div>
      {/* Qty */}
      <div className="col-span-3 sm:col-span-2">
        <input
          type="number"
          min="0.01"
          step="any"
          className="input text-xs text-center"
          placeholder="Qty"
          value={item.quantity}
          onChange={(e) => onChange(index, "quantity", e.target.value)}
          required
        />
      </div>
      {/* Satuan */}
      <div className="col-span-3 sm:col-span-2">
        <select
          className="input text-xs"
          value={item.unit}
          onChange={(e) => onChange(index, "unit", e.target.value)}
        >
          {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      {/* Harga Satuan */}
      <div className="col-span-5 sm:col-span-3 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
          Rp
        </span>
        <input
          type="number"
          min="0"
          step="any"
          className="input text-xs pl-8"
          placeholder="Harga"
          value={item.unit_price}
          onChange={(e) => onChange(index, "unit_price", e.target.value)}
          required
        />
      </div>
      {/* Subtotal + tombol hapus */}
      <div className="col-span-12 sm:col-span-1 flex sm:flex-col items-center justify-between sm:justify-center gap-1">
        <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
          {formatRupiah(subtotal)}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
            aria-label="Hapus item"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Fungsi cetak struk PDF via window.print ────────────────────
export function printStruk(transaction, items) {
  const formatRp = (n) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(n) || 0);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const itemRows =
    items.length > 0
      ? items
          .map(
            (it) => `
        <tr>
          <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;">${it.product_name}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;text-align:center;">${it.quantity} ${it.unit}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;text-align:right;">${formatRp(it.unit_price)}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">${formatRp(
            it.subtotal ?? it.quantity * it.unit_price
          )}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="4" style="padding:12px 8px;text-align:center;color:#94a3b8;font-style:italic;">Tidak ada detail item</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Struk Transaksi</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; font-size:12px; color:#1e293b; background:white; }
    .wrapper { max-width:480px; margin:0 auto; padding:24px 20px; }
    .header { text-align:center; margin-bottom:20px; border-bottom:2px solid #e2e8f0; padding-bottom:16px; }
    .logo { font-size:18px; font-weight:700; color:#059669; }
    .sub { font-size:11px; color:#64748b; margin-top:2px; }
    .title { font-size:13px; font-weight:700; margin:14px 0 8px; color:#0f172a; }
    .meta { background:#f8fafc; border-radius:8px; padding:12px; margin-bottom:14px; }
    .meta-row { display:flex; justify-content:space-between; margin-bottom:4px; }
    .meta-row:last-child { margin-bottom:0; }
    .meta-label { color:#64748b; }
    .meta-value { font-weight:600; }
    table { width:100%; border-collapse:collapse; margin-bottom:12px; }
    thead th { background:#f1f5f9; padding:6px 8px; text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#475569; }
    thead th:nth-child(2) { text-align:center; }
    thead th:nth-child(3), thead th:nth-child(4) { text-align:right; }
    .total-row { display:flex; justify-content:space-between; padding:10px 0; border-top:2px solid #e2e8f0; }
    .total-label { font-weight:700; font-size:13px; }
    .total-value { font-weight:700; font-size:14px; }
    .total-value.masuk { color:#059669; }
    .total-value.keluar { color:#e11d48; }
    .note-box { background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:8px 10px; font-size:11px; color:#92400e; margin-bottom:14px; }
    .footer { text-align:center; font-size:10px; color:#94a3b8; margin-top:20px; border-top:1px solid #e2e8f0; padding-top:12px; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">📒 Buku Kas Transparan</div>
    <div class="sub">Bukti Transaksi Resmi</div>
  </div>
  <div class="meta">
    <div class="meta-row">
      <span class="meta-label">Tanggal</span>
      <span class="meta-value">${formatDate(transaction.date)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Tipe</span>
      <span class="meta-value" style="color:${transaction.type === "masuk" ? "#059669" : "#e11d48"}">
        ${transaction.type === "masuk" ? "▲ Uang Masuk" : "▼ Uang Keluar"}
      </span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Kategori</span>
      <span class="meta-value">${transaction.category || "—"}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Keterangan</span>
      <span class="meta-value">${transaction.description}</span>
    </div>
  </div>
  ${transaction.note ? `<div class="note-box">📝 ${transaction.note}</div>` : ""}
  <div class="title">Detail Item</div>
  <table>
    <thead>
      <tr>
        <th>Produk</th><th>Qty</th><th>Harga Satuan</th><th>Subtotal</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="total-row">
    <span class="total-label">TOTAL</span>
    <span class="total-value ${transaction.type}">${formatRp(transaction.amount)}</span>
  </div>
  <div class="footer">
    Dicetak pada ${new Date().toLocaleString("id-ID")} &nbsp;|&nbsp; ID: ${transaction.id?.slice(0, 8) ?? "—"}
  </div>
</div>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=600,height=800");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

// ─── Komponen utama Form ─────────────────────────────────────────
export default function TransactionForm({
  onSubmit,
  editingData,
  editingItems,
  onCancelEdit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastSaved, setLastSaved] = useState(null);

  // Apakah mode uang masuk (tanpa detail item)
  const isMasuk = form.type === "masuk";

  // Kategori yang ditampilkan sesuai tipe
  const categoryOptions = isMasuk ? CATEGORY_MASUK : CATEGORY_KELUAR;

  // ── Isi form saat mode edit ──────────────────────────────────
  useEffect(() => {
    if (editingData) {
      setForm({
        date: editingData.date ?? today(),
        description: editingData.description ?? "",
        category: editingData.category ?? "",
        type: editingData.type ?? "keluar",
        note: editingData.note ?? "",
        manual_amount: editingData.type === "masuk" ? String(editingData.amount ?? "") : "",
      });
      setItems(
        editingItems && editingItems.length > 0
          ? editingItems.map((it) => ({
              id: it.id,
              product_name: it.product_name ?? "",
              quantity: String(it.quantity ?? 1),
              unit: it.unit ?? "pcs",
              unit_price: String(it.unit_price ?? ""),
            }))
          : [{ ...EMPTY_ITEM }]
      );
      setError("");
      setLastSaved(null);
    } else {
      setForm(EMPTY_FORM);
      setItems([{ ...EMPTY_ITEM }]);
      setLastSaved(null);
    }
  }, [editingData, editingItems]);

  // Reset kategori saat tipe berubah agar tidak ada nilai tak relevan
  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Jika user mengganti tipe, reset kategori supaya tidak cross-contaminate
      if (name === "type") next.category = "";
      return next;
    });
  }

  function handleItemChange(index, field, value) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // Total yang akan disimpan ke DB — berbeda tergantung tipe
  const totalKeluar = items.reduce(
    (sum, it) =>
      sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0),
    0
  );
  const finalAmount = isMasuk
    ? parseFloat(form.manual_amount) || 0
    : totalKeluar;

  // ── Validasi & Submit ────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (isMasuk) {
      // Uang masuk: validasi cukup pada nominal manual
      const nominal = parseFloat(form.manual_amount);
      if (isNaN(nominal) || nominal <= 0) {
        setError("Masukkan nominal uang masuk yang valid (lebih dari 0).");
        return;
      }
    } else {
      // Uang keluar: validasi setiap baris item
      for (const it of items) {
        if (!it.product_name.trim()) {
          setError("Nama produk tidak boleh kosong.");
          return;
        }
        if (isNaN(parseFloat(it.quantity)) || parseFloat(it.quantity) <= 0) {
          setError("Jumlah/qty harus angka positif.");
          return;
        }
        if (isNaN(parseFloat(it.unit_price)) || parseFloat(it.unit_price) < 0) {
          setError("Harga satuan tidak valid.");
          return;
        }
      }
      if (totalKeluar <= 0) {
        setError("Total transaksi harus lebih dari 0.");
        return;
      }
    }

    setLoading(true);

    // Items yang dikirim: kosong untuk uang masuk, terisi untuk uang keluar
    const parsedItems = isMasuk
      ? []
      : items.map((it) => ({
          ...(it.id ? { id: it.id } : {}),
          product_name: it.product_name.trim(),
          quantity: parseFloat(it.quantity),
          unit: it.unit,
          unit_price: parseFloat(it.unit_price),
        }));

    // Pisahkan manual_amount — kolom ini hanya ada di state lokal,
    // tidak ada di skema DB. Nilai sudah dipindah ke `amount` via finalAmount.
    // eslint-disable-next-line no-unused-vars
    const { manual_amount: _stripped, ...formForDB } = form;

    const result = await onSubmit(
      { ...formForDB, amount: finalAmount },
      parsedItems
    );

    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else if (result?.transaction) {
      setLastSaved({
        transaction: result.transaction,
        items: result.items ?? parsedItems,
      });
      if (!editingData) {
        setForm(EMPTY_FORM);
        setItems([{ ...EMPTY_ITEM }]);
      }
    }
  }

  const isEditing = Boolean(editingData);

  return (
    <div
      className={`card p-5 sm:p-6 ${isEditing ? "ring-2 ring-amber-400 ring-offset-2" : ""}`}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isEditing ? "bg-amber-100" : "bg-emerald-100"
            }`}
          >
            {isEditing ? (
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </div>
          <h2 className="font-semibold text-slate-800 text-base">
            {isEditing ? "Edit Transaksi" : "Tambah Transaksi"}
          </h2>
        </div>
        {isEditing && (
          <button type="button" onClick={onCancelEdit} className="btn-secondary">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Batal
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm mb-4">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Banner cetak struk setelah simpan ── */}
      {lastSaved && (
        <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
          <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Transaksi berhasil disimpan!
          </div>
          <button
            type="button"
            onClick={() => printStruk(lastSaved.transaction, lastSaved.items)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak Struk
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Baris 1: Tanggal · Tipe · Kategori ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tanggal */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Tanggal <span className="text-rose-500">*</span>
            </label>
            <input
              name="date"
              type="date"
              className="input"
              value={form.date}
              onChange={handleFormChange}
              required
            />
          </div>

          {/* Tipe — tombol toggle agar lebih jelas */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Tipe <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
              {[
                { value: "keluar", label: "Uang Keluar", color: "rose" },
                { value: "masuk",  label: "Uang Masuk",  color: "emerald" },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    handleFormChange({ target: { name: "type", value } })
                  }
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    form.type === value
                      ? color === "emerald"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-rose-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {value === "masuk" ? "▲ " : "▼ "}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Kategori — berbeda per tipe */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Kategori
            </label>
            <select
              name="category"
              className="input"
              value={form.category}
              onChange={handleFormChange}
            >
              <option value="">— Pilih kategori —</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Keterangan & Catatan ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Keterangan <span className="text-rose-500">*</span>
            </label>
            <input
              name="description"
              type="text"
              className="input"
              placeholder={
                isMasuk
                  ? "Misal: Iuran warga RT 03 bulan Juli"
                  : "Misal: Pembelian kebutuhan dapur"
              }
              value={form.description}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Catatan{" "}
              <span className="text-xs text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              name="note"
              type="text"
              className="input"
              placeholder={
                isMasuk
                  ? "Misal: 25 warga × Rp 50.000"
                  : "Misal: Beli di Toko Maju"
              }
              value={form.note}
              onChange={handleFormChange}
            />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            UANG MASUK → Input nominal langsung (manual)
            ════════════════════════════════════════════════════ */}
        {isMasuk && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 sm:p-5 space-y-3">
            {/* Label penjelasan */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">Nominal Uang Masuk</p>
                <p className="text-xs text-emerald-600">
                  Masukkan total langsung — tidak perlu detail per item
                </p>
              </div>
            </div>

            {/* Input nominal */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700 font-semibold text-sm pointer-events-none">
                Rp
              </span>
              <input
                name="manual_amount"
                type="number"
                min="1"
                step="any"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-emerald-300 bg-white text-emerald-900 font-bold text-base
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all
                           placeholder-emerald-300"
                placeholder="0"
                value={form.manual_amount}
                onChange={handleFormChange}
                required
              />
            </div>

            {/* Preview nominal */}
            {parseFloat(form.manual_amount) > 0 && (
              <p className="text-sm font-semibold text-emerald-700 text-right">
                = {formatRupiah(form.manual_amount)}
              </p>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            UANG KELUAR → Detail item produk + total otomatis
            ════════════════════════════════════════════════════ */}
        {!isMasuk && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Detail Item / Produk
              </h3>
              <span className="text-xs text-slate-400">{items.length} item</span>
            </div>

            {/* Header kolom desktop */}
            <div className="hidden sm:grid grid-cols-12 gap-2">
              <div className="col-span-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Produk</div>
              <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Qty</div>
              <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Satuan</div>
              <div className="col-span-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Harga Satuan</div>
              <div className="col-span-1 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Sub</div>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <ItemRow
                  key={index}
                  item={item}
                  index={index}
                  onChange={handleItemChange}
                  onRemove={removeItem}
                  canRemove={items.length > 1}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="w-full py-2 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400
                         hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 transition-all
                         flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Item
            </button>

            {/* Total otomatis */}
            <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-rose-700">Total Otomatis</span>
              <span className="text-lg font-bold text-rose-600">
                {formatRupiah(totalKeluar)}
              </span>
            </div>
          </div>
        )}

        {/* ── Submit ── */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading}
            className={`btn-primary ${isEditing ? "!bg-amber-500 hover:!bg-amber-600" : ""}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Menyimpan...
              </>
            ) : isEditing ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Simpan Perubahan
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Simpan Transaksi
              </>
            )}
          </button>
          {isEditing && (
            <span className="text-xs text-slate-400">Mengedit transaksi yang sudah ada</span>
          )}
        </div>
      </form>
    </div>
  );
}
