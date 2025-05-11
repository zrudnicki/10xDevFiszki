import { useState } from "react"

interface UseConfirmDialogProps {
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
}

export function useConfirmDialog({
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
}: UseConfirmDialogProps) {
  const [open, setOpen] = useState(false)

  const openDialog = () => setOpen(true)
  const closeDialog = () => setOpen(false)

  return {
    open,
    openDialog,
    closeDialog,
    dialogProps: {
      open,
      onOpenChange: setOpen,
      onConfirm,
      title,
      description,
      confirmText,
      cancelText,
    },
  }
} 