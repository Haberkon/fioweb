"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

const navItems = [
  { href: "/obras", label: "Obras" },
  { href: "/materiales", label: "Materiales" },
  { href: "/planos", label: "Planos" },
  { href: "/fotos", label: "Fotos" },
  { href: "/stock", label: "Stock" },
  { href: "/ubicaciones", label: "Ubicaciones" },
  { href: "/perfil", label: "Perfil" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-gray-700">
          Dashboard
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded hover:bg-gray-700 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="m-4 flex items-center justify-center gap-2 border border-gray-600 text-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-800 hover:text-white transition"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          Cerrar sesión
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
