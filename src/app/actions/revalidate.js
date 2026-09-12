"use server";

import { revalidatePath } from "next/cache";

/**
 * Server Action untuk revalidate halaman publik
 * Dipanggil setelah CRUD di admin untuk memaksa Next.js/Vercel refresh cache
 */
export async function revalidatePublicPage() {
  try {
    // Revalidate halaman publik (root path)
    revalidatePath("/", "page");
    
    // Optional: revalidate layout juga jika perlu
    revalidatePath("/", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Revalidation error:", error);
    return { success: false, error: error.message };
  }
}
