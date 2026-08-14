import "./globals.css";

export const metadata = {
  title: "Buku Kas Transparan",
  description: "Pencatatan keuangan yang terbuka dan dapat dipercaya.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50">
        {/* Navbar */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 group">
              {/* Ikon buku */}
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm group-hover:bg-emerald-700 transition-colors">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                Buku Kas <span className="text-emerald-600">Transparan</span>
              </span>
            </a>

            <nav className="flex items-center gap-1 sm:gap-2">
              <a
                href="/"
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Publik
              </a>
              <a
                href="/admin"
                className="px-3 py-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                Admin
              </a>
            </nav>
          </div>
        </header>

        {/* Konten Halaman */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-slate-100 py-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Buku Kas Transparan.
        </footer>
      </body>
    </html>
  );
}
