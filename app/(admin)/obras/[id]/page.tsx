// app/(admin)/obras/[id]/page.tsx
import { getServerSupabase } from "@/lib/supabaseServer";

// Tipo para cada fila de obra_material con join a material
type MaterialAsignado = {
  id: string;
  cantidad_planificada: number | null;
  material: {
    id: string;
    codigo: string | null;
    descripcion: string | null;
    unidad: string | null;
  } | null;
};

type PageProps = {
  params: {
    id: string;
  };
};

export default async function ObraDetallePage({ params }: PageProps) {
  const supabase = getServerSupabase();

  // 1. Traer obra
  const { data: obra, error: e1 } = await supabase
    .from("obra")
    .select("id, nombre, cliente, estado, created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (e1 || !obra) {
    return <p className="text-red-600">Error cargando obra</p>;
  }

  // 2. Traer materiales asignados
  const { data: materiales, error: e2 } = await supabase
    .from("obra_material")
    .select(
      `
      id,
      cantidad_planificada,
      material:material_id (
        id,
        codigo,
        descripcion,
        unidad
      )
    `
    )
    .eq("obra_id", params.id)
    .returns<MaterialAsignado[]>();

  if (e2) {
    return (
      <p className="text-red-600">Error cargando materiales: {e2.message}</p>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{obra.nombre}</h1>
      <p className="text-gray-600 mb-6">
        Cliente: {obra.cliente ?? "—"} <br />
        Estado: {obra.estado ?? "—"} <br />
        Ingreso:{" "}
        {obra.created_at
          ? new Date(obra.created_at).toLocaleDateString("es-AR")
          : "—"}
      </p>

      <h2 className="text-xl font-semibold mb-4">Materiales asignados</h2>
      {materiales && materiales.length > 0 ? (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Código</th>
              <th className="p-2 border">Descripción</th>
              <th className="p-2 border">Unidad</th>
              <th className="p-2 border">Cantidad planificada</th>
            </tr>
          </thead>
          <tbody>
            {materiales.map((m) => (
              <tr key={m.id}>
                <td className="p-2 border">{m.material?.codigo}</td>
                <td className="p-2 border">{m.material?.descripcion}</td>
                <td className="p-2 border">{m.material?.unidad}</td>
                <td className="p-2 border">{m.cantidad_planificada}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">No hay materiales asignados.</p>
      )}
    </div>
  );
}
