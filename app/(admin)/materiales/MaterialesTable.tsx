"use client";

import { useState } from "react";

type Material = {
  id: string;
  codigo: string;
  descripcion: string | null;
  unidad: string | null;
  abreviacion: string | null;
  activo: boolean;
};

export default function MaterialesTable({ materiales }: { materiales: Material[] }) {
  const [sortKey, setSortKey] = useState<keyof Material>("codigo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = [...materiales].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (aVal === null) return 1;
    if (bVal === null) return -1;

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }

    return sortDir === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const handleSort = (key: keyof Material) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortArrow = (key: keyof Material) => {
    if (sortKey !== key) return "⇅";
    return sortDir === "asc" ? "↑" : "↓";
  };

  return (<div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-lg border border-gray-200 shadow-sm">
    <table className="w-full border text-sm text-gray-700">
      <thead>
        <tr className="bg-gray-200">
          <th className="p-2 border cursor-pointer" onClick={() => handleSort("codigo")}>
            Código {sortArrow("codigo")}
          </th>
          <th className="p-2 border cursor-pointer" onClick={() => handleSort("descripcion")}>
            Descripción {sortArrow("descripcion")}
          </th>
          <th className="p-2 border cursor-pointer" onClick={() => handleSort("unidad")}>
            Unidad {sortArrow("unidad")}
          </th>
          <th className="p-2 border cursor-pointer" onClick={() => handleSort("abreviacion")}>
            Abrev. {sortArrow("abreviacion")}
          </th>
          <th className="p-2 border cursor-pointer" onClick={() => handleSort("activo")}>
            Activo {sortArrow("activo")}
          </th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((m) => (
          <tr key={m.id} className="hover:bg-gray-50">
            <td className="p-2 border">{m.codigo}</td>
            <td className="p-2 border">{m.descripcion}</td>
            <td className="p-2 border">{m.unidad}</td>
            <td className="p-2 border">{m.abreviacion}</td>
            <td className="p-2 border">
              {m.activo ? (
                <span className="text-green-600 font-semibold">✔</span>
              ) : (
                <span className="text-red-600 font-semibold">✘</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
</div>
  );
}
