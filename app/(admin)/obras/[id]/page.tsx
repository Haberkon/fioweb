"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Tipos básicos
type Obra = {
  id: string;
  nombre: string;
  cliente: string | null;
  estado: string | null;
  created_at: string | null;
};

type Material = {
  id: string;
  material_id: string;
  cantidad_planificada: number | null;
  cantidad_real: number | null;
  material?: {
    id: string;
    codigo: string;
    descripcion: string;
    unidad: string;
  } | null;
};

type Tecnico = {
  id: string;
  nombre: string;
  apellido: string;
};

type Plano = {
  id: string;
  nombre: string | null;
  storage_path: string;
  url?: string | null;
  fallback?: string;
};

type Foto = {
  id: string;
  categoria: string | null;
  storage_path: string;
  url?: string | null;
};

export default function ObraDetallePage() {
  const { id } = useParams();
  const obraId = Array.isArray(id) ? id[0] : id;

  const [obra, setObra] = useState<Obra | null>(null);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados popup técnicos
  const [showPopup, setShowPopup] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredTecnicos, setFilteredTecnicos] = useState<Tecnico[]>([]);
  const [selectedTecnicos, setSelectedTecnicos] = useState<string[]>([]);

  useEffect(() => {
    if (!obraId) return;

    (async () => {
      setLoading(true);

      /** Obra */
      const { data: obraData } = await supabase
        .from("obra")
        .select("*")
        .eq("id", obraId)
        .single<Obra>();
      setObra(obraData);

      /** Materiales */
      const { data: om } = await supabase
        .from("obra_material")
        .select("*")
        .eq("obra_id", obraId);

      let mats: Material[] = [];
      if (om && om.length > 0) {
        const { data: materialesData } = await supabase
          .from("material")
          .select("id,codigo,descripcion,unidad");

        mats = om.map((m) => ({
          ...m,
          material: materialesData?.find((mt) => mt.id === m.material_id) || null,
        })) as Material[];
      }
      setMateriales(mats);

      /** Técnicos asignados */
      const { data: ot } = await supabase
        .from("obra_tecnico")
        .select("tecnico_id")
        .eq("obra_id", obraId);

      let tecs: Tecnico[] = [];
      if (ot && ot.length > 0) {
        const { data: usuarios } = await supabase
          .from("app_user")
          .select("id,nombre,apellido")
          .in("id", ot.map((t) => t.tecnico_id));
        tecs = (usuarios ?? []) as Tecnico[];
      }
      setTecnicos(tecs);

      /** Planos */
      const { data: planosRaw, error } = await supabase
        .from("plano")
        .select("id, nombre, storage_path")
        .eq("obra_id", obraId);

      if (error) console.error("Error planos:", error.message);

      const planosSigned: Plano[] = await Promise.all(
        (planosRaw ?? []).map(async (p) => {
          const { data } = await supabase.storage
            .from("planos")
            .createSignedUrl(p.storage_path, 600);
          return {
            ...p,
            url: data?.signedUrl ?? null,
            fallback: p.storage_path.split("/").pop(),
          };
        })
      );

      setPlanos(planosSigned);

      /** Fotos */
      const { data: fotosRaw } = await supabase
        .from("foto")
        .select("id,categoria,storage_path")
        .eq("obra_id", obraId);

      const fotosSigned: Foto[] = await Promise.all(
        (fotosRaw ?? []).map(async (f) => {
          const { data } = await supabase.storage
            .from("fotos")
            .createSignedUrl(f.storage_path, 3600);
          return { ...f, url: data?.signedUrl ?? null };
        })
      );
      setFotos(fotosSigned);

      setLoading(false);
    })();
  }, [obraId]);

  /** Buscar técnicos */
  const handleSearchTecnico = async (text: string) => {
    setSearch(text);
    if (text.length > 1) {
      const { data, error } = await supabase
        .from("app_user")
        .select("id,nombre,apellido")
        .eq("rol", "tecnico")
        .or(`nombre.ilike.%${text}%,apellido.ilike.%${text}%`);

      if (!error) setFilteredTecnicos((data ?? []) as Tecnico[]);
    } else {
      setFilteredTecnicos([]);
    }
  };

  /** Guardar técnicos asignados */
  const handleAsignarTecnicos = async () => {
    if (!obraId) return;

    await supabase.from("obra_tecnico").delete().eq("obra_id", obraId);

    const rows = selectedTecnicos.map((tid) => ({
      obra_id: obraId,
      tecnico_id: tid,
    }));
    if (rows.length > 0) await supabase.from("obra_tecnico").insert(rows);

    setShowPopup(false);

    // refrescar técnicos
    const { data: ot } = await supabase
      .from("obra_tecnico")
      .select("tecnico_id")
      .eq("obra_id", obraId);

    if (ot && ot.length > 0) {
      const { data: usuarios } = await supabase
        .from("app_user")
        .select("id,nombre,apellido")
        .in("id", ot.map((t) => t.tecnico_id));
      setTecnicos((usuarios ?? []) as Tecnico[]);
    } else {
      setTecnicos([]);
    }
  };

  if (loading) return <p className="p-6">Cargando...</p>;
  if (!obra) return <p className="p-6 text-red-600">Obra no encontrada</p>;

  // El resto de tu JSX queda igual, solo cambió la tipificación
  return (
    <div className="p-6 space-y-6">
      {/* ... */}
    </div>
  );
}
