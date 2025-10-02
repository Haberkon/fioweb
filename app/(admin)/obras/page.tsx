import Link from "next/link";
import { getServerSupabase } from "@/lib/supabaseServer";

export default async function ObrasPage() {
  const supabase = getServerSupabase();

  const { data: obras, error } = await supabase
    .from("obra")
    .select("id, nombre, cliente, estado, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-red-600">Error cargando obras: {error.message}</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Obras</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Cliente</th>
            <th className="p-2 border">Estado</th>
            <th className="p-2 border">Ingreso</th>
          </tr>
        </thead>
        <tbody>
          {obras?.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50">
              <td className="p-2 border">{o.id}</td>
              <td className="p-2 border">{o.nombre}</td>
              <td className="p-2 border">{o.cliente}</td>
              <td className="p-2 border">{o.estado}</td>
              <td className="p-2 border text-blue-600 underline">
                <Link href={`/obras/${o.id}`}>
                  {o.created_at
                    ? new Date(o.created_at).toLocaleDateString("es-AR")
                    : "—"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
