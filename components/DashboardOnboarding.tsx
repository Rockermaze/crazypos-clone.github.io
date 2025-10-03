'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface OnboardingStatus {
  companyInformation: boolean
  storeInformation: boolean
  supplierConnection: boolean
  emailSettings: boolean
  paymentSettings: boolean
  printingSettings: boolean
  addProduct: boolean
  completed: boolean
  skipped: boolean
}

interface OnboardingTask {
  id: keyof OnboardingStatus
  title: string
  description: string
  icon: string
  isRequired: boolean
}

interface DashboardOnboardingProps {
  onOpenTask: (taskId: string) => void
  onGoToPOS: () => void
}

export default function DashboardOnboarding({ onOpenTask, onGoToPOS }: DashboardOnboardingProps) {
  const { data: session } = useSession()
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>({
    companyInformation: false,
    storeInformation: false,
    supplierConnection: false,
    emailSettings: false,
    paymentSettings: false,
    printingSettings: false,
    addProduct: false,
    completed: false,
    skipped: false
  })
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const tasks: OnboardingTask[] = [
    {
      id: 'companyInformation',
      title: 'Company Information',
      description: 'Set up your business details',
      icon: '🏢',
      isRequired: true
    },
    {
      id: 'storeInformation',
      title: 'Store Information',
      description: 'Configure store settings',
      icon: '🏪',
      isRequired: true
    },
    {
      id: 'paymentSettings',
      title: 'Payment Settings',
      description: 'Connect payment gateway',
      icon: '💳',
      isRequired: true
    },
    {
      id: 'addProduct',
      title: 'Add Product',
      description: 'Add your first products',
      icon: '📦',
      isRequired: true
    },
    {
      id: 'supplierConnection',
      title: 'Connect Supplier',
      description: 'Link supplier accounts',
      icon: '🔗',
      isRequired: false
    },
    {
      id: 'emailSettings',
      title: 'Email Settings',
      description: 'Configure notifications',
      icon: '📧',
      isRequired: false
    },
    {
      id: 'printingSettings',
      title: 'Printing Settings',
      description: 'Set up printers',
      icon: '🖨️',
      isRequired: false
    }
  ]

  // Load onboarding status
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/onboarding')
        if (response.ok) {
          const data = await response.json()
          setOnboardingStatus(data.onboardingStatus)
        }
      } catch (error) {
        console.error('Error fetching onboarding status:', error)
        setNotification({ message: 'Failed to load setup status', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchOnboardingStatus()
    }
  }, [session])

  // Update task completion status
  const updateTaskStatus = async (taskId: keyof OnboardingStatus, completed: boolean) => {
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: taskId,
          completed: completed
        })
      })

      if (response.ok) {
        const data = await response.json()
        setOnboardingStatus(data.onboardingStatus)
        setNotification({ 
          message: completed ? 'Task completed!' : 'Task marked incomplete',
          type: 'success' 
        })
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      setNotification({ message: 'Failed to update task', type: 'error' })
    }
  }

  // Skip entire onboarding
  const handleSkipOnboarding = async () => {
    try {
      const response = await fetch('/api/onboarding', {
        method: 'PUT'
      })

      if (response.ok) {
        setNotification({ message: 'Setup skipped. You can complete it later!', type: 'success' })
        setTimeout(() => {
          onGoToPOS()
        }, 1500)
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error)
      setNotification({ message: 'Failed to skip setup', type: 'error' })
    }
  }

  // Calculate progress
  const requiredTasks = tasks.filter(task => task.isRequired)
  const completedRequiredTasks = requiredTasks.filter(task => onboardingStatus[task.id])
  const completedTasks = tasks.filter(task => onboardingStatus[task.id])
  const allRequiredCompleted = completedRequiredTasks.length === requiredTasks.length
  const progressPercentage = Math.round((completedTasks.length / tasks.length) * 100)

  // Clear notification effect
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">Loading setup...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Welcome to CrazyPOS! 🎉
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Let's get your store ready for business in just a few steps
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              Free trial: 12 days remaining
            </div>
            <button 
              onClick={onGoToPOS}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg transition-colors"
            >
              Go to POS →
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Setup Progress
            </span>
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-brand-600 to-brand-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>{completedTasks.length}/{tasks.length} tasks</span>
            <span>{completedRequiredTasks.length}/{requiredTasks.length} required</span>
          </div>
        </div>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`relative p-4 border rounded-xl hover:shadow-md transition-all duration-200 ${
              onboardingStatus[task.id]
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : task.isRequired
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
            }`}
          >
            {/* Status Badge */}
            {onboardingStatus[task.id] && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">{task.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {task.title}
                  </h3>
                  {task.isRequired && !onboardingStatus[task.id] && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {task.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={onboardingStatus[task.id]}
                onChange={(e) => updateTaskStatus(task.id, e.target.checked)}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
              />
              <button
                onClick={() => onOpenTask(task.id)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  onboardingStatus[task.id]
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                }`}
              >
                {onboardingStatus[task.id] ? 'Edit' : 'Set Up'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
        <div className="text-center sm:text-left">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Ready to start selling?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Complete the required tasks or skip setup for now
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleSkipOnboarding}
            className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors"
          >
            Skip Setup
          </button>
          
          <button
            onClick={onGoToPOS}
            disabled={!allRequiredCompleted}
            className={`px-6 py-3 font-medium rounded-lg transition-colors ${
              allRequiredCompleted
                ? 'bg-brand-600 hover:bg-brand-500 text-white'
                : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            }`}
          >
            {allRequiredCompleted ? 'Start Using POS' : 'Complete Required Tasks'}
          </button>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          💡 Quick Tips
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Required tasks ensure basic POS functionality works properly</li>
          <li>• You can access the POS anytime and complete setup later</li>
          <li>• Optional tasks can improve your store management experience</li>
          <li>• All settings can be changed later in the Settings tab</li>
        </ul>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}