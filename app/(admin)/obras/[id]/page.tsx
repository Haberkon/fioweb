// app/(admin)/obras/[id]/page.tsx

export default function TestPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Test Obra {params.id}</h1>
    </div>
  );
}
