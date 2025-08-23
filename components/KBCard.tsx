export function KBCard({ title, items }:{ title:string; items:string[] }){
  return (
    <div className="rounded-2xl border p-6">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 list-disc pl-5 text-sm text-slate-600 space-y-1">
        {items.map(i=> <li key={i}>{i}</li>)}
      </ul>
    </div>
  )
}
