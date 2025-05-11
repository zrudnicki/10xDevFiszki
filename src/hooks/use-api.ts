import { useState } from "react"
import { useToast } from "./use-toast"

interface UseApiProps<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useApi<T>({ onSuccess, onError }: UseApiProps<T> = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const execute = async (promise: Promise<T>) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await promise
      onSuccess?.(data)
      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    execute,
  }
} 