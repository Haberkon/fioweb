"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Edit3, Trash2, Save, X, Plus, Lock } from "lucide-react";

type Tecnico = {
  id: string;
  auth_user_id: string | null;
  nombre: string;
  apellido: string;
  dni: string | null;
  email: string;
  rol: "tecnico";
};

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Record<string, Partial<Tecnico>>>({});
  const [nuevoTecnico, setNuevoTecnico] = useState<Partial<Tecnico>>({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
  });
  const [creating, setCreating] = useState(false);

  // 🔒 Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  // 📦 Cargar técnicos (desde API segura)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/tecnicos");
        if (!res.ok) throw new Error("Error al obtener técnicos");
        const data: Tecnico[] = await res.json();
        setTecnicos(data);
      } catch (err) {
        console.error("Error cargando técnicos:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ✏️ Editar
  const handleEdit = (id: string) => {
    const user = tecnicos.find((t) => t.id === id);
    if (!user) return;
    setEditando((prev) => ({ ...prev, [id]: user }));
  };

  const handleChange = (id: string, field: keyof Tecnico, value: string) => {
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
  const handleSave = async (id: string) => {
    const changes: Partial<Tecnico> = { ...editando[id] };
    if (!changes) return;

    delete (changes as any).email;

    const { error } = await supabase
      .from("app_user")
      .update(changes)
      .eq("id", id);

    if (error) return alert("Error al actualizar: " + error.message);

    setTecnicos((a) => a.map((u) => (u.id === id ? { ...u, ...changes } : u)));
    handleCancel(id);
    alert("✅ Técnico actualizado");
  };

  // 🔒 Abrir modal para cambiar contraseña
  const handleResetPassword = (auth_user_id: string | null) => {
    if (!auth_user_id) return alert("Usuario inválido");
    setSelectedUserId(auth_user_id);
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
    setShowModal(true);
  };

  // 🔑 Confirmar cambio de contraseña
  const handleConfirmPasswordChange = async () => {
    if (!selectedUserId) return;

    if (!newPass || !confirmPass)
      return alert("Completá todos los campos.");

    if (newPass !== confirmPass)
      return alert("Las contraseñas no coinciden.");

    try {
      const res = await fetch("/api/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth_user_id: selectedUserId, password: newPass }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar contraseña");

      alert("✅ Contraseña cambiada correctamente");
      setShowModal(false);
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  // 🗑️ Eliminar técnico
  const handleDelete = async (u: Tecnico) => {
    if (!confirm("¿Eliminar técnico?")) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_user_id: u.auth_user_id,
          tabla: "app_user",
          id: u.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTecnicos((prev) => prev.filter((a) => a.id !== u.id));
      alert("🗑️ Técnico eliminado correctamente");
    } catch (err: any) {
      alert("Error eliminando usuario: " + err.message);
    }
  };

  // ➕ Crear nuevo técnico
  const handleCreateTecnico = async () => {
    if (!nuevoTecnico.email || !nuevoTecnico.nombre || !nuevoTecnico.apellido) {
      alert("Completa todos los campos requeridos");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: nuevoTecnico.email,
          password: "12345678",
          nombre: nuevoTecnico.nombre,
          apellido: nuevoTecnico.apellido,
          dni: nuevoTecnico.dni,
          rol: "tecnico",
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      const nuevo: Tecnico = {
        id: result.userId,
        auth_user_id: result.userId,
        nombre: nuevoTecnico.nombre ?? "",
        apellido: nuevoTecnico.apellido ?? "",
        dni: nuevoTecnico.dni ?? "",
        email: nuevoTecnico.email ?? "",
        rol: "tecnico",
      };
      setTecnicos((prev) => [...prev, nuevo]);
      setNuevoTecnico({ nombre: "", apellido: "", dni: "", email: "" });
      alert("✅ Técnico creado correctamente");
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-600">Cargando...</div>;

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-xl font-bold text-blue-700 mb-2">Técnicos</h2>

      <div className="flex gap-2 mb-3">
        <input
          className="border p-2 rounded w-40"
          placeholder="Nombre"
          value={nuevoTecnico.nombre ?? ""}
          onChange={(e) =>
            setNuevoTecnico({ ...nuevoTecnico, nombre: e.target.value })
          }
        />
        <input
          className="border p-2 rounded w-40"
          placeholder="Apellido"
          value={nuevoTecnico.apellido ?? ""}
          onChange={(e) =>
            setNuevoTecnico({ ...nuevoTecnico, apellido: e.target.value })
          }
        />
        <input
          className="border p-2 rounded w-32"
          placeholder="DNI"
          value={nuevoTecnico.dni ?? ""}
          onChange={(e) =>
            setNuevoTecnico({ ...nuevoTecnico, dni: e.target.value })
          }
        />
        <input
          className="border p-2 rounded w-64"
          placeholder="Email"
          value={nuevoTecnico.email ?? ""}
          onChange={(e) =>
            setNuevoTecnico({ ...nuevoTecnico, email: e.target.value })
          }
        />
        <button
          onClick={handleCreateTecnico}
          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
        >
          {creating ? "Creando..." : <><Plus className="w-4 h-4 inline" /> Crear</>}
        </button>
      </div>

      <table className="min-w-full bg-white rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left">Nombre</th>
            <th className="px-3 py-2 text-left">Apellido</th>
            <th className="px-3 py-2 text-left">DNI</th>
            <th className="px-3 py-2 text-left">Email</th>
            <th className="px-3 py-2 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tecnicos.map((u) => (
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
                  <td className="px-3 py-2">
                    <input
                      className="border p-1 rounded w-full"
                      value={editando[u.id].dni ?? ""}
                      onChange={(e) =>
                        handleChange(u.id, "dni", e.target.value)
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
                  <td className="px-3 py-2">{u.dni ?? "-"}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2 flex justify-center gap-3">
                    <button onClick={() => handleEdit(u.id)}>
                      <Edit3 className="w-5 h-5 text-blue-600" />
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

      {/* 🔒 Modal Cambiar Contraseña */}
      {showModal && (
<div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4 pointer-events-auto">
            <h2 className="text-lg font-semibold text-gray-800">
              Cambiar Contraseña
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-600">
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="Contraseña actual"
                  className="w-full border p-2 rounded mt-1"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Nueva contraseña"
                className="w-full border p-2 rounded mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full border p-2 rounded mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded border border-gray-400 text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPasswordChange}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
