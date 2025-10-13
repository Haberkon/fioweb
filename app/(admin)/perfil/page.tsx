/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Save, Lock, Eye, EyeOff, User, Edit3 } from "lucide-react";

type AdminPerfil = {
  id: string;
  auth_user_id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null; // correo laboral
  avatar_url: string | null;
  created_at: string | null;
  rol: string | null;
};

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<AdminPerfil | null>(null);
  const [authEmail, setAuthEmail] = useState<string>("");
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal contraseña
  const [showModal, setShowModal] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const loadPerfil = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        alert("No se encontró usuario autenticado");
        setLoading(false);
        return;
      }

      setAuthEmail(user.email ?? "");

      // Trae el perfil completo con el rol real
      const { data, error } = await supabase
        .from("app_user_admin")
        .select("id, auth_user_id, nombre, apellido, email, avatar_url, created_at, rol")
        .eq("auth_user_id", user.id)
        .single();

      if (error) {
        console.error(error);
        alert("Error al cargar perfil");
      } else {
        setPerfil(data);
      }

      setLoading(false);
    };
    loadPerfil();
  }, []);

  const handleChange = (field: keyof AdminPerfil, value: string) => {
    if (perfil) setPerfil({ ...perfil, [field]: value });
  };

  const handleSave = async () => {
    if (!perfil) return;
    setSaving(true);

    const { id, auth_user_id, created_at, rol, ...changes } = perfil;

    const { error } = await supabase
      .from("app_user_admin")
      .update(changes)
      .eq("id", perfil.id);

    setSaving(false);
    setEditando(false);

    if (error) return alert("❌ Error al guardar cambios: " + error.message);
    alert("✅ Perfil actualizado correctamente");
  };

  const handleConfirmPasswordChange = async () => {
    if (!perfil?.auth_user_id) return alert("Usuario inválido");
    if (!currentPass || !newPass || !confirmNewPass)
      return alert("Completá todos los campos.");
    if (newPass !== confirmNewPass)
      return alert("Las contraseñas nuevas no coinciden.");

    try {
      const { data: userData, error: userError } =
        await supabase.auth.signInWithPassword({
          email: authEmail,
          password: currentPass,
        });

      if (userError || !userData?.user) {
        return alert("❌ Contraseña actual incorrecta");
      }

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_user_id: perfil.auth_user_id,
          password: newPass,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("✅ Contraseña cambiada correctamente");
      setShowModal(false);
      setCurrentPass("");
      setNewPass("");
      setConfirmNewPass("");
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  if (loading)
    return <div className="p-6 text-gray-600">Cargando perfil...</div>;
  if (!perfil)
    return <div className="p-6 text-gray-600">No se encontró el perfil.</div>;

  return (
    <div className="p-6 flex justify-center">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl p-8 space-y-6">
        {/* Header con avatar */}
        <div className="flex items-center gap-5 border-b pb-4 mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border">
              {perfil.avatar_url ? (
                <img
                  src={perfil.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={80} className="text-gray-400" />
              )}
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-800">
              {perfil.nombre} {perfil.apellido}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Rol:{" "}
              <span className="font-medium text-gray-700">
                {perfil.rol ?? "—"}
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setEditando(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" /> Editar perfil
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-1"
            >
              <Lock className="w-4 h-4" /> Cambiar contraseña
            </button>
          </div>
        </div>

        {/* Datos del perfil */}
        <div className="grid grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nombre
            </label>
            <input
              className="border p-2 rounded w-full"
              value={perfil.nombre ?? ""}
              onChange={(e) => handleChange("nombre", e.target.value)}
              disabled={!editando}
            />
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Apellido
            </label>
            <input
              className="border p-2 rounded w-full"
              value={perfil.apellido ?? ""}
              onChange={(e) => handleChange("apellido", e.target.value)}
              disabled={!editando}
            />
          </div>

          {/* Correo autenticación */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Correo (Autenticación)
            </label>
            <input
              type="email"
              className="border p-2 rounded w-full bg-gray-50"
              value={authEmail}
              disabled
            />
          </div>

          {/* Correo laboral */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Correo laboral
            </label>
            <input
              type="email"
              className="border p-2 rounded w-full"
              value={perfil.email ?? ""}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={!editando}
            />
          </div>
        </div>

        {editando && (
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              onClick={() => setEditando(false)}
              className="px-4 py-2 border border-gray-400 text-gray-600 rounded hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* 🔐 Modal cambiar contraseña */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Cambiar Contraseña
            </h2>

            {/* Contraseña actual */}
            <div className="relative">
              <label className="block text-xs text-gray-600 mb-1">
                Contraseña actual
              </label>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Ingresa tu contraseña actual"
                className="border p-2 rounded w-full"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-7 text-gray-500 hover:text-gray-700"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Nueva */}
            <div className="relative">
              <label className="block text-xs text-gray-600 mb-1">
                Nueva contraseña
              </label>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Nueva contraseña"
                className="border p-2 rounded w-full"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
            </div>

            {/* Confirmar */}
            <div className="relative">
              <label className="block text-xs text-gray-600 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Confirmar nueva contraseña"
                className="border p-2 rounded w-full"
                value={confirmNewPass}
                onChange={(e) => setConfirmNewPass(e.target.value)}
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
