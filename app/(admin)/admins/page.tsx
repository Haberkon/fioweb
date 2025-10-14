/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Edit3, Trash2, Save, X, Plus, Lock, Eye, EyeOff } from "lucide-react";

type Admin = {
  id: string;
  auth_user_id: string | null;
  nombre: string;
  apellido: string;
  email: string; // correo de autenticación (auth)
  correo_laboral: string | null;
  rol: string;
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Record<string, Partial<Admin>>>({});
  const [creating, setCreating] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [nuevoAdmin, setNuevoAdmin] = useState<Partial<Admin>>({
    nombre: "",
    apellido: "",
    email: "",
    correo_laboral: "",
    rol: "admin",
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCreatePass, setShowCreatePass] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  // 🔹 Cargar admins
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admins");
        if (!res.ok) throw new Error("Error al obtener administradores");
        const data: Admin[] = await res.json();
        setAdmins(data);
      } catch (err) {
        console.error("Error cargando admins:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 🔹 Editar y guardar
  const handleEdit = (id: string) => {
    const user = admins.find((a) => a.id === id);
    if (user) setEditando((prev) => ({ ...prev, [id]: user }));
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
const handleSave = async (id: string) => {
  const changes = editando[id];
  if (!changes) return;

  const user = admins.find((u) => u.id === id);
  if (!user) return alert("Usuario no encontrado");

  // 1️⃣ Actualizar datos en app_user_admin
  const { error: updateError } = await supabase
    .from("app_user_admin")
    .update({
      nombre: changes.nombre ?? user.nombre,
      apellido: changes.apellido ?? user.apellido,
      email: changes.correo_laboral ?? user.correo_laboral, // correo laboral correcto
      rol: (changes.rol ?? user.rol) as any, // asegurar tipo correcto (enum)
    })
    .eq("auth_user_id", user.auth_user_id);

  if (updateError) {
    console.error("Error actualizando app_user_admin:", updateError);
    alert("❌ Error actualizando datos: " + updateError.message);
    return;
  }

  // 2️⃣ Si cambió el correo de autenticación (auth)
  if (changes.email && changes.email !== user.email && user.auth_user_id) {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_user_id: user.auth_user_id,
          email: changes.email,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
    } catch (err: any) {
      alert("Error actualizando correo de autenticación: " + err.message);
    }
  }

  // 3️⃣ Actualizar local
  setAdmins((prev) => prev.map((u) => (u.id === id ? { ...u, ...changes } : u)));
  handleCancel(id);
  alert("✅ Administrador actualizado correctamente");
};

 
  // 🔹 Crear admin
  const handleCreateAdmin = async () => {
    if (
      !nuevoAdmin.email ||
      !nuevoAdmin.nombre ||
      !nuevoAdmin.apellido ||
      !nuevoAdmin.rol ||
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
      const payload = {
        email: nuevoAdmin.email,
        password: newPassword,
        nombre: nuevoAdmin.nombre,
        apellido: nuevoAdmin.apellido,
        correo_laboral: nuevoAdmin.correo_laboral,
        rol: nuevoAdmin.rol,
      };

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      const nuevo: Admin = {
        id: result.userId,
        auth_user_id: result.userId,
        nombre: nuevoAdmin.nombre ?? "",
        apellido: nuevoAdmin.apellido ?? "",
        email: nuevoAdmin.email ?? "",
        correo_laboral: nuevoAdmin.correo_laboral ?? "",
        rol: nuevoAdmin.rol ?? "admin",
      };

      setAdmins((prev) => [...prev, nuevo]);
      setNuevoAdmin({ nombre: "", apellido: "", email: "", correo_laboral: "", rol: "admin" });
      setNewPassword("");
      setConfirmPassword("");
      setShowCreateModal(false);
      alert("✅ Administrador creado correctamente");
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setCreating(false);
    }
  };

  // 🔹 Cambio de contraseña
  const handleResetPassword = (auth_user_id: string | null) => {
    if (!auth_user_id) return alert("Usuario inválido");
    setSelectedUserId(auth_user_id);
    setNewPass("");
    setConfirmPass("");
    setShowPass(false);
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

  // 🔹 Eliminar
  const handleDelete = async (u: Admin) => {
    if (!confirm("¿Eliminar administrador?")) return;
    try {
      const res = await fetch("/api/users", {
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

  if (loading) return <div className="p-6 text-gray-600">Cargando...</div>;

  return (
    <div className="p-6 space-y-10">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-blue-700">Administradores</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Crear Admin
        </button>
      </div>

      <table className="min-w-full bg-white rounded shadow">
  <thead className="bg-gray-100">
    <tr>
      <th className="px-3 py-2 text-left">Rol</th>
      <th className="px-3 py-2 text-left">Nombre</th>
      <th className="px-3 py-2 text-left">Apellido</th>
      <th className="px-3 py-2 text-left">Email</th>
      <th className="px-3 py-2 text-left">Correo laboral</th>
      <th className="px-3 py-2 text-center">Acciones</th>
    </tr>
  </thead>

        <tbody>
          {admins.map((u) => (
            <tr key={u.id} className="border-t">
              {editando[u.id] ? (
                <>
                  {/* Rol editable */}
                  <td className="px-3 py-2">
                    <select
                      className="border p-1 rounded w-full"
                      value={editando[u.id].rol ?? u.rol}
                      onChange={(e) => handleChange(u.id, "rol", e.target.value)}
                    >
                      <option value="admin">Administrador</option>
                      <option value="superadmin">Superadmin</option>
                      <option value="cumplimiento">Cumplimiento</option>
                      <option value="deposito">Deposito</option>
                    </select>
                  </td>

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
                      value={editando[u.id].email ?? ""}
                      onChange={(e) => handleChange(u.id, "email", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="border p-1 rounded w-full"
                      value={editando[u.id].correo_laboral ?? ""}
                      onChange={(e) =>
                        handleChange(u.id, "correo_laboral", e.target.value)
                      }
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
                  {/* Rol con chip de color */}
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.rol === "superadmin"
                          ? "bg-green-100 text-green-700"
                          : u.rol === "admin"
                          ? "bg-blue-100 text-blue-700"
                          : u.rol === "cumplimiento"
                          ?  "bg-yellow-200 text-yellow-800"
                          : u.rol === "deposito"
                          ? "bg-orange-200 text-gray-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.rol.charAt(0).toUpperCase() + u.rol.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2">{u.nombre}</td>
                  <td className="px-3 py-2">{u.apellido}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.correo_laboral ?? "-"}</td>
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


      {/* ➕ Modal Crear Admin */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Crear Nuevo Administrador
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <input
                className="border p-2 rounded"
                placeholder="Nombre"
                value={nuevoAdmin.nombre ?? ""}
                onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, nombre: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                placeholder="Apellido"
                value={nuevoAdmin.apellido ?? ""}
                onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, apellido: e.target.value })}
              />
              <input
                className="border p-2 rounded col-span-2"
                placeholder="Email (inicio de sesión)"
                value={nuevoAdmin.email ?? ""}
                onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, email: e.target.value })}
              />
              <input
                className="border p-2 rounded col-span-2"
                placeholder="Correo laboral"
                value={nuevoAdmin.correo_laboral ?? ""}
                onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, correo_laboral: e.target.value })}
              />
              <select
                className="border p-2 rounded col-span-2"
                value={nuevoAdmin.rol ?? "admin"}
                onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, rol: e.target.value })}
              >
                <option value="admin">Administrador</option>
                <option value="superadmin">Superadmin</option>
                <option value="cumplimiento">Cumplimiento</option>
                <option value="deposito">Deposito</option>
              </select>

              {/* Contraseñas */}
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

              <div className="col-span-2 relative">
                <input
                  type={showCreatePass ? "text" : "password"}
                  className="border p-2 rounded w-full"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
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
                onClick={handleCreateAdmin}
                disabled={creating}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
              >
                {creating ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 Modal Cambiar Contraseña */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Cambiar Contraseña</h2>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Nueva contraseña"
                className="border p-2 rounded w-full"
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
                placeholder="Confirmar nueva contraseña"
                className="border p-2 rounded w-full"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
              />
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
    </div>
  );
}
