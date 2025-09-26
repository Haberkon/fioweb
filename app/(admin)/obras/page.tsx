import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function ObrasPage() {
  const cookieStore = await cookies()   // 👈 Await obligatorio
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const { data: obras, error } = await supabase
    .from('obra')
    .select('id, nombre, cliente, estado')

  if (error) {
    console.error("❌ Error cargando obras:", error.message)
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Obras</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Cliente</th>
            <th className="p-2 border">Estado</th>
          </tr>
        </thead>
        <tbody>
          {obras?.map((o) => (
            <tr key={o.id}>
              <td className="p-2 border">{o.id}</td>
              <td className="p-2 border">{o.nombre}</td>
              <td className="p-2 border">{o.cliente}</td>
              <td className="p-2 border">{o.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
