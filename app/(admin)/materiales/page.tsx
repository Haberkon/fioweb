import { getServerSupabase } from "@/lib/supabaseServer";
import MaterialesTable from "./MaterialesTable";

export default async function MaterialesPage() {
  const supabase = getServerSupabase();

  const { data: materiales, error } = await supabase
    .from("material")
    .select("id, codigo, descripcion, unidad, abreviacion, activo")
    .order("codigo", { ascending: true });

  if (error) {
    return <p className="text-red-600">Error cargando materiales: {error.message}</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Catálogo de materiales</h1>
      <MaterialesTable materiales={materiales ?? []} />
    </div>
  );
}
