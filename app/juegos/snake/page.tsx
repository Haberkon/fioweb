"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Position = { x: number; y: number };
type ScoreRecord = { nombre: string; puntaje: number; fecha: string };

const gridSize = 20;
const initialSnake: Position[] = [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
];
const initialDirection: Position = { x: 1, y: 0 };

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>(initialSnake);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Position>(initialDirection);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [ranking, setRanking] = useState<ScoreRecord[]>([]);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const savedBest = localStorage.getItem("snake_best");
    if (savedBest) setBestScore(parseInt(savedBest));
    const savedRanking = localStorage.getItem("snake_ranking");
    if (savedRanking) setRanking(JSON.parse(savedRanking));
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const moveInterval = setInterval(moveSnake, 150);
    return () => clearInterval(moveInterval);
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [direction]);

  const moveSnake = () => {
    setSnake((prevSnake) => {
      const head: Position = {
        x: prevSnake[0].x + direction.x,
        y: prevSnake[0].y + direction.y,
      };

      if (
        head.x < 0 ||
        head.x >= gridSize ||
        head.y < 0 ||
        head.y >= gridSize ||
        prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)
      ) {
        handleGameOver();
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];
      let newFood: Position = food;

      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 1;
        setScore(newScore);

        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem("snake_best", newScore.toString());
        }

        newFood = generateNewFood(newSnake);
        setFood(newFood);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  };

  const generateNewFood = (snakePositions: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      };
    } while (snakePositions.some((seg) => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  };

  const saveRanking = (puntaje: number) => {
    const record: ScoreRecord = {
      nombre: "Jugador",
      puntaje,
      fecha: new Date().toISOString(),
    };
    const prev = JSON.parse(localStorage.getItem("snake_ranking") || "[]") as ScoreRecord[];
    const newList = [...prev, record]
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, 10);
    localStorage.setItem("snake_ranking", JSON.stringify(newList));
    setRanking(newList);
  };

  const handleGameOver = () => {
    setGameOver(true);
    saveRanking(score);
  };

  const resetGame = () => {
    setSnake(initialSnake);
    setDirection(initialDirection);
    setFood({ x: 5, y: 5 });
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-[90vh] bg-gray-50 select-none">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">🐍 Snake clásico</h1>
      <p className="text-gray-600 mb-6">Usá las flechas del teclado para moverte</p>

      {/* 🎯 Juego centrado */}
      <div className="relative flex items-center justify-center">
        {/* Tablero */}
        <div
          className="relative bg-white border border-gray-300 rounded-lg shadow-sm"
          style={{
            width: `${gridSize * 20}px`,
            height: `${gridSize * 20}px`,
          }}
        >
          {snake.map((seg, i) => (
            <div
              key={i}
              className="absolute bg-green-600 rounded-sm"
              style={{
                width: 18,
                height: 18,
                top: seg.y * 20 + 1,
                left: seg.x * 20 + 1,
              }}
            />
          ))}

          {/* 🍎 Comida */}
          <div
            key={`${food.x}-${food.y}`}
            className="absolute bg-red-500 rounded-full animate-pulse"
            style={{
              width: 18,
              height: 18,
              top: food.y * 20 + 1,
              left: food.x * 20 + 1,
            }}
          />

          {/* 💀 Fin del juego */}
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-lg">
              <p className="text-xl font-bold text-gray-700 mb-2">Fin del juego 💀</p>
              <p className="text-gray-600 mb-4">Puntaje: {score}</p>
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Jugar de nuevo
              </button>
            </div>
          )}
        </div>

        {/* 🏅 Ranking flotante a la derecha */}
        {ranking.length > 0 && (
          <div className="absolute left-full ml-6 bg-white border border-gray-200 rounded-xl shadow-sm p-4 w-64">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">
              🏅 Top 10 Local
            </h2>
            {ranking.map((r, i) => (
              <div
                key={i}
                className="flex justify-between border-b border-gray-100 py-1 text-sm text-gray-700"
              >
                <span>
                  {i + 1}. {r.nombre}
                </span>
                <span>{r.puntaje}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HUD */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-4 text-gray-700">
        <span>⭐ Puntaje: <b>{score}</b></span>
        <span>🏆 Récord: <b>{bestScore}</b></span>
      </div>

      {/* Volver */}
      <Link
        href="/home"
        className="mt-6 inline-block px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
