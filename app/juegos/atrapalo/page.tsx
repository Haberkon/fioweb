"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function JuegoPage() {
  const [pos, setPos] = useState({ top: 50, left: 50 });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  // ⏱️ Temporizador
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 🌀 Movimiento aleatorio
  useEffect(() => {
    if (timeLeft <= 0) return;
    const mover = setInterval(() => {
      setPos({
        top: Math.random() * 80 + 10,
        left: Math.random() * 80 + 10,
      });
    }, 800);
    return () => clearInterval(mover);
  }, [timeLeft]);

  // 🎯 Click al logo
  const handleClick = () => {
    if (timeLeft <= 0) return;
    setScore((s) => s + 1);
    setPos({
      top: Math.random() * 80 + 10,
      left: Math.random() * 80 + 10,
    });
  };

  // 🔄 Reiniciar
  const resetGame = () => {
    setScore(0);
    setTimeLeft(30);
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-[85vh] bg-gray-50 overflow-hidden select-none">
      {/* Título */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">🎮 Atrapá el logo de Fiocam</h1>
        <p className="text-gray-600">¡Hacé clic tantas veces como puedas antes de que se acabe el tiempo!</p>
      </div>

      {/* Área de juego */}
      <div className="relative w-full h-[60vh] border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden">
        {timeLeft > 0 ? (
          <Image
            src="/images/LogoFiocamBurger.png"
            alt="Logo Fiocam"
            width={70}
            height={70}
            onClick={handleClick}
            className="absolute cursor-pointer transition-all duration-300 hover:scale-110"
            style={{
              top: `${pos.top}%`,
              left: `${pos.left}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-xl font-semibold text-gray-700 mb-2">¡Tiempo terminado!</p>
            <p className="text-gray-600 mb-4">Puntaje final: {score}</p>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Jugar de nuevo
            </button>
          </div>
        )}
      </div>

      {/* HUD */}
      <div className="flex items-center justify-center gap-6 mt-4 text-gray-700">
        <span>⏱️ Tiempo: <b>{timeLeft}</b>s</span>
        <span>⭐ Puntaje: <b>{score}</b></span>
      </div>

      {/* Botón volver */}
      <Link
        href="/home"
        className="mt-6 inline-block px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
