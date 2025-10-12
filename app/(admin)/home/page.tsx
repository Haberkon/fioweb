"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  BuildingOfficeIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  PhotoIcon,
  TruckIcon,
  MapIcon,
  UsersIcon,
  UserCircleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

export default function AdminHome() {
  const [nombre, setNombre] = useState<string>("");

  useEffect(() => {
    const cargarNombre = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("app_user_admin")
        .select("nombre")
        .eq("auth_user_id", user.id)
        .single();

      setNombre(data?.nombre || user.email || "Usuario");
    };

    cargarNombre();
  }, []);

  // 🕒 Saludo
  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? "Buen día" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  // ⚙️ Accesos rápidos con color y descripción
  const accesos = [
    {
      href: "/obras",
      label: "Obras",
      desc: "Ver y editar obras",
      icon: BuildingOfficeIcon,
      color: "bg-blue-100 text-blue-600",
    },
    {
      href: "/planos",
      label: "Planos",
      desc: "Planos y documentos",
      icon: ClipboardDocumentListIcon,
      color: "bg-green-100 text-green-600",
    },
    {
      href: "/materiales",
      label: "Materiales",
      desc: "Gestión de stock",
      icon: CubeIcon,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      href: "/fotos",
      label: "Fotos",
      desc: "Galería de obras",
      icon: PhotoIcon,
      color: "bg-pink-100 text-pink-600",
    },
    {
      href: "/asignacionMateriales",
      label: "Materiales a Obra",
      desc: "Asignar materiales",
      icon: CubeIcon,
      color: "bg-purple-100 text-purple-600",
    },
    /* 
    Ubicaciones
    {
      href: "/ubicaciones",
      label: "Ubicaciones",
      desc: "Mapa de obras",
      icon: MapIcon,
      color: "bg-teal-100 text-teal-600",
    }, 
     */
    {
      href: "/consumo",
      label: "Consumo",
      desc: "Consumo de materiales",
      icon: ChartBarIcon,
      color: "bg-teal-100 text-teal-600",
    }, 
    {
      href: "/stock",
      label: "Stock",
      desc: "Depósitos y entradas",
      icon: TruckIcon,
      color: "bg-orange-100 text-orange-600",
    },
    {
      href: "/tecnicos",
      label: "Técnicos",
      desc: "Ver técnicos",
      icon: UserCircleIcon,
      color: "bg-sky-100 text-sky-600",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* 👋 Saludo */}
      <h1 className="text-3xl font-bold text-gray-800">
        👋 {saludo}, {nombre}!
      </h1>

      {/* 🧭 Introducción */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <p className="text-gray-700">
         Dashboard
        </p>
        <p className="text-gray-500 mt-2">
         Fiocam Obras y Redes
        </p>
      </div>

      {/* ⚡ Accesos rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {accesos.map(({ href, label, desc, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.03] transition-all duration-200"
          >
            <div className={`p-3 rounded-full ${color}`}>
              <Icon className="h-7 w-7" />
            </div>
            <span className="mt-3 text-sm font-semibold text-gray-800">
              {label}
            </span>
            <span className="text-xs text-gray-500 text-center">{desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
