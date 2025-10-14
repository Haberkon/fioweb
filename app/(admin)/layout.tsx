/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChevronLeftIcon,
  HomeIcon,
  CubeIcon,
  PhotoIcon,
  MapIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  BuildingOfficeIcon,
  TruckIcon,
  UsersIcon,
  ChartBarIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

// 🔹 Ítems del menú lateral
const navItems = [
  { href: "/home", label: "Inicio", icon: HomeIcon },
  { href: "/obras", label: "Obras", icon: BuildingOfficeIcon },
  { href: "/materiales", label: "Materiales", icon: CubeIcon },
  { href: "/planos", label: "Planos", icon: ClipboardDocumentListIcon },
  { href: "/fotos", label: "Fotos", icon: PhotoIcon },
  { href: "/stock", label: "Stock", icon: TruckIcon },
  { href: "/ubicaciones", label: "Ubicaciones", icon: MapIcon },
  { href: "/asignacionObras", label: "Técnico a Obra", icon: BuildingOfficeIcon },
  { href: "/asignacionMateriales", label: "Materiales a Obra", icon: CubeIcon },
  { href: "/consumo", label: "Consumo", icon: ChartBarIcon },
  { href: "/perfil", label: "Mi Perfil", icon: UserIcon },
  { href: "/admins", label: "Admins", icon: UsersIcon },
  { href: "/tecnicos", label: "Técnicos", icon: UserCircleIcon },
];

// 🔹 Tabla de permisos por rol
const permisosPorRol: Record<string, "all" | string[]> = {
  superadmin: "all",
  admin: "all",
  deposito: [
    "/home",
    "/obras",
    "/materiales",
    "/planos",
    "/fotos",
    // "/stock",
    // "/ubicaciones",
    "/asignacionObras",
    "/asignacionMateriales",
    // No navbar - "/asignarMateriales",
    "/consumo",
    // No navbar - "/registrarConsumo",
    "/perfil",
    // "/admins",
    // "/tecnicos",
  ],
  cumplimiento: [
    "/home",
    "/obras",
    "/materiales",
    "/planos",
    "/fotos",
    // "/stock",
    // "/ubicaciones",
    // "/asignacionObras",
    // "/asignacionMateriales",
    // "/consumo",
    "/perfil",
    // "/admins",
    // "/tecnicos",
  ],
};

// 🔹 LAYOUT PRINCIPAL
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [rol, setRol] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Obtener el rol desde Supabase
  useEffect(() => {
    const getRol = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("app_user_admin")
        .select("rol")
        .eq("auth_user_id", user.id)
        .single();

      if (!error && data) {
        setRol(data.rol?.toLowerCase()); // 👈 normalizamos el rol a minúsculas
      } else {
        setRol(null);
      }
    };

    getRol();
  }, []);

  // Cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // 🔒 Control de acceso por rol
 useEffect(() => {
  if (!rol || pathname === "/denegado") return;

  const permisos = permisosPorRol[rol];
  console.log("ROL DETECTADO:", rol);
  console.log("PATHNAME:", pathname);
  console.log("PERMISOS:", permisos);

  if (permisos === "all") return;
  if (!permisos || permisos.length === 0) {
    router.push("/denegado");
    return;
  }

  const tienePermiso = permisos.some((ruta) => pathname.includes(ruta));
  console.log("TIENE PERMISO?", tienePermiso);

  if (!tienePermiso) {
    router.push("/denegado");
  }
}, [rol, pathname, router]);


  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* 🔹 Sidebar */}
      <aside
        className={`hidden md:flex ${
          collapsed ? "w-20" : "w-48"
        } bg-gray-900 text-gray-100 flex-col fixed inset-y-0 transition-all duration-300`}
      >
        {/* Logo y botón de colapsar */}
        <div className="relative flex items-center justify-center pt-3 pb-3 border-b border-gray-700">
          {collapsed ? (
            <Link href="/home">
              <Image
                src="/images/LogoFiocamBurger.png"
                alt="Fio Icon"
                width={40}
                height={40}
                priority
                className="mx-auto mt-10"
              />
            </Link>
          ) : (
            <Link href="/home">
              <Image
                src="/images/LogoFio.png"
                alt="Fio Logo"
                width={100}
                height={100}
                priority
              />
            </Link>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`absolute top-3 p-1 rounded hover:bg-gray-800 transition ${
              collapsed ? "left-1/2 -translate-x-1/2" : "right-3"
            }`}
          >
            {collapsed ? (
              <Bars3Icon className="h-6 w-6 text-gray-300" />
            ) : (
              <ChevronLeftIcon className="h-6 w-6 text-gray-300" />
            )}
          </button>
        </div>

        {/* Navegación lateral */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 mt-3">
          {navItems
            .filter(({ href }) => {
              if (!rol) return false;
              const permisos = permisosPorRol[rol];
              if (!permisos) return false;
              if (permisos === "all") return true;
              return permisos.some((ruta) => href.includes(ruta)); // 👈 cambio a includes
            })
            .map(({ href, label, icon: Icon }) => {
              const active = pathname.includes(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded transition ${
                    active
                      ? "bg-gray-800 text-white"
                      : "hover:bg-gray-700 text-gray-300"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              );
            })}
        </nav>

        {/* Rol actual */}
        {!collapsed && (
          <div className="px-3 py-2 border-t border-gray-700 text-xs text-gray-400">
            {rol ? `Conectado como: ${rol}` : "Cargando rol..."}
          </div>
        )}

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 border border-gray-600 text-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-800 hover:text-white transition"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* 🔹 Contenido principal */}
      <main
        className={`flex-1 h-screen overflow-y-auto pb-16 md:pb-0 p-6 bg-gray-50 transition-all duration-300 ${
          collapsed ? "md:ml-20" : "md:ml-48"
        }`}
      >
        {children}
      </main>

      {/* 🔹 Navbar inferior (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 md:hidden shadow-lg">
        {["/home", "/planos", "/obras", "/fotos", "/perfil"].map((href) => {
          const item = navItems.find((i) => i.href === href);
          if (!item) return null;
          const active = pathname.includes(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center text-xs ${
                active ? "text-blue-600" : "text-gray-500"
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
