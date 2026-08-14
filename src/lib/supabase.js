// Koneksi Supabase standar menggunakan @supabase/supabase-js
// Dipakai di seluruh aplikasi: Server Components, Client Components, login, admin
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Instance tunggal untuk Server Components & halaman publik
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Factory function untuk Client Components (login, admin) — tiap pemanggil dapat instance segar
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
