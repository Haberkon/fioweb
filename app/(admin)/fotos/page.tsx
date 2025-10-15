"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type Obra = {
  id: string;
  nombre: string;
  numero_obra: number | null;
  fotos_count: number;
  fotos_hoy: number;
  fotos_ayer: number;
  ultima_captura: string | null;
};

export default function FotosObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchObras = async () => {
      setLoading(true);

      const { data: obrasData, error: e1 } = await supabase
        .from("obra")
        .select("id, nombre, numero_obra")
        .order("numero_obra", { ascending: true });

      if (e1) {
        console.error("Error obras:", e1.message);
        setLoading(false);
        return;
      }

      const { data: fotosData, error: e2 } = await supabase
        .from("foto")
        .select("obra_id, tomado_en");

      if (e2) {
        console.error("Error fotos:", e2.message);
        setLoading(false);
        return;
      }

      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);

      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0).getTime();
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).getTime();

      const inicioAyer = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate(), 0, 0, 0).getTime();
      const finAyer = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate(), 23, 59, 59).getTime();

      const counts: Record<string, { total: number; hoy: number; ayer: number; ultima: string | null }> = {};

      (fotosData ?? []).forEach((f) => {
        const obraId = f.obra_id;
        if (!obraId || !f.tomado_en) return;

        if (!counts[obraId]) {
          counts[obraId] = { total: 0, hoy: 0, ayer: 0, ultima: null };
        }

        const fecha = new Date(f.tomado_en).getTime();

        counts[obraId].total += 1;
        if (fecha >= inicioHoy && fecha <= finHoy) counts[obraId].hoy += 1;
        else if (fecha >= inicioAyer && fecha <= finAyer) counts[obraId].ayer += 1;

        if (!counts[obraId].ultima || f.tomado_en > counts[obraId].ultima) {
          counts[obraId].ultima = f.tomado_en;
        }
      });

      const merged = (obrasData ?? []).map((o) => ({
        ...o,
        fotos_count: counts[o.id]?.total || 0,
        fotos_hoy: counts[o.id]?.hoy || 0,
        fotos_ayer: counts[o.id]?.ayer || 0,
        ultima_captura: counts[o.id]?.ultima || null,
      }));

      setObras(merged);
      setLoading(false);
    };

    fetchObras();
  }, []);

  // 🔹 Descargar fotos de una obra según tipo
  const handleDownload = async (obraId: string, tipo: "hoy" | "ayer" | "total") => {
    setDownloading(obraId + tipo);

    try {
      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);

      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
      const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
      const inicioAyer = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate(), 0, 0, 0);
      const finAyer = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate(), 23, 59, 59);

      // 🔹 Filtro dinámico
      let query = supabase.from("foto").select("id, storage_path, tomado_en").eq("obra_id", obraId);
      if (tipo === "hoy") query = query.gte("tomado_en", inicioHoy.toISOString()).lte("tomado_en", finHoy.toISOString());
      if (tipo === "ayer") query = query.gte("tomado_en", inicioAyer.toISOString()).lte("tomado_en", finAyer.toISOString());

      const { data: fotos, error } = await query;

      if (error || !fotos?.length) {
        alert("No hay fotos para descargar en este rango.");
        setDownloading(null);
        return;
      }

      const zip = new JSZip();
      for (const f of fotos) {
        const { data } = await supabase.storage.from("fotos").createSignedUrl(f.storage_path, 3600);
        if (!data?.signedUrl) continue;

        const response = await fetch(data.signedUrl);
        const blob = await response.blob();
        const nombre = f.storage_path.split("/").pop() || `${f.id}.jpg`;
        zip.file(nombre, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `Fotos_${tipo}_${obraId}.zip`);
    } catch (e) {
      console.error("Error descargando fotos:", e);
      alert("Error al generar la descarga.");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <p className="p-6">Cargando...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Galería por Obra</h1>

      {obras.length === 0 ? (
        <p className="text-gray-500">No hay obras registradas.</p>
      ) : (
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          <table className="w-full border min-w-[1100px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-center">N° Obra</th>
                <th className="p-2 border text-left">Nombre</th>
                <th className="p-2 border text-center w-[180px]">Última captura</th>
                <th className="p-2 border text-center">Ayer</th>
                <th className="p-2 border text-center">Hoy</th>
                <th className="p-2 border text-center">Total</th>
                <th className="p-2 border text-center w-[100px]">Descargar (Ayer)</th>
                <th className="p-2 border text-center w-[100px]">Descargar (Hoy)</th>
                <th className="p-2 border text-center w-[100px]">Descargar (Total)</th>
              </tr>
            </thead>
            <tbody>
              {obras.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition">
                  <td className="p-2 border text-center">{o.numero_obra ?? "-"}</td>
                  <td className="p-2 border">
                    <Link href={`/fotos/${o.id}`} className="text-blue-600 hover:underline">
                      {o.nombre}
                    </Link>
                  </td>
                  <td className="p-2 border text-center text-gray-700 w-[180px]">
                    {o.ultima_captura
                      ? new Date(o.ultima_captura).toLocaleString("es-AR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        }).replace(".", "").replace(",", "").replace(/(\d{2}) (\w{3})/, "$1/$2")
                      : "-"}
                  </td>
                  <td className="p-2 border text-center">{o.fotos_ayer}</td>
                  <td className="p-2 border text-center">{o.fotos_hoy}</td>
                  <td className="p-2 border text-center font-semibold">{o.fotos_count}</td>

                  {/* Botones de descarga */}
                  <td className="p-2 border text-center w-[100px]">
                    <button
                      onClick={() => handleDownload(o.id, "ayer")}
                      disabled={downloading === o.id + "ayer"}
                      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {downloading === o.id + "ayer" ? "..." : "Descargar"}
                    </button>
                  </td>
                  <td className="p-2 border text-center w-[100px]">
                    <button
                      onClick={() => handleDownload(o.id, "hoy")}
                      disabled={downloading === o.id + "hoy"}
                      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {downloading === o.id + "hoy" ? "..." : "Descargar"}
                    </button>
                  </td>
                  <td className="p-2 border text-center w-[100px]">
                    <button
                      onClick={() => handleDownload(o.id, "total")}
                      disabled={downloading === o.id + "total"}
                      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {downloading === o.id + "total" ? "..." : "Descargar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
