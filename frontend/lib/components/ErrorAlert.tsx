import React from 'react'
import { ErrorObject } from '../util/types'
import { Cancel } from 'iconoir-react'

const ErrorAlert: React.FC<{
  error?: ErrorObject
  dismissable?: boolean
  onDismiss?: () => void
}> = ({ error, dismissable = false, onDismiss = () => {} }) => {
  if (!error) return null
  return (
    <div className="rounded-xl border-2 border-white bg-error px-4 py-2 text-white">
      <h2 className="mb-4 flex items-center justify-between text-2xl font-medium">
        Error: {error.error}
        {dismissable && (
          <button
            className="cursor-pointer border-none bg-inherit opacity-50 outline-none transition-opacity duration-200 hover:opacity-60"
            aria-label="Close"
            title="Close"
            onClick={onDismiss}
          >
            <Cancel strokeWidth={4} width={20} height={20} />
          </button>
        )}
      </h2>
      <p className="text-xl">{error.error_description}</p>
    </div>
  )
}

export default ErrorAlert
