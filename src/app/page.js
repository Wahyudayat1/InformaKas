// Server Component — fetch data di server, tidak expose API key ke browser
import { supabase } from "@/lib/supabase";

// ─── Helpers ────────────────────────────────────────────────────
function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatTanggal(dateStr, panjang = false) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: panjang ? "long" : "short",
    year: "numeric",
  });
}

// ─── Komponen kartu ringkasan ────────────────────────────────────
function SummaryCard({ label, value, color, icon }) {
  const styles = {
    emerald: { border: "border-emerald-100", text: "text-emerald-700", iconBg: "bg-emerald-100", iconText: "text-emerald-600" },
    rose:    { border: "border-rose-100",    text: "text-rose-700",    iconBg: "bg-rose-100",    iconText: "text-rose-600" },
    slate:   { border: "border-slate-200",   text: "text-slate-700",   iconBg: "bg-slate-100",   iconText: "text-slate-500" },
  };
  const c = styles[color] ?? styles.slate;

  return (
    <div className={`card p-4 sm:p-5 border ${c.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
          <p className={`text-lg sm:text-xl font-bold ${c.text} leading-tight`}>{value}</p>
        </div>
        <div className={`${c.iconBg} ${c.iconText} p-2 rounded-xl shrink-0`}>{icon}</div>
      </div>
    </div>
  );
}

// ─── Tombol cetak rekap (Client Island kecil) ────────────────────
// Karena ini Server Component, tombol interaktif harus jadi komponen terpisah.
// Kita embed script inline yang aman — hanya membutuhkan data yang sudah di-render.
function PrintRekapButton({ transactions }) {
  // Serialisasi data ke JSON agar bisa diteruskan ke fungsi client
  const data = JSON.stringify(transactions);

  return (
    <button
      type="button"
      // onClick diinline via dangerouslySetInnerHTML-approach tidak bisa di Server Component.
      // Gunakan data attribute + script tag di bawah.
      id="btn-rekap-pdf"
      data-transactions={data}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors shadow-sm"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Cetak Rekap PDF
    </button>
  );
}

// ─── Halaman Utama (Server Component) ───────────────────────────
export default async function HomePage() {
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*, transaction_items(*)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) console.error("Supabase error:", error.message);

  const data = transactions || [];

  const totalMasuk  = data.filter((t) => t.type === "masuk").reduce((s, t) => s + Number(t.amount), 0);
  const totalKeluar = data.filter((t) => t.type === "keluar").reduce((s, t) => s + Number(t.amount), 0);
  const saldo       = totalMasuk - totalKeluar;

  return (
    <>
      <div className="space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Laporan Keuangan</h1>
            <p className="mt-1 text-sm text-slate-500">
              Catatan keuangan yang terbuka dan dapat diverifikasi oleh siapa saja.
            </p>
          </div>
          {data.length > 0 && <PrintRekapButton transactions={data} />}
        </div>

        {/* ── Kartu Ringkasan ── */}
        <section aria-label="Ringkasan Keuangan">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              label="Saldo Saat Ini"
              value={formatRupiah(saldo)}
              color={saldo >= 0 ? "slate" : "rose"}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
            />
            <SummaryCard
              label="Total Pemasukan"
              value={formatRupiah(totalMasuk)}
              color="emerald"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              }
            />
            <SummaryCard
              label="Total Pengeluaran"
              value={formatRupiah(totalKeluar)}
              color="rose"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              }
            />
          </div>
        </section>

        {/* ── Tabel Transaksi ── */}
        <section aria-label="Daftar Transaksi">
          <div className="card overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 text-base">Riwayat Transaksi</h2>
              <span className="text-xs text-slate-400 font-medium">{data.length} transaksi</span>
            </div>

            {data.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium">Belum ada transaksi</p>
                <p className="text-xs mt-1">Data akan muncul setelah admin menambahkan transaksi.</p>
              </div>
            ) : (
              <>
                {/* Desktop — Tabel */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Tanggal</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Keterangan &amp; Item</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Kategori</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Tipe</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((t) => {
                        const hasItems = t.transaction_items && t.transaction_items.length > 0;
                        return (
                          <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors align-top">
                            <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap pt-4">
                              {formatTanggal(t.date, true)}
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-medium text-slate-800">{t.description}</p>
                              {t.note && <p className="text-xs text-slate-400 mt-0.5 italic">{t.note}</p>}
                              {/* Detail item produk */}
                              {hasItems && (
                                <div className="mt-2 space-y-1">
                                  {t.transaction_items.map((it) => (
                                    <div key={it.id} className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5">
                                      <span>
                                        <span className="font-medium text-slate-700">{it.product_name}</span>
                                        <span className="text-slate-400 ml-1.5">
                                          {it.quantity} {it.unit} × {formatRupiah(it.unit_price)}
                                        </span>
                                      </span>
                                      <span className="font-semibold text-slate-600 ml-4 shrink-0">
                                        {formatRupiah(it.subtotal ?? it.quantity * it.unit_price)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-slate-500 text-xs">
                              {t.category || <span className="text-slate-300 italic">—</span>}
                            </td>
                            <td className="px-5 py-4">
                              {t.type === "masuk" ? (
                                <span className="badge-in">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                  </svg>
                                  Masuk
                                </span>
                              ) : (
                                <span className="badge-out">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                  </svg>
                                  Keluar
                                </span>
                              )}
                            </td>
                            <td className={`px-5 py-4 text-right font-bold whitespace-nowrap ${t.type === "masuk" ? "text-emerald-600" : "text-rose-600"}`}>
                              {t.type === "masuk" ? "+" : "−"}{formatRupiah(t.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile — Card List */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {data.map((t) => {
                    const hasItems = t.transaction_items && t.transaction_items.length > 0;
                    return (
                      <div key={t.id} className="px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 text-sm">{t.description}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-slate-400">{formatTanggal(t.date, true)}</span>
                              {t.category && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-xs text-slate-400">{t.category}</span>
                                </>
                              )}
                            </div>
                            {t.note && <p className="text-xs text-slate-400 mt-0.5 italic">{t.note}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`font-bold text-sm ${t.type === "masuk" ? "text-emerald-600" : "text-rose-600"}`}>
                              {t.type === "masuk" ? "+" : "−"}{formatRupiah(t.amount)}
                            </span>
                            {t.type === "masuk" ? (
                              <span className="badge-in">Masuk</span>
                            ) : (
                              <span className="badge-out">Keluar</span>
                            )}
                          </div>
                        </div>

                        {/* Detail item di mobile */}
                        {hasItems && (
                          <div className="mt-2 space-y-1">
                            {t.transaction_items.map((it) => (
                              <div key={it.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-2.5 py-1.5">
                                <span className="text-slate-600">
                                  <span className="font-medium">{it.product_name}</span>
                                  <span className="text-slate-400 ml-1">× {it.quantity} {it.unit}</span>
                                </span>
                                <span className="font-semibold text-slate-600 ml-2">
                                  {formatRupiah(it.subtotal ?? it.quantity * it.unit_price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/*
        Script client-side minimal untuk tombol Cetak Rekap PDF.
        Menggunakan data attribute agar tidak perlu 'use client' di seluruh halaman.
        Fungsi printRekap identik dengan yang ada di admin/page.js.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  function formatRp(n) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n) || 0);
  }
  function formatDate(d) {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function printRekap(transactions) {
    var totalMasuk  = transactions.filter(function(t){ return t.type==='masuk'; }).reduce(function(s,t){ return s+Number(t.amount); }, 0);
    var totalKeluar = transactions.filter(function(t){ return t.type==='keluar'; }).reduce(function(s,t){ return s+Number(t.amount); }, 0);
    var saldo = totalMasuk - totalKeluar;

    var rows = transactions.map(function(t, i) {
      var itemHtml = '';
      if (t.transaction_items && t.transaction_items.length > 0) {
        var tags = t.transaction_items.map(function(it) {
          return '<span class="item-tag">' + it.product_name + ' × ' + it.quantity + ' ' + it.unit + ' @ ' + formatRp(it.unit_price) + '</span>';
        }).join('');
        itemHtml = '<tr class="item-row"><td colspan="5"><div class="items-wrap">' + tags + '</div></td></tr>';
      }
      return '<tr class="' + (i%2===0?'even':'') + '">'
        + '<td>' + formatDate(t.date) + '</td>'
        + '<td>' + t.description + (t.note ? '<br><small style="color:#94a3b8">' + t.note + '</small>' : '') + '</td>'
        + '<td>' + (t.category || '—') + '</td>'
        + '<td class="center"><span class="badge ' + t.type + '">' + (t.type==='masuk'?'Masuk':'Keluar') + '</span></td>'
        + '<td class="right ' + t.type + '">' + (t.type==='masuk'?'+':'−') + formatRp(t.amount) + '</td>'
        + '</tr>' + itemHtml;
    }).join('');

    var html = '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Rekap Kas</title>'
      + '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Segoe UI,Arial,sans-serif;font-size:11px;color:#1e293b}'
      + '.wrapper{max-width:900px;margin:0 auto;padding:28px 24px}'
      + '.header{display:flex;justify-content:space-between;margin-bottom:20px;border-bottom:2px solid #e2e8f0;padding-bottom:16px}'
      + '.logo{font-size:20px;font-weight:800;color:#059669}.logo-sub{font-size:11px;color:#64748b;margin-top:2px}'
      + '.print-date{font-size:10px;color:#94a3b8;text-align:right}'
      + '.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}'
      + '.summary-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px}'
      + '.summary-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:4px}'
      + '.summary-value{font-size:16px;font-weight:800}.saldo{color:#0f172a}.masuk{color:#059669}.keluar{color:#e11d48}'
      + 'table{width:100%;border-collapse:collapse}thead th{background:#f1f5f9;padding:7px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#475569;border-bottom:2px solid #e2e8f0}'
      + 'th.right,td.right{text-align:right}th.center,td.center{text-align:center}'
      + 'tbody tr{border-bottom:1px solid #f1f5f9}tbody tr.even{background:#fafafa}'
      + 'tbody td{padding:6px 10px;vertical-align:middle}'
      + 'tbody tr.item-row td{padding:2px 10px 6px}'
      + '.items-wrap{display:flex;flex-wrap:wrap;gap:4px}'
      + '.item-tag{font-size:10px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:4px;padding:2px 6px;color:#475569}'
      + '.badge{display:inline-block;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px}'
      + '.badge.masuk{background:#d1fae5;color:#065f46}.badge.keluar{background:#ffe4e6;color:#9f1239}'
      + '.right.masuk{color:#059669;font-weight:700}.right.keluar{color:#e11d48;font-weight:700}'
      + '.footer{margin-top:20px;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}'
      + '@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'
      + '</style></head><body>'
      + '<div class="wrapper">'
      + '<div class="header"><div><div class="logo">📒 Buku Kas Transparan</div><div class="logo-sub">Laporan Rekapitulasi Keuangan (Publik)</div></div>'
      + '<div class="print-date">Dicetak: ' + new Date().toLocaleString('id-ID') + '<br>Total ' + transactions.length + ' transaksi</div></div>'
      + '<div class="summary">'
      + '<div class="summary-card"><div class="summary-label">Saldo Akhir</div><div class="summary-value saldo">' + formatRp(saldo) + '</div></div>'
      + '<div class="summary-card"><div class="summary-label">Total Masuk</div><div class="summary-value masuk">' + formatRp(totalMasuk) + '</div></div>'
      + '<div class="summary-card"><div class="summary-label">Total Keluar</div><div class="summary-value keluar">' + formatRp(totalKeluar) + '</div></div>'
      + '</div>'
      + '<table><thead><tr><th style="width:110px">Tanggal</th><th>Keterangan</th><th style="width:100px">Kategori</th><th class="center" style="width:70px">Tipe</th><th class="right" style="width:130px">Jumlah</th></tr></thead>'
      + '<tbody>' + rows + '</tbody></table>'
      + '<div class="footer">Laporan ini digenerate otomatis oleh sistem Buku Kas Transparan.</div>'
      + '</div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}<\\/script>'
      + '</body></html>';

    var w = window.open('', '_blank', 'width=960,height=900');
    if (w) { w.document.write(html); w.document.close(); }
  }

  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('btn-rekap-pdf');
    if (!btn) return;
    btn.addEventListener('click', function() {
      try {
        var txData = JSON.parse(btn.getAttribute('data-transactions') || '[]');
        printRekap(txData);
      } catch(e) { alert('Gagal memuat data untuk PDF.'); }
    });
  });
})();
          `,
        }}
      />
    </>
  );
}
