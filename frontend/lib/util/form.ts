import React from 'react'

export function handleForm(cb: (data: FormData) => void | Promise<void>) {
  return async (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget as HTMLFormElement)

    formData.set('redirect', '')

    await cb(formData)
  }
}

export function except(cb: () => void): string | null {
  try {
    cb()
    return null
  } catch (e) {
    return (e as Error).message
  }
}

export default handleForm
