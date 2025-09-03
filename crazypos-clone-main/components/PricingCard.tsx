export function PricingCard({ name, blurb, price, period, cta }:{ name:string; blurb:string; price:string; period:string; cta:string }){
  return (
    <div className="rounded-2xl border p-6">
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="mt-1 text-sm text-slate-600">{blurb}</p>
      <div className="mt-6">
        <div className="text-4xl font-extrabold">{price}</div>
        <div className="text-slate-500">{period}</div>
      </div>
      <button className="mt-6 w-full rounded-xl bg-brand-700 py-3 font-semibold text-white">{cta}</button>
    </div>
  )
}
