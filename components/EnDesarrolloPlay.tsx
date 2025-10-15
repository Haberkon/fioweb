import Link from "next/link";

export default function EnDesarrollo() {
  return (
    <div className="flex items-center justify-center h-[80vh] bg-gray-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🚧 Página en desarrollo
        </h1>
        <p className="text-gray-600 mb-6">
          Esta funcionalidad estará disponible próximamente.
        </p>

        <div className="flex justify-center gap-3 flex-wrap">
          <Link
            href="/home"
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition"
          >
            Volver al inicio
          </Link>

          <Link
            href="/juegos/atrapalo"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Atrapalo
          </Link>

          <Link
            href="/juegos/snake"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Snake
          </Link>
        </div>
      </div>
    </div>
  );
}
