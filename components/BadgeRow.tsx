import clsx from 'clsx'
export function BadgeRow({ className }:{ className?: string }){
  return (
    <div className={clsx('grid items-center gap-6 sm:grid-cols-3 md:grid-cols-6', className)}>
      {/* Replace with your own partner/customer logos */}
      {Array.from({length:6}).map((_,i)=> (
        <div key={i} className="h-10 rounded bg-slate-200" />
      ))}
    </div>
  )
}
