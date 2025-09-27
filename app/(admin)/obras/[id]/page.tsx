// app/(admin)/obras/[id]/page.tsx
export const runtime = "nodejs";

type ObraPageProps = {
  params: {
    id: string;
  };
};

export default function ObraDetallePage(props: ObraPageProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Detalle de obra {props.params.id}</h1>
    </div>
  );
}
