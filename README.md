# 📒 Buku Kas Transparan

Aplikasi pencatatan keuangan berbasis web yang transparan dan dapat diakses publik. Dibangun dengan **Next.js 14**, **Tailwind CSS**, dan **Supabase**.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)

---

## ✨ Fitur

### 🌐 Halaman Publik (Read-Only)
- **Ringkasan Keuangan:** Saldo, total pemasukan, total pengeluaran
- **Riwayat Transaksi:** Tabel lengkap dengan detail item produk
- **Cetak PDF:** Export rekap keseluruhan
- **Responsive:** Mobile-first design

### 🔐 Panel Admin (Login Required)
- **Uang Masuk:** Input nominal langsung untuk iuran, donasi, sponsor
- **Uang Keluar:** Detail item produk (nama, qty, satuan, harga satuan)
- **CRUD Lengkap:** Create, Read, Update, Delete transaksi
- **Cetak Struk:** PDF per transaksi setelah simpan
- **Real-time Update:** Data langsung muncul di halaman publik

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ dan npm
- Akun **Supabase** (gratis)

### 1. Clone Repository

```bash
git clone https://github.com/username/buku-kas-transparan.git
cd buku-kas-transparan
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database Supabase

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard)
2. Buka **SQL Editor** → **New query**
3. Copy seluruh isi file `supabase-schema.sql`
4. Paste dan **Run**
5. Buat user admin di **Authentication** → **Users** → **Add user**

### 4. Setup Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` dan isi dengan credentials dari **Supabase Dashboard → Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 📁 Struktur Project

```
├── src/
│   ├── app/
│   │   ├── page.js              # Halaman publik (Server Component)
│   │   ├── layout.js            # Root layout + navbar
│   │   ├── globals.css          # Tailwind + custom styles
│   │   ├── login/
│   │   │   └── page.js          # Form login
│   │   └── admin/
│   │       ├── page.js          # Panel admin CRUD
│   │       └── TransactionForm.js  # Form transaksi
│   └── lib/
│       └── supabase.js          # Supabase client helper
├── middleware.js                 # Route protection
├── supabase-schema.sql          # Database schema + RLS policies
└── package.json
```

---

## 🗄️ Database Schema

### Tabel `transactions`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `date` | DATE | Tanggal transaksi |
| `description` | TEXT | Keterangan transaksi |
| `category` | TEXT | Kategori (opsional) |
| `amount` | NUMERIC | Total nominal |
| `type` | TEXT | `masuk` atau `keluar` |
| `note` | TEXT | Catatan tambahan (opsional) |
| `created_at` | TIMESTAMPTZ | Waktu pembuatan |
| `updated_at` | TIMESTAMPTZ | Waktu update terakhir |

### Tabel `transaction_items`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | UUID | Primary key |
| `transaction_id` | UUID | Foreign key → `transactions.id` |
| `product_name` | TEXT | Nama produk |
| `quantity` | NUMERIC | Jumlah |
| `unit` | TEXT | Satuan (pcs, kg, liter, dll.) |
| `unit_price` | NUMERIC | Harga per satuan |
| `subtotal` | NUMERIC | Computed: `quantity × unit_price` |
| `created_at` | TIMESTAMPTZ | Waktu pembuatan |

**Relasi:** `transaction_items.transaction_id` → `transactions.id` (ON DELETE CASCADE)

---

## 🎨 Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Auth:** Supabase Authentication
- **Deployment:** [Vercel](https://vercel.com/) (recommended)

---

## 🔐 Security

- **Row Level Security (RLS):** Semua tabel dilindungi RLS
- **Public Read:** Siapa saja bisa lihat data transaksi
- **Authenticated Write:** Hanya user login yang bisa tambah/edit/hapus
- **Route Protection:** Middleware melindungi `/admin` route
- **Environment Variables:** Credentials tidak di-commit ke repo

---

## 📦 Build untuk Production

```bash
npm run build
npm start
```

### Deploy ke Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/username/buku-kas-transparan)

1. Push ke GitHub
2. Connect repository di [Vercel](https://vercel.com)
3. Tambahkan environment variables di Vercel Dashboard
4. Deploy otomatis

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint check
```

### Custom Tailwind Components

File `globals.css` berisi utility classes:

- `.card` — Card container
- `.input` — Form input styling
- `.btn-primary` — Primary button (emerald)
- `.btn-danger` — Delete button (rose)
- `.btn-secondary` — Secondary button (slate)
- `.badge-in` — Badge untuk uang masuk
- `.badge-out` — Badge untuk uang keluar

---

## 📸 Screenshots

### Halaman Publik
Ringkasan saldo + tabel transaksi dengan detail item produk

### Panel Admin
Form adaptif: input manual untuk uang masuk, detail item untuk uang keluar

### Cetak PDF
Struk transaksi profesional siap print

---

## 🤝 Contributing

Contributions welcome! Silakan:

1. Fork repository ini
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

---

## 📝 License

MIT License - lihat file [LICENSE](LICENSE) untuk detail

---

## 👤 Author

**Your Name**
- GitHub: [@username](https://github.com/username)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- Next.js documentation
- Tailwind CSS
- Supabase
- RevoU Coding Bootcamp

---

**Built with ❤️ using Next.js & Supabase**
