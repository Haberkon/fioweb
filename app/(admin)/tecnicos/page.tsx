/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Edit3, Trash2, Save, X, Plus, Lock, Eye, EyeOff } from "lucide-react";

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
  const [creating, setCreating] = useState(false);

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Creación
  const [nuevoTecnico, setNuevoTecnico] = useState<Partial<Tecnico>>({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCreatePass, setShowCreatePass] = useState(false);

  // Cambio de contraseña
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Cargar técnicos
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

  // --- Edición ---
  const handleEdit = (id: string) => {
    const user = tecnicos.find((t) => t.id === id);
    if (user) setEditando((prev) => ({ ...prev, [id]: user }));
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

  const handleSave = async (id: string) => {
    const changes = editando[id];
    if (!changes) return;

    const tecnico = tecnicos.find((t) => t.id === id);
    if (!tecnico) return alert("Técnico no encontrado");

    try {
      // 🔹 Si cambió el email → actualizar en Supabase Auth
      if (changes.email && changes.email !== tecnico.email) {
        const res = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth_user_id: tecnico.auth_user_id,
            email: changes.email,
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Error al actualizar correo");
      }

      // 🔹 Eliminar el campo email antes de actualizar en app_user
      const { email, ...rest } = changes;
      if (Object.keys(rest).length > 0) {
        const { error } = await supabase.from("app_user").update(rest).eq("id", id);
        if (error) throw new Error(error.message);
      }

      // 🔹 Actualizar estado local
      setTecnicos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...changes } : t))
      );

      handleCancel(id);
      alert("✅ Técnico actualizado correctamente");
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  // --- Crear técnico ---
  const handleCreateTecnico = async () => {
    if (
      !nuevoTecnico.email ||
      !nuevoTecnico.nombre ||
      !nuevoTecnico.apellido ||
      !newPassword ||
      !confirmPassword
    ) {
      alert("Completa todos los campos requeridos");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: nuevoTecnico.email,
          password: newPassword,
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
      setNewPassword("");
      setConfirmPassword("");
      setShowCreateModal(false);
      alert("✅ Técnico creado correctamente");
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setCreating(false);
    }
  };

  // --- Cambiar contraseña existente ---
  const handleResetPassword = (auth_user_id: string | null) => {
    if (!auth_user_id) return alert("Usuario inválido");
    setSelectedUserId(auth_user_id);
    setNewPass("");
    setConfirmPass("");
    setShowModal(true);
  };

  const handleConfirmPasswordChange = async () => {
    if (!selectedUserId) return;
    if (!newPass || !confirmPass) return alert("Completá todos los campos.");
    if (newPass !== confirmPass) return alert("Las contraseñas no coinciden.");

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth_user_id: selectedUserId, password: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("✅ Contraseña cambiada correctamente");
      setShowModal(false);
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  // --- Eliminar técnico ---
  const handleDelete = async (u: Tecnico) => {
    if (!confirm("¿Eliminar técnico?")) return;
    try {
      const res = await fetch("/api/users", {
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

  if (loading) return <div className="p-6 text-gray-600">Cargando...</div>;

  return (
    <div className="p-6 space-y-10">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-blue-700">Técnicos</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Crear Técnico
        </button>
      </div>

      {/* Tabla */}
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
                      onChange={(e) => handleChange(u.id, "nombre", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="border p-1 rounded w-full"
                      value={editando[u.id].apellido ?? ""}
                      onChange={(e) => handleChange(u.id, "apellido", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="border p-1 rounded w-full"
                      value={editando[u.id].dni ?? ""}
                      onChange={(e) => handleChange(u.id, "dni", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="border p-1 rounded w-full"
                      value={editando[u.id].email ?? ""}
                      onChange={(e) => handleChange(u.id, "email", e.target.value)}
                    />
                  </td>
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

      {/* 🔐 Modal Cambiar Contraseña */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Cambiar Contraseña
            </h2>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className="border p-2 rounded w-full"
                  placeholder="Nueva contraseña"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className="border p-2 rounded w-full"
                  placeholder="Confirmar contraseña"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded border border-gray-400 text-gray-600 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPasswordChange}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ Modal Crear Técnico */}
      {showCreateModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Crear Nuevo Técnico
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <input
                className="border p-2 rounded"
                placeholder="Nombre"
                value={nuevoTecnico.nombre ?? ""}
                onChange={(e) =>
                  setNuevoTecnico({ ...nuevoTecnico, nombre: e.target.value })
                }
              />
              <input
                className="border p-2 rounded"
                placeholder="Apellido"
                value={nuevoTecnico.apellido ?? ""}
                onChange={(e) =>
                  setNuevoTecnico({ ...nuevoTecnico, apellido: e.target.value })
                }
              />
              <input
                className="border p-2 rounded"
                placeholder="DNI"
                value={nuevoTecnico.dni ?? ""}
                onChange={(e) =>
                  setNuevoTecnico({ ...nuevoTecnico, dni: e.target.value })
                }
              />
              <input
                className="border p-2 rounded col-span-2"
                placeholder="Email"
                value={nuevoTecnico.email ?? ""}
                onChange={(e) =>
                  setNuevoTecnico({ ...nuevoTecnico, email: e.target.value })
                }
              />

              {/* Contraseña */}
              <div className="col-span-2 relative">
                <input
                  type={showCreatePass ? "text" : "password"}
                  className="border p-2 rounded w-full"
                  placeholder="Contraseña inicial"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePass((p) => !p)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showCreatePass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Confirmar contraseña */}
              <div className="col-span-2 relative">
                <input
                  type={showCreatePass ? "text" : "password"}
                  className="border p-2 rounded w-full"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePass((p) => !p)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showCreatePass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded border border-gray-400 text-gray-600 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
                            <button
                onClick={handleCreateTecnico}
                disabled={creating}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
              >
                {creating ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

