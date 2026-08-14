import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware di semua route KECUALI:
     * - _next/static  (file statis)
     * - _next/image   (optimasi gambar)
     * - favicon.ico   (ikon browser)
     * - file dengan ekstensi (png, jpg, svg, dll.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
