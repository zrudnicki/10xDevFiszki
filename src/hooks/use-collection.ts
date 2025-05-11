import { useState } from "react"
import { useApi } from "./use-api"
import { useToast } from "./use-toast"

interface Collection {
  id: number
  name: string
  category: string
  cardCount: number
}

interface UseCollectionProps {
  onDelete?: () => void
}

export function useCollection({ onDelete }: UseCollectionProps = {}) {
  const [collections, setCollections] = useState<Collection[]>([])
  const { toast } = useToast()
  const { execute: executeApi, isLoading } = useApi<Collection[]>({
    onSuccess: (data) => {
      setCollections(data)
    },
  })

  const deleteCollection = async (id: number) => {
    try {
      await executeApi(
        fetch(`/api/collections/${id}`, {
          method: "DELETE",
        }).then((res) => res.json())
      )
      toast({
        title: "Sukces",
        description: "Kolekcja została usunięta",
      })
      onDelete?.()
    } catch (error) {
      // Error is handled by useApi
    }
  }

  const createCollection = async (name: string, category: string) => {
    try {
      await executeApi(
        fetch("/api/collections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, category }),
        }).then((res) => res.json())
      )
      toast({
        title: "Sukces",
        description: "Kolekcja została utworzona",
      })
    } catch (error) {
      // Error is handled by useApi
    }
  }

  const updateCollection = async (id: number, name: string, category: string) => {
    try {
      await executeApi(
        fetch(`/api/collections/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, category }),
        }).then((res) => res.json())
      )
      toast({
        title: "Sukces",
        description: "Kolekcja została zaktualizowana",
      })
    } catch (error) {
      // Error is handled by useApi
    }
  }

  return {
    collections,
    isLoading,
    deleteCollection,
    createCollection,
    updateCollection,
  }
} 