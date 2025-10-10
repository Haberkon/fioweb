"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Edit3, Trash2, Save, X, Plus, Lock } from "lucide-react";

type Admin = {
  id: string;
  auth_user_id: string | null;
  nombre: string;
  apellido: string;
  email: string;
  rol: "admin";
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Record<string, Partial<Admin>>>({});
  const [nuevoAdmin, setNuevoAdmin] = useState<Partial<Admin>>({
    nombre: "",
    apellido: "",
    email: "",
  });
  const [creating, setCreating] = useState(false);

  // 📦 Cargar administradores
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("app_user_admin")
        .select("id, auth_user_id, nombre, apellido, email");
      if (error) console.error(error);
      setAdmins((data ?? []).map((x) => ({ ...x, rol: "admin" })));
      setLoading(false);
    };
    load();
  }, []);

  // ✏️ Editar
  const handleEdit = (id: string) => {
    const user = admins.find((a) => a.id === id);
    if (!user) return;
    setEditando((prev) => ({ ...prev, [id]: user }));
  };

  const handleChange = (id: string, field: keyof Admin, value: string) => {
    setEditando((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleCancel = (id: string) => {
    const { [id]: _, ...rest } = editando;
    setEditando(rest);
  };

  // 💾 Guardar
  const handleSave = async (id: string) => {
    const changes: Partial<Admin> = { ...editando[id] };
    if (!changes) return;

    if ("email" in changes) delete (changes as any).email;

    const { error } = await supabase
      .from("app_user_admin")
      .update(changes)
      .eq("id", id);

    if (error) return alert("Error al actualizar: " + error.message);

    setAdmins((a) => a.map((u) => (u.id === id ? { ...u, ...changes } : u)));
    handleCancel(id);
    alert("✅ Administrador actualizado");
  };

  // 🔒 Cambiar contraseña
  const handleResetPassword = async (auth_user_id: string | null) => {
    if (!auth_user_id) return alert("Sin ID de usuario válido");
    const pass = prompt("Nueva contraseña:");
    if (!pass) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth_user_id, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("🔑 Contraseña cambiada correctamente");
    } catch (err: any) {
      alert("Error cambiando contraseña: " + err.message);
    }
  };

  // 🗑️ Eliminar
  const handleDelete = async (u: Admin) => {
    if (!confirm("¿Eliminar administrador?")) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_user_id: u.auth_user_id,
          tabla: "app_user_admin",
          id: u.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAdmins((prev) => prev.filter((a) => a.id !== u.id));
      alert("🗑️ Administrador eliminado correctamente");
    } catch (err: any) {
      alert("Error eliminando usuario: " + err.message);
    }
  };

  // ➕ Crear nuevo
  const handleCreateAdmin = async () => {
    if (!nuevoAdmin.email || !nuevoAdmin.nombre || !nuevoAdmin.apellido) {
      alert("Completa todos los campos requeridos");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: nuevoAdmin.email,
          password: "12345678",
          nombre: nuevoAdmin.nombre,
          apellido: nuevoAdmin.apellido,
          rol: "admin",
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      const nuevo: Admin = {
        id: result.userId,
        auth_user_id: result.userId,
        nombre: nuevoAdmin.nombre ?? "",
        apellido: nuevoAdmin.apellido ?? "",
        email: nuevoAdmin.email ?? "",
        rol: "admin",
      };
      setAdmins((prev) => [...prev, nuevo]);
      setNuevoAdmin({ nombre: "", apellido: "", email: "" });
      alert("✅ Administrador creado correctamente");
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-600">Cargando...</div>;

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-xl font-bold text-red-700 mb-2">Administradores</h2>

      <div className="flex gap-2 mb-3">
        <input
          className="border p-2 rounded w-40"
          placeholder="Nombre"
          value={nuevoAdmin.nombre ?? ""}
          onChange={(e) =>
            setNuevoAdmin({ ...nuevoAdmin, nombre: e.target.value })
          }
        />
        <input
          className="border p-2 rounded w-40"
          placeholder="Apellido"
          value={nuevoAdmin.apellido ?? ""}
          onChange={(e) =>
            setNuevoAdmin({ ...nuevoAdmin, apellido: e.target.value })
          }
        />
        <input
          className="border p-2 rounded w-64"
          placeholder="Email"
          value={nuevoAdmin.email ?? ""}
          onChange={(e) =>
            setNuevoAdmin({ ...nuevoAdmin, email: e.target.value })
          }
        />
        <button
          onClick={handleCreateAdmin}
          className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
        >
          {creating ? "Creando..." : <><Plus className="w-4 h-4 inline" /> Crear</>}
        </button>
      </div>

      <table className="min-w-full bg-white rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left">Nombre</th>
            <th className="px-3 py-2 text-left">Apellido</th>
            <th className="px-3 py-2 text-left">Email</th>
            <th className="px-3 py-2 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((u) => (
            <tr key={u.id} className="border-t">
              {editando[u.id] ? (
                <>
                  <td className="px-3 py-2">
                    <input
                      className="border p-1 rounded w-full"
                      value={editando[u.id].nombre ?? ""}
                      onChange={(e) =>
                        handleChange(u.id, "nombre", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="border p-1 rounded w-full"
                      value={editando[u.id].apellido ?? ""}
                      onChange={(e) =>
                        handleChange(u.id, "apellido", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2 flex justify-center gap-2">
                    <button onClick={() => handleSave(u.id)}>
                      <Save className="w-5 h-5 text-green-600" />
                    </button>
                    <button onClick={() => handleCancel(u.id)}>
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-3 py-2">{u.nombre}</td>
                  <td className="px-3 py-2">{u.apellido}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2 flex justify-center gap-3">
                    <button onClick={() => handleEdit(u.id)}>
                      <Edit3 className="w-5 h-5 text-red-600" />
                    </button>
                    <button onClick={() => handleResetPassword(u.auth_user_id)}>
                      <Lock className="w-5 h-5 text-yellow-500" />
                    </button>
                    <button onClick={() => handleDelete(u)}>
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
