"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import TransactionForm, { printStruk } from "./TransactionForm";

// ─── Helpers ────────────────────────────────────────────────────
function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatTanggal(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Download PDF Rekap Keseluruhan (jsPDF + html2canvas) ────────
async function downloadRekapPDF(transactions) {
  // Dynamic import agar bundle size lebih kecil
  const jsPDF = (await import("jspdf")).default;
  const html2canvas = (await import("html2canvas")).default;

  const formatRp = (n) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(Number(n) || 0);

  const formatDate = (d) => new Date(d).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });

  const totalMasuk = transactions.filter((t) => t.type === "masuk").reduce((s, t) => s + Number(t.amount), 0);
  const totalKeluar = transactions.filter((t) => t.type === "keluar").reduce((s, t) => s + Number(t.amount), 0);
  const saldo = totalMasuk - totalKeluar;

  // Buat HTML konten yang akan di-render ke PDF
  const container = document.createElement("div");
  container.style.cssText = "position:absolute;left:-9999px;top:0;width:800px;background:white;padding:40px;font-family:Arial,sans-serif;";
  
  container.innerHTML = `
    <div style="margin-bottom:24px;border-bottom:3px solid #e2e8f0;padding-bottom:20px;">
      <div style="font-size:28px;font-weight:800;color:#059669;margin-bottom:6px;">📒 Buku Kas Transparan</div>
      <div style="font-size:14px;color:#64748b;">Laporan Rekapitulasi Keuangan</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:8px;">
        Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}<br>
        Total ${transactions.length} transaksi
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
      <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:10px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:6px;">Saldo Akhir</div>
        <div style="font-size:20px;font-weight:800;color:#0f172a;">${formatRp(saldo)}</div>
      </div>
      <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:10px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:6px;">Total Masuk</div>
        <div style="font-size:20px;font-weight:800;color:#059669;">${formatRp(totalMasuk)}</div>
      </div>
      <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:10px;padding:16px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:6px;">Total Keluar</div>
        <div style="font-size:20px;font-weight:800;color:#e11d48;">${formatRp(totalKeluar)}</div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:#f1f5f9;border-bottom:2px solid #e2e8f0;">
          <th style="padding:10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;color:#475569;">Tanggal</th>
          <th style="padding:10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;color:#475569;">Keterangan</th>
          <th style="padding:10px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;color:#475569;">Kategori</th>
          <th style="padding:10px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;color:#475569;">Tipe</th>
          <th style="padding:10px;text-align:right;font-size:9px;font-weight:700;text-transform:uppercase;color:#475569;">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.map((t, i) => `
          <tr style="border-bottom:1px solid #f1f5f9;${i % 2 === 0 ? "background:#fafafa;" : ""}">
            <td style="padding:10px;color:#475569;">${formatDate(t.date)}</td>
            <td style="padding:10px;color:#1e293b;font-weight:600;">${t.description}${t.note ? `<br><span style="font-size:9px;color:#94a3b8;font-weight:400;">${t.note}</span>` : ""}</td>
            <td style="padding:10px;color:#64748b;">${t.category || "—"}</td>
            <td style="padding:10px;text-align:center;">
              <span style="display:inline-block;font-size:9px;font-weight:700;padding:3px 10px;border-radius:12px;${t.type === "masuk" ? "background:#d1fae5;color:#065f46;" : "background:#ffe4e6;color:#9f1239;"}">${t.type === "masuk" ? "Masuk" : "Keluar"}</span>
            </td>
            <td style="padding:10px;text-align:right;font-weight:700;${t.type === "masuk" ? "color:#059669;" : "color:#e11d48;"}">
              ${t.type === "masuk" ? "+" : "−"}${formatRp(t.amount)}
            </td>
          </tr>
          ${t.transaction_items && t.transaction_items.length > 0 ? `
            <tr>
              <td colspan="5" style="padding:4px 10px 12px;">
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  ${t.transaction_items.map((it) => 
                    `<span style="font-size:9px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:3px 8px;color:#475569;">${it.product_name} × ${it.quantity} ${it.unit} @ ${formatRp(it.unit_price)}</span>`
                  ).join("")}
                </div>
              </td>
            </tr>
          ` : ""}
        `).join("")}
      </tbody>
    </table>

    <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:10px;color:#94a3b8;">
      Laporan ini digenerate otomatis oleh sistem Buku Kas Transparan.
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Render HTML ke canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Kualitas tinggi
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    document.body.removeChild(container);

    // Convert canvas ke PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Jika tinggi konten lebih dari 1 halaman, buat multi-page
    const pageHeight = 297; // A4 height in mm
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate nama file dengan timestamp
    const timestamp = new Date().toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "-");
    
    const fileName = `Rekap-Kas-Keuangan-${timestamp}.pdf`;

    // Download PDF
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    document.body.removeChild(container);
    alert("Gagal membuat PDF. Silakan coba lagi.");
  }
}

// ─── Modal konfirmasi hapus ──────────────────────────────────────
function DeleteModal({ transaction, onConfirm, onCancel, loading }) {
  if (!transaction) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="card w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Hapus Transaksi?</h3>
            <p className="text-xs text-slate-500 mt-0.5">Item terkait juga akan terhapus otomatis.</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-sm">
          <p className="font-medium text-slate-700 line-clamp-2">{transaction.description}</p>
          <p className={`text-xs mt-1 font-semibold ${transaction.type === "masuk" ? "text-emerald-600" : "text-rose-600"}`}>
            {transaction.type === "masuk" ? "+" : "−"}{formatRupiah(transaction.amount)}
          </p>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-60">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
            {loading ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className={`fixed bottom-5 right-4 left-4 sm:left-auto sm:w-80 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
      ${type === "success" ? "bg-emerald-600" : "bg-rose-500"}`}>
      {type === "success"
        ? <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        : <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" /></svg>
      }
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="shrink-0 opacity-80 hover:opacity-100" aria-label="Tutup">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Baris Transaksi di Tabel ────────────────────────────────────
function TransactionRow({ t, isEditing, onEdit, onDelete, onPrint }) {
  const [expanded, setExpanded] = useState(false);
  const hasItems = t.transaction_items && t.transaction_items.length > 0;

  return (
    <>
      <tr className={`hover:bg-slate-50 transition-colors ${isEditing ? "bg-amber-50/60" : ""}`}>
        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{formatTanggal(t.date)}</td>
        <td className="px-4 py-3 max-w-[180px]">
          <p className="font-medium text-slate-800 text-sm line-clamp-1">{t.description}</p>
          {t.note && <p className="text-xs text-slate-400 truncate">{t.note}</p>}
          {hasItems && (
            <button onClick={() => setExpanded((v) => !v)}
              className="text-xs text-emerald-600 hover:text-emerald-800 mt-0.5 flex items-center gap-0.5">
              {expanded ? "▲" : "▼"} {t.transaction_items.length} item
            </button>
          )}
        </td>
        <td className="px-4 py-3 text-slate-500 text-xs">{t.category || <span className="text-slate-300">—</span>}</td>
        <td className="px-4 py-3">
          {t.type === "masuk"
            ? <span className="badge-in">Masuk</span>
            : <span className="badge-out">Keluar</span>}
        </td>
        <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap text-sm ${t.type === "masuk" ? "text-emerald-600" : "text-rose-600"}`}>
          {t.type === "masuk" ? "+" : "−"}{formatRupiah(t.amount)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-center gap-1.5">
            <button onClick={() => onPrint(t)} className="btn-secondary" title="Cetak struk">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
            <button onClick={() => onEdit(t)} className="btn-secondary">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button onClick={() => onDelete(t)} className="btn-danger">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
      {/* Expanded detail items */}
      {expanded && hasItems && (
        <tr className="bg-slate-50/80">
          <td colSpan={6} className="px-6 pb-3 pt-1">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left py-1 pr-4 font-semibold">Produk</th>
                    <th className="text-center py-1 pr-4 font-semibold">Qty</th>
                    <th className="text-center py-1 pr-4 font-semibold">Satuan</th>
                    <th className="text-right py-1 pr-4 font-semibold">Harga Satuan</th>
                    <th className="text-right py-1 font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {t.transaction_items.map((it) => (
                    <tr key={it.id} className="border-t border-slate-100">
                      <td className="py-1 pr-4 text-slate-700 font-medium">{it.product_name}</td>
                      <td className="py-1 pr-4 text-center text-slate-600">{it.quantity}</td>
                      <td className="py-1 pr-4 text-center text-slate-500">{it.unit}</td>
                      <td className="py-1 pr-4 text-right text-slate-600">{formatRupiah(it.unit_price)}</td>
                      <td className="py-1 text-right font-semibold text-slate-700">
                        {formatRupiah(it.subtotal ?? it.quantity * it.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Kartu mobile per transaksi ──────────────────────────────────
function TransactionCard({ t, isEditing, onEdit, onDelete, onPrint }) {
  const [expanded, setExpanded] = useState(false);
  const hasItems = t.transaction_items && t.transaction_items.length > 0;

  return (
    <div className={`px-4 py-4 ${isEditing ? "bg-amber-50/50" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 text-sm">{t.description}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-slate-400">{formatTanggal(t.date)}</span>
            {t.category && <><span className="text-slate-300">•</span><span className="text-xs text-slate-400">{t.category}</span></>}
          </div>
          {t.note && <p className="text-xs text-slate-400 mt-0.5 italic truncate">{t.note}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`font-bold text-sm ${t.type === "masuk" ? "text-emerald-600" : "text-rose-600"}`}>
            {t.type === "masuk" ? "+" : "−"}{formatRupiah(t.amount)}
          </span>
          {t.type === "masuk" ? <span className="badge-in">Masuk</span> : <span className="badge-out">Keluar</span>}
        </div>
      </div>

      {hasItems && (
        <button onClick={() => setExpanded((v) => !v)}
          className="text-xs text-emerald-600 mb-2 flex items-center gap-1">
          {expanded ? "▲ Sembunyikan" : `▼ Lihat ${t.transaction_items.length} item`}
        </button>
      )}

      {expanded && hasItems && (
        <div className="mb-2 bg-slate-50 rounded-lg p-2 space-y-1">
          {t.transaction_items.map((it) => (
            <div key={it.id} className="flex justify-between text-xs text-slate-600">
              <span>{it.product_name} × {it.quantity} {it.unit}</span>
              <span className="font-semibold">{formatRupiah(it.subtotal ?? it.quantity * it.unit_price)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => onPrint(t)} className="btn-secondary flex-shrink-0" title="Cetak struk">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </button>
        <button onClick={() => { onEdit(t); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="btn-secondary flex-1 justify-center">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button onClick={() => onDelete(t)} className="btn-danger flex-1 justify-center">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Hapus
        </button>
      </div>
    </div>
  );
}

// ─── Halaman Admin Utama ─────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [editingData, setEditingData] = useState(null);
  const [editingItems, setEditingItems] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [filterType, setFilterType] = useState("semua");

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);
  const hideToast = useCallback(() => setToast({ message: "", type: "success" }), []);

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/login");
      else setUser(user);
    });
  }, []);

  // Fetch transaksi beserta items-nya
  const fetchTransactions = useCallback(async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*, transaction_items(*)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error) setTransactions(data || []);
    else showToast("Gagal memuat data: " + error.message, "error");
    setLoadingData(false);
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // CREATE
  async function handleCreate(formData, items) {
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .insert([formData])
      .select()
      .single();

    if (txErr) return { error: "Gagal menyimpan transaksi: " + txErr.message };

    if (items.length > 0) {
      const itemsPayload = items.map((it) => ({ ...it, transaction_id: tx.id }));
      const { error: itemErr } = await supabase.from("transaction_items").insert(itemsPayload);
      if (itemErr) return { error: "Transaksi tersimpan, tapi gagal menyimpan item: " + itemErr.message };
    }

    // Fetch items yang baru disimpan untuk data struk
    const { data: savedItems } = await supabase
      .from("transaction_items")
      .select("*")
      .eq("transaction_id", tx.id);

    await fetchTransactions();
    showToast("Transaksi berhasil ditambahkan!");
    return { transaction: tx, items: savedItems || [] };
  }

  // UPDATE
  async function handleUpdate(formData, items) {
    const txId = editingData.id;

    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .update(formData)
      .eq("id", txId)
      .select()
      .single();

    if (txErr) return { error: "Gagal memperbarui transaksi: " + txErr.message };

    // Hapus semua items lama, lalu insert baru
    await supabase.from("transaction_items").delete().eq("transaction_id", txId);
    if (items.length > 0) {
      const itemsPayload = items.map(({ id: _id, ...rest }) => ({ ...rest, transaction_id: txId }));
      const { error: itemErr } = await supabase.from("transaction_items").insert(itemsPayload);
      if (itemErr) return { error: "Transaksi diperbarui, tapi gagal menyimpan item: " + itemErr.message };
    }

    const { data: savedItems } = await supabase
      .from("transaction_items").select("*").eq("transaction_id", txId);

    await fetchTransactions();
    setEditingData(null);
    setEditingItems([]);
    showToast("Transaksi berhasil diperbarui!");
    return { transaction: tx, items: savedItems || [] };
  }

  // DELETE
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    // items terhapus otomatis via CASCADE
    const { error } = await supabase.from("transactions").delete().eq("id", deleteTarget.id);
    setDeleteLoading(false);
    if (error) showToast("Gagal menghapus transaksi.", "error");
    else {
      setTransactions((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      showToast("Transaksi berhasil dihapus.");
    }
    setDeleteTarget(null);
  }

  // EDIT: siapkan data form + items
  function handleEdit(t) {
    setEditingData(t);
    setEditingItems(t.transaction_items || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // CETAK struk per transaksi
  function handlePrint(t) {
    printStruk(t, t.transaction_items || []);
  }

  // LOGOUT
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Statistik
  const totalMasuk = transactions.filter((t) => t.type === "masuk").reduce((s, t) => s + Number(t.amount), 0);
  const totalKeluar = transactions.filter((t) => t.type === "keluar").reduce((s, t) => s + Number(t.amount), 0);
  const saldo = totalMasuk - totalKeluar;

  // Filter
  const filtered = filterType === "semua" ? transactions : transactions.filter((t) => t.type === filterType);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <svg className="animate-spin w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Admin
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Panel Admin</h1>
            <p className="mt-1 text-sm text-slate-500">
              Login sebagai <span className="font-medium text-slate-700">{user.email}</span>
            </p>
          </div>
          <button onClick={handleLogout}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar
          </button>
        </div>

        {/* ── Ringkasan + Tombol Rekap PDF ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 sm:p-4 text-center col-span-3 sm:col-span-1">
            <p className="text-xs text-slate-500 mb-1">Saldo</p>
            <p className={`font-bold text-sm sm:text-lg ${saldo >= 0 ? "text-slate-800" : "text-rose-600"}`}>
              {formatRupiah(saldo)}
            </p>
          </div>
          <div className="card p-3 sm:p-4 text-center border-emerald-100">
            <p className="text-xs text-slate-500 mb-1">Masuk</p>
            <p className="font-bold text-sm sm:text-base text-emerald-600">{formatRupiah(totalMasuk)}</p>
          </div>
          <div className="card p-3 sm:p-4 text-center border-rose-100">
            <p className="text-xs text-slate-500 mb-1">Keluar</p>
            <p className="font-bold text-sm sm:text-base text-rose-600">{formatRupiah(totalKeluar)}</p>
          </div>
        </div>

        {/* Tombol export rekap PDF */}
        <div className="flex justify-end">
          <button
            onClick={() => downloadRekapPDF(transactions)}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Rekap PDF
          </button>
        </div>

        {/* ── Form Tambah / Edit ── */}
        <TransactionForm
          onSubmit={editingData ? handleUpdate : handleCreate}
          editingData={editingData}
          editingItems={editingItems}
          onCancelEdit={() => { setEditingData(null); setEditingItems([]); }}
        />

        {/* ── Tabel Transaksi ── */}
        <div className="card overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-semibold text-slate-800 text-base">Daftar Transaksi</h2>
            <div className="flex items-center gap-2">
              {/* Filter tabs */}
              {["semua", "masuk", "keluar"].map((f) => (
                <button key={f} onClick={() => setFilterType(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors capitalize
                    ${filterType === f
                      ? f === "masuk" ? "bg-emerald-600 text-white"
                        : f === "keluar" ? "bg-rose-500 text-white"
                        : "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {f === "semua" ? "Semua" : f === "masuk" ? "▲ Masuk" : "▼ Keluar"}
                </button>
              ))}
              <span className="text-xs text-slate-400 ml-1">{filtered.length} data</span>
            </div>
          </div>

          {loadingData ? (
            <div className="py-16 flex items-center justify-center gap-3 text-slate-400">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Memuat data...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">Belum ada transaksi</p>
              <p className="text-xs mt-1">Gunakan form di atas untuk menambah transaksi pertama.</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Keterangan</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipe</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Jumlah</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((t) => (
                      <TransactionRow
                        key={t.id}
                        t={t}
                        isEditing={editingData?.id === t.id}
                        onEdit={handleEdit}
                        onDelete={setDeleteTarget}
                        onPrint={handlePrint}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="sm:hidden divide-y divide-slate-100">
                {filtered.map((t) => (
                  <TransactionCard
                    key={t.id}
                    t={t}
                    isEditing={editingData?.id === t.id}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                    onPrint={handlePrint}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <DeleteModal
        transaction={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
      <Toast message={toast.message} type={toast.type} onClose={hideToast} />
    </>
  );
}
