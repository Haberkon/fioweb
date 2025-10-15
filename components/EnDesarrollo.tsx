import Link from "next/link";

export default function EnDesarrollo() {
  return (
    <div className="flex items-center justify-center h-[80vh] bg-gray-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🚧 Página en Construcción
        </h1>
        <p className="text-gray-600 mb-6">
          Esta funcionalidad estará disponible próximamente.
        </p>
        <Link
          href="/home"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
