import { ReactNode } from 'react'
export function FeatureCard({ icon, title, body }:{ icon?: ReactNode; title:string; body:string }){
  return (
    <div className="rounded-2xl border p-5">
      <div className="text-2xl">{icon ?? '★'}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  )
}
