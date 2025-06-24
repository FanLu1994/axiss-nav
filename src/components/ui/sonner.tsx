"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    const newToast = { id, message, type }
    setToasts(prev => [...prev, newToast])
    
    // 3秒后自动移除
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 3000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg shadow-lg text-white text-sm max-w-sm ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a Toaster')
  }
  return context
}

export const toast = {
  success: (message: string) => {
    // 这里需要访问context，暂时使用简单的alert
    alert(`✅ ${message}`)
  },
  error: (message: string) => {
    alert(`❌ ${message}`)
  },
  info: (message: string) => {
    alert(`ℹ️ ${message}`)
  }
}
