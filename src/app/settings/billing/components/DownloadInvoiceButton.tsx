'use client'

import { generateInvoicePdf } from '@/utils/generateInvoicePdf'

interface Invoice {
    id: string
    date: string
    amount: string
    status: string
    document?: string
}

interface DownloadInvoiceButtonProps {
    invoice: Invoice
    className?: string
}

export default function DownloadInvoiceButton({ invoice, className = '' }: DownloadInvoiceButtonProps) {
    const defaultClasses = className ? className : "p-2 w-10 h-10 inline-flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-white hover:bg-[#0df2a2] transition-colors"
    const textClasses = className ? className : "flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-300 hover:text-white hover:bg-[#0df2a2] transition-colors font-bold text-xs"

    // As multiple pages use this component differently, we'll try to guess styling based on if text is needed
    // The history page uses a button with text "PDF", while the main page uses an icon button.
    const hasText = className.includes('w-full') || className.includes('text-xs')

    // In Page 1, it passes no className, using default icon
    // In Page 2 (history list), it passes no className, wait no it doesn't pass text. I'll just use the default icon button if no text is needed.
    // Wait, the history page passed nothing for desktop table, and "w-full" for mobile. Let me adjust.

    const isFullWidth = className.includes('w-full')
    const isHistoryTable = className === '' && !isFullWidth // Wait, if I want to have text "PDF" for history table, I need to pass a specific prop or use default styles.
    // Let's use a simpler approach: always render generic button if classes are passed, else render icon.

    const handleDownload = () => {
        try {
            generateInvoicePdf(invoice)
        } catch (error) {
            console.error('Failed to generate PDF:', error)
            alert('Er is een fout opgetreden bij het genereren van de PDF.')
        }
    }

    if (className) {
        return (
            <button onClick={handleDownload} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold text-sm ${className}`}>
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download PDF
            </button>
        )
    }

    return (
        <button onClick={handleDownload} className="p-2 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-white hover:bg-[#0df2a2] transition-colors mx-auto md:mx-0 md:ml-auto">
            <span className="material-symbols-outlined text-[18px]">download</span>
        </button>
    )
}
