"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Edit3, Trash2, Save, X, Plus, Lock } from "lucide-react";

type Usuario = {
  id: string;
  auth_user_id: string | null;
  nombre: string;
  apellido: string;
  email: string;
  dni?: string | null;
  rol: "admin" | "tecnico";
};

export default function RolesPage() {
  const [admins, setAdmins] = useState<Usuario[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Record<string, Partial<Usuario>>>({});
  const [nuevo, setNuevo] = useState<{
    tipo: "admin" | "tecnico";
    data: Partial<Usuario>;
  }>({
    tipo: "admin",
    data: { nombre: "", apellido: "", email: "", dni: "" },
  });
  const [creating, setCreating] = useState(false);

  // 📦 Cargar usuarios desde Supabase
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: a } = await supabase
          .from("app_user_admin")
          .select("id, auth_user_id, nombre, apellido, email");

        const { data: t } = await supabase
          .from("app_user")
          .select("id, auth_user_id, nombre, apellido, dni, rol");

        setAdmins(
          (a ?? []).map((x) => ({
            ...x,
            email: x.email ?? "",
            rol: "admin",
          }))
        );

        setTecnicos(
          (t ?? []).map((x) => ({
            ...x,
            email: "",
            rol: "tecnico",
          }))
        );
      } catch (e) {
        console.error("Error cargando usuarios", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ✏️ Editar usuario
  const handleEdit = (id: string, rol: "admin" | "tecnico") => {
    const user =
      rol === "admin"
        ? admins.find((a) => a.id === id)
        : tecnicos.find((t) => t.id === id);
    if (!user) return;
    setEditando((prev) => ({ ...prev, [id]: user }));
  };

  const handleChange = (id: string, field: keyof Usuario, value: string) => {
    setEditando((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleCancel = (id: string) => {
    const { [id]: _, ...rest } = editando;
    setEditando(rest);
  };

  // 💾 Guardar cambios
  const handleSave = async (id: string, rol: "admin" | "tecnico") => {
    const changes: Partial<Usuario> = { ...editando[id] };
    if (!changes) return;

    // 🧹 Evitar actualizar email si no existe columna
    if ("email" in changes) delete (changes as any).email;

    const table = rol === "admin" ? "app_user_admin" : "app_user";
    const { error } = await supabase.from(table).update(changes).eq("id", id);
    if (error) {
      alert("Error al actualizar: " + error.message);
      return;
    }

    if (rol === "admin")
      setAdmins((a) => a.map((u) => (u.id === id ? { ...u, ...changes } : u)));
    else
      setTecnicos((a) => a.map((u) => (u.id === id ? { ...u, ...changes } : u)));

    handleCancel(id);
    alert("✅ Usuario actualizado");
  };

  // 🔒 Cambiar contraseña (API segura)
  const handleResetPassword = async (auth_user_id: string | null) => {
    if (!auth_user_id) return alert("Usuario sin ID válido");
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
      alert("🔑 Contraseña actualizada correctamente");
    } catch (err: any) {
      alert("Error cambiando contraseña: " + err.message);
    }
  };

  // 🗑️ Eliminar usuario (API segura)
  const handleDelete = async (u: Usuario) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_user_id: u.auth_user_id,
          tabla: u.rol === "admin" ? "app_user_admin" : "app_user",
          id: u.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (u.rol === "admin")
        setAdmins((prev) => prev.filter((a) => a.id !== u.id));
      else setTecnicos((prev) => prev.filter((a) => a.id !== u.id));

      alert("🗑️ Usuario eliminado correctamente");
    } catch (err: any) {
      alert("Error eliminando usuario: " + err.message);
    }
  };

  // ➕ Crear usuario (API segura)
  const handleCreate = async (tipo: "admin" | "tecnico") => {
    const data = nuevo.data;
    if (!data.email || !data.nombre || !data.apellido) {
      alert("Completa nombre, apellido y email");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: "12345678",
          nombre: data.nombre,
          apellido: data.apellido,
          dni: data.dni,
          rol: tipo,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      alert("✅ Usuario creado correctamente");

      const nuevoUser: Usuario = {
        id: result.userId,
        auth_user_id: result.userId,
        nombre: data.nombre ?? "",
        apellido: data.apellido ?? "",
        dni: data.dni ?? "",
        email: data.email ?? "",
        rol: tipo,
      };

      if (tipo === "admin") setAdmins((prev) => [...prev, nuevoUser]);
      else setTecnicos((prev) => [...prev, nuevoUser]);

      setNuevo({
        tipo,
        data: { nombre: "", apellido: "", dni: "", email: "" },
      });
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setCreating(false);
    }
  };

  // 🧱 Tabla reutilizable
  const renderTable = (users: Usuario[], color: string) => (
    <table className="min-w-full bg-white rounded shadow">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-3 py-2 text-left">Nombre</th>
          <th className="px-3 py-2 text-left">Apellido</th>
          {users[0]?.rol === "tecnico" && (
            <th className="px-3 py-2 text-left">DNI</th>
          )}
          <th className="px-3 py-2 text-left">Email</th>
          <th className="px-3 py-2 text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
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
                {u.rol === "tecnico" && (
                  <td className="px-3 py-2">
                    <input
                      className="border p-1 rounded w-full"
                      value={editando[u.id].dni ?? ""}
                      onChange={(e) =>
                        handleChange(u.id, "dni", e.target.value)
                      }
                    />
                  </td>
                )}
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2 flex justify-center gap-2">
                  <button onClick={() => handleSave(u.id, u.rol)}>
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
                {u.rol === "tecnico" && (
                  <td className="px-3 py-2">{u.dni ?? "-"}</td>
                )}
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2 flex justify-center gap-3">
                  <button onClick={() => handleEdit(u.id, u.rol)}>
                    <Edit3 className={`w-5 h-5 text-${color}-600`} />
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
  );

  // 🧩 Render principal
  if (loading) return <div className="p-6 text-gray-600">Cargando usuarios...</div>;

  return (
    <div className="p-6 space-y-10">
      {/* ===================== ADMINS ===================== */}
      <section>
        <h2 className="text-xl font-bold text-red-700 mb-2">
          Administradores
        </h2>
        <div className="flex gap-2 mb-3">
          <input
            className="border p-2 rounded w-40"
            placeholder="Nombre"
            value={nuevo.data.nombre ?? ""}
            onChange={(e) =>
              setNuevo({
                tipo: "admin",
                data: { ...nuevo.data, nombre: e.target.value },
              })
            }
          />
          <input
            className="border p-2 rounded w-40"
            placeholder="Apellido"
            value={nuevo.data.apellido ?? ""}
            onChange={(e) =>
              setNuevo({
                tipo: "admin",
                data: { ...nuevo.data, apellido: e.target.value },
              })
            }
          />
          <input
            className="border p-2 rounded w-64"
            placeholder="Email"
            value={nuevo.data.email ?? ""}
            onChange={(e) =>
              setNuevo({
                tipo: "admin",
                data: { ...nuevo.data, email: e.target.value },
              })
            }
          />
          <button
            onClick={() => handleCreate("admin")}
            className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
          >
            {creating ? (
              "Creando..."
            ) : (
              <>
                <Plus className="w-4 h-4 inline" /> Crear
              </>
            )}
          </button>
        </div>
        {renderTable(admins, "red")}
      </section>

      {/* ===================== TECNICOS ===================== */}
      <section>
        <h2 className="text-xl font-bold text-blue-700 mb-2">Técnicos</h2>
        <div className="flex gap-2 mb-3">
          <input
            className="border p-2 rounded w-40"
            placeholder="Nombre"
            value={nuevo.data.nombre ?? ""}
            onChange={(e) =>
              setNuevo({
                tipo: "tecnico",
                data: { ...nuevo.data, nombre: e.target.value },
              })
            }
          />
          <input
            className="border p-2 rounded w-40"
            placeholder="Apellido"
            value={nuevo.data.apellido ?? ""}
            onChange={(e) =>
              setNuevo({
                tipo: "tecnico",
                data: { ...nuevo.data, apellido: e.target.value },
              })
            }
          />
          <input
            className="border p-2 rounded w-32"
            placeholder="DNI"
            value={nuevo.data.dni ?? ""}
            onChange={(e) =>
              setNuevo({
                tipo: "tecnico",
                data: { ...nuevo.data, dni: e.target.value },
              })
            }
          />
          <input
            className="border p-2 rounded w-64"
            placeholder="Email"
            value={nuevo.data.email ?? ""}
            onChange={(e) =>
              setNuevo({
                tipo: "tecnico",
                data: { ...nuevo.data, email: e.target.value },
              })
            }
          />
          <button
            onClick={() => handleCreate("tecnico")}
            className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
          >
            {creating ? (
              "Creando..."
            ) : (
              <>
                <Plus className="w-4 h-4 inline" /> Crear
              </>
            )}
          </button>
        </div>
        {renderTable(tecnicos, "blue")}
      </section>
    </div>
  );
}
