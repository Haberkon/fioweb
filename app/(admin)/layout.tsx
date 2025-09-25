import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <nav className="space-y-2">
          <Link href="/obras">Obras</Link>
          <Link href="/materiales">Materiales</Link>
          <Link href="/planos">Planos</Link>
          <Link href="/fotos">Fotos</Link>
          <Link href="/stock">Stock</Link>
          <Link href="/ubicaciones">Ubicaciones</Link>
          <Link href="/perfil">Perfil</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  )
}
