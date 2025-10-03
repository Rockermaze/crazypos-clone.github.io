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

interface OnboardingDashboardProps {
  onSkipOnboarding: () => void
  onCompleteOnboarding: () => void
  onOpenTask: (taskId: string) => void
}

export default function OnboardingDashboard({ 
  onSkipOnboarding, 
  onCompleteOnboarding,
  onOpenTask 
}: OnboardingDashboardProps) {
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
      description: 'Set up your business details and contact information',
      icon: '🏢',
      isRequired: true
    },
    {
      id: 'storeInformation',
      title: 'Store Information',
      description: 'Configure your store settings and preferences',
      icon: '🏪',
      isRequired: true
    },
    {
      id: 'supplierConnection',
      title: 'Connect to your supplier',
      description: 'Link your supplier accounts for inventory management',
      icon: '🔗',
      isRequired: false
    },
    {
      id: 'emailSettings',
      title: 'Email settings',
      description: 'Configure email notifications and receipts',
      icon: '📧',
      isRequired: false
    },
    {
      id: 'paymentSettings',
      title: 'Payments settings',
      description: 'Set up payment gateways and processing options',
      icon: '💳',
      isRequired: true
    },
    {
      id: 'printingSettings',
      title: 'Printing settings',
      description: 'Configure receipt and label printers',
      icon: '🖨️',
      isRequired: false
    },
    {
      id: 'addProduct',
      title: 'Add product',
      description: 'Add your first products to get started',
      icon: '📦',
      isRequired: true
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
        setNotification({ message: 'Failed to load onboarding status', type: 'error' })
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
          message: completed ? 'Task marked as completed!' : 'Task marked as incomplete',
          type: 'success' 
        })
      } else {
        throw new Error('Failed to update task status')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      setNotification({ message: 'Failed to update task status', type: 'error' })
    }
  }

  // Skip entire onboarding
  const handleSkipOnboarding = async () => {
    try {
      const response = await fetch('/api/onboarding', {
        method: 'PUT'
      })

      if (response.ok) {
        setNotification({ message: 'Onboarding skipped successfully!', type: 'success' })
        setTimeout(() => {
          onSkipOnboarding()
        }, 1000)
      } else {
        throw new Error('Failed to skip onboarding')
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error)
      setNotification({ message: 'Failed to skip onboarding', type: 'error' })
    }
  }

  // Check if all required tasks are completed
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-700 dark:border-brand-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Loading onboarding...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Welcome to CrazyPOS! 
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Let's get your store set up in just a few minutes
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                You're on a free trial! Enjoy Crazy POS for 12 days.{' '}
                <button className="text-brand-600 hover:text-brand-500 font-medium">
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Setup Progress
            </h2>
            <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {progressPercentage}%
            </span>
          </div>
          
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-brand-600 to-brand-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>{completedTasks.length} of {tasks.length} tasks completed</span>
            <span>{completedRequiredTasks.length} of {requiredTasks.length} required tasks</span>
          </div>
        </div>

        {/* Task Board */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100">
            Task Board
          </h2>

          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={onboardingStatus[task.id]}
                      onChange={(e) => updateTaskStatus(task.id, e.target.checked)}
                      className="h-5 w-5 text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-600 rounded"
                    />
                  </div>
                  
                  <div className="text-2xl">{task.icon}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        {task.title}
                      </h3>
                      {task.isRequired && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {task.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenTask(task.id)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg transition-colors"
                >
                  Set Up
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleSkipOnboarding}
              className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors"
            >
              Skip for now
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={onCompleteOnboarding}
                disabled={!allRequiredCompleted}
                className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                  allRequiredCompleted
                    ? 'bg-brand-600 hover:bg-brand-500 text-white'
                    : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                }`}
              >
                {allRequiredCompleted ? 'Continue to Dashboard' : 'Complete Required Tasks'}
              </button>
            </div>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Quick Tips
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• You can skip non-required tasks and set them up later in Settings</li>
            <li>• Required tasks are needed for basic POS functionality</li>
            <li>• Your progress is saved automatically</li>
          </ul>
        </div>
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