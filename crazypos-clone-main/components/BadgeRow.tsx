import clsx from 'clsx'
export function BadgeRow({ className }:{ className?: string }){
  // Key features instead of blank placeholders
  const features = [
    { name: 'Inventory', icon: '📦' },
    { name: 'Sales', icon: '💳' },
    { name: 'Repairs', icon: '🔧' },
    { name: 'Analytics', icon: '📊' },
    { name: 'Multi-Pay', icon: '💰' },
    { name: 'Cloud Sync', icon: '☁️' }
  ]

  return (
    <div className={clsx('grid items-center gap-4 sm:grid-cols-3 md:grid-cols-6', className)}>
      {features.map((feature, i) => (
        <div key={i} className="flex items-center justify-center gap-2 py-3 px-4 text-center">
          <span className="text-xl">{feature.icon}</span>
          <span className="text-sm font-medium text-slate-600">{feature.name}</span>
        </div>
      ))}
    </div>
  )
}
