"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error silently - could be sent to monitoring service
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-card p-8 shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">حدث خطأ ما</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                عذراً، حدث خطأ غير متوقع
              </p>
            </div>
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Smaller inline error fallback for components
export function ErrorFallback({ 
  onRetry, 
  message = "حدث خطأ" 
}: { 
  onRetry?: () => void
  message?: string 
}) {
  return (
    <div className="flex items-center justify-center rounded-xl bg-destructive/5 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <p className="text-sm text-destructive">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <RefreshCw className="h-3 w-3" />
            إعادة المحاولة
          </button>
        )}
      </div>
    </div>
  )
}
