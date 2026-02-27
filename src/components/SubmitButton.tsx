'use client'

import { useFormStatus } from 'react-dom'

interface SubmitButtonProps {
    text: string
    loadingText?: string
    className?: string
    isLoading?: boolean
}

export default function SubmitButton({ text, loadingText = 'Laden...', className = '', isLoading }: SubmitButtonProps) {
    const { pending: statusPending } = useFormStatus()
    const pending = isLoading !== undefined ? isLoading : statusPending

    return (
        <button
            type="submit"
            disabled={pending}
            className={`
                px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300
                flex items-center justify-center gap-2
                ${pending
                    ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-white/10'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98] border border-emerald-400/20'
                }
                ${className}
            `}
        >
            {pending && (
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            <span>{pending ? loadingText : text}</span>
        </button>
    )
}
