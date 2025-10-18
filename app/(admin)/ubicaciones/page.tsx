/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

// 🧭 Import dinámico de React Leaflet (usando nextDynamic)
const MapContainer = nextDynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = nextDynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = nextDynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = nextDynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const Polyline = nextDynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false });

// ⚙️ Inicializar íconos Leaflet solo en cliente (sin usar variable L)
if (typeof window !== "undefined") {
  import("leaflet").then((leaflet) => {
    delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
    leaflet.Icon.Default.mergeOptions({
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      iconUrl: "/leaflet/marker-icon.png",
      shadowUrl: "/leaflet/marker-shadow.png",
    });
  });
}


type Punto = {
  lat: number;
  lng: number;
  tomado_en: string;
  nombre: string;
  apellido: string;
};

// Tipado de la respuesta de Supabase
type UbicacionRow = {
  lat: number;
  lng: number;
  tomado_en: string;
  app_user?: {
    nombre?: string;
    apellido?: string;
  };
};

export default function UbicacionesPage() {
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split("T")[0]);

  const BASE = { lat: -34.657221, lng: -58.662317 }; // Eva Perón 3145, Castelar

  // =========================================================
  // 🛰️ Obtener ubicaciones (refresca cada 10s)
  // =========================================================
  useEffect(() => {
    const fetchData = async () => {
      const inicio = `${fecha}T00:00:00`;
      const fin = `${fecha}T23:59:59`;

      const { data, error } = await supabase
        .from("ubicacion_tecnico_test")
        .select("lat, lng, tomado_en, app_user(nombre, apellido)")
        .gte("tomado_en", inicio)
        .lte("tomado_en", fin)
        .order("tomado_en", { ascending: true });

      if (error) {
        console.error("Error cargando ubicaciones:", error.message);
      } else {
        const pts = (data as UbicacionRow[]).map((d) => ({
          lat: d.lat,
          lng: d.lng,
          tomado_en: d.tomado_en,
          nombre: d.app_user?.nombre || "Sin nombre",
          apellido: d.app_user?.apellido || "",
        }));
        setPuntos(pts);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fecha]);

  // =========================================================
  // 🎨 Agrupar por técnico y asignar colores
  // =========================================================
  const grupos: Record<string, Punto[]> = {};
  puntos.forEach((p) => {
    const key = `${p.nombre} ${p.apellido}`;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(p);
  });

  const colores = ["#007bff", "#ff5722", "#4caf50", "#9c27b0", "#ff9800", "#009688"];
  const keys = Object.keys(grupos);
  const centro: [number, number] =
    puntos.length > 0 ? [puntos[0].lat, puntos[0].lng] : [BASE.lat, BASE.lng];

  // =========================================================
  // 🧭 Render
  // =========================================================
  return (
    <div className="p-4 space-y-4">
      {/* 🔹 Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          Seguimiento de Técnicos
        </h1>

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="border rounded px-3 py-1"
        />
      </div>

      {/* 🔹 Botón */}
      <button
        onClick={() => fetch("/api/simulate-tracking", { method: "POST" })}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Iniciar simulación de prueba
      </button>

      {/* 🔹 Mapa */}
      <div className="h-[75vh] rounded-xl overflow-hidden border">
        {loading ? (
          <p className="p-6 text-gray-600">Cargando ubicaciones...</p>
        ) : (
          <MapContainer
            center={centro}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {/* 📍 Base fija */}
            <Marker position={[BASE.lat, BASE.lng]}>
              <Popup>
                <strong>Depósito Castelar</strong>
                <br />
                Eva Perón 3145, Castelar
              </Popup>
            </Marker>

            {/* 🔹 Líneas y marcadores por técnico */}
            {keys.map((key, i) => (
              <Polyline
                key={`line-${key}`}
                positions={grupos[key].map((p) => [p.lat, p.lng])}
                pathOptions={{
                  color: colores[i % colores.length],
                  weight: 4,
                  opacity: 0.7,
                }}
              />
            ))}

            {keys.map((key, i) =>
              grupos[key].map((p, j) => (
                <Marker key={`${key}-${j}`} position={[p.lat, p.lng]}>
                  <Popup>
                    <strong style={{ color: colores[i % colores.length] }}>
                      {p.nombre} {p.apellido}
                    </strong>
                    <br />
                    {new Date(p.tomado_en).toLocaleTimeString("es-AR")}
                  </Popup>
                </Marker>
              ))
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
