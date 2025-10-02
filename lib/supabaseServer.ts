import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

export function getServerSupabase() {
  // 👇 Este es el único punto donde usamos cookies()
  return createServerComponentClient({ cookies })
}
