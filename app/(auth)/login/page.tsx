"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  // 🔹 Simula barra de progreso mientras se verifica
  useEffect(() => {
    if (loading) {
      setProgress(10);
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p < 90) return p + 10;
          return p;
        });
      }, 400);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // 🟠 Error por demasiados intentos
        if (error.status === 429) {
          setErrorMsg("⚠️ Demasiados intentos. Volvé a intentar en 1 minuto.");
        }
        // 🔴 Error por credenciales inválidas
        else if (error.message?.toLowerCase().includes("invalid login credentials")) {
          setErrorMsg("❌ Credenciales inválidas. Revisá tu usuario y contraseña.");
        }
        // 🔴 Otro error genérico
        else {
          setErrorMsg("❌ Error al iniciar sesión: " + error.message);
        }
        setLoading(false);
        return;
      }

      // ✅ Login correcto
      setProgress(100);
      setTimeout(() => router.push("/home"), 400); // Pequeña pausa para ver la animación
    } catch (err: any) {
      setErrorMsg("❌ Error inesperado: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm space-y-4"
      >
        <div className="flex justify-center mb-4">
          <Image
            src="/images/logofiocamx.png"
            alt="Fiocam Logo"
            width={140}
            height={40}
            priority
            unoptimized
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800">
          Ingreso Admin
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="w-full border rounded p-2"
        />

        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full border rounded p-2 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPass((prev) => !prev)}
            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {errorMsg && (
          <p className="text-red-600 text-sm text-center whitespace-pre-line">
            {errorMsg}
          </p>
        )}

        {/* 🔵 Botón de ingreso con animación */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white font-medium transition-all ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Verificando..." : "Ingresar"}
        </button>

        {/* 🔵 Barra de progreso */}
        {loading && (
          <div className="w-full h-1 bg-gray-200 rounded mt-2 overflow-hidden">
            <div
              className="h-1 bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </form>
    </div>
  );
}
