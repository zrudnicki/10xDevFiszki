import { useState } from "react"

interface UseTextInputProps {
  minLength?: number
  onSubmit: (text: string) => void
}

export function useTextInput({
  minLength = 1000,
  onSubmit,
}: UseTextInputProps) {
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (value: string) => {
    setText(value)
  }

  const handleSubmit = async () => {
    if (text.length < minLength) return

    setIsSubmitting(true)
    try {
      await onSubmit(text)
      setText("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSubmitDisabled = text.length < minLength || isSubmitting

  return {
    text,
    handleChange,
    handleSubmit,
    isSubmitDisabled,
    isSubmitting,
    minLength,
  }
} 