'use client'
import { useState } from 'react'
import type { RepairTicket, RepairsSectionProps } from '@/types/repair'
import { RepairCategoriesSection } from './RepairCategoriesSection'
import { RepairTicketsSection } from './RepairTicketsSection'

export function RepairsSection({ repairs, onAddRepair }: RepairsSectionProps) {
  const [activeTab, setActiveTab] = useState('categories')

  const tabs = [
    { id: 'categories', label: 'Categories', icon: '🏷️', description: 'Manage repair types' },
    { id: 'tickets', label: 'Repair Tickets', icon: '🎫', description: 'Track repair jobs' }
  ]

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
        {/* Tab Navigation */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-600 text-brand-700 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {activeTab === 'categories' ? 'Manage repair types & pricing' : 'Track repair jobs & status'}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'categories' && (
            <RepairCategoriesSection />
          )}
          
          {activeTab === 'tickets' && (
            <RepairTicketsSection 
              repairs={repairs}
              onAddRepair={onAddRepair}
            />
          )}
        </div>
      </div>
    </div>
  )
}
